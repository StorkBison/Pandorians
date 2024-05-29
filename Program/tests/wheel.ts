import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import {
  promiseWithTimeout,
  SwitchboardTestContext,
} from "@switchboard-xyz/sbv2-utils";
import {
  AnchorWallet,
  Callback,
  PermissionAccount,
  ProgramStateAccount,
  SwitchboardPermission,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2";
import { SpinRequest } from "../client/accounts";
import { Wheel } from "../target/types/wheel";
import { BN } from "bn.js";

describe("wheel", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Wheels doesn't close, so we should increase this counter.
  const wheelId = 4;

  const program = anchor.workspace.Wheel as Program<Wheel>;
  const payer = (provider.wallet as AnchorWallet).payer;

  let switchboard: SwitchboardTestContext;

  // How does it used?
  const vrfSecret = anchor.web3.Keypair.generate();

  let userNativeTokenAccount, userTicketAccount;

  // OpenRequest
  const [spinRequest, spinRequestBump] = anchor.utils.publicKey.findProgramAddressSync(
    [
      Buffer.from("SPIN"),
      vrfSecret.publicKey.toBytes(),
      toBytesInt16(wheelId)
    ],
    program.programId
  );

  // Wheel Authority / State
  const wheelState = anchor.utils.publicKey.findProgramAddressSync(
    [
      Buffer.from("STATE"),
      toBytesInt16(wheelId)
    ],
    program.programId
  )[0];

  const wheelWallet = anchor.utils.publicKey.findProgramAddressSync(
    [
      Buffer.from("WALLET"),
      toBytesInt16(wheelId)
    ],
    program.programId
  )[0];

  // Ticket for a wheel (mint ticket)
  const ticketMint = anchor.utils.publicKey.findProgramAddressSync(
    [
      Buffer.from("TICKET"),
      toBytesInt16(wheelId)
    ],
    program.programId
  )[0];

  // Staking Stuff
  const stakingProgram = new PublicKey("3wqC2rrgQLLR5RhfPHukQYhuASp5Pvrd39WRjUV9kACD");

  const stakingState = anchor.utils.publicKey.findProgramAddressSync(
    [
      Buffer.from("STAKING"),
      toBytesInt16(2)
    ],
    stakingProgram
  )[0];

  const stakingWallet = anchor.utils.publicKey.findProgramAddressSync(
    [
      Buffer.from("WALLET"),
      toBytesInt16(2)
    ],
    stakingProgram
  )[0];

  const wheelIxCoder = new anchor.BorshInstructionCoder(program.idl);
  const spinRequestCallback: Callback = {
    programId: program.programId,
    accounts: [
      // ensure all accounts in open are populated
      { pubkey: wheelState, isSigner: false, isWritable: true },
      { pubkey: spinRequest, isSigner: false, isWritable: true },
      { pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false },
    ],
    ixData: wheelIxCoder.encode("show", { params: { wheelId } }), // pass any params for instruction here
  };

  before(async () => {
    switchboard = await SwitchboardTestContext.loadDevnetQueue(
      provider,
      "F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy",
      5_000_000 // .005 wSOL
    );

    userNativeTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      spl.NATIVE_MINT,
      payer.publicKey
    );
  });

  it("Creates a fortune's wheel", async () => {
    return;
    await program.methods.init!({
      escrow: userNativeTokenAccount.address,
      price: new BN(5000),
      prizes: [
        {
          amount: new BN(2500),
          cost: new BN(1250),
          escrow: null,
          probability: 0.5,
          token: spl.NATIVE_MINT
        },
        {
          amount: new BN(5000),
          cost: new BN(2500),
          escrow: null,
          probability: 0.5,
          token: spl.NATIVE_MINT
        }
      ],
      wheelId
    })
    .accounts({
      wheelState,
      wheelWallet,
      nativeMint: spl.NATIVE_MINT,
      ticketMint,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc()
    .then((sig) => {
      console.log(`Init tx: ${sig}`);
    });
  });

  it("Mints one ticket", async () => {
    userTicketAccount = await spl.getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      ticketMint,
      payer.publicKey
    );

    await program.methods.mint!({
      amount: 1,
      wheelId
    })
    .accounts({
      wheelState,
      wheelWallet,
      escrow: userNativeTokenAccount.address,
      ticketMint,
      userAuthority: payer.publicKey,
      userTicketAccount: userTicketAccount.address,
      stakingState,
      stakingWallet,
      stakingProgram,
      systemProgram: SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    })
    .rpc()
    .then((sig) => {
      console.log(`Mint tx: ${sig}`);
    });
  });

  it("Spins the wheel", async () => {
    return;
    const queue = switchboard.queue;
    const { unpermissionedVrfEnabled, authority, dataBuffer } =
      await queue.loadData();

    // Create Switchboard VRF and Permission account
    const vrfAccount = await VrfAccount.create(switchboard.program, {
      queue,
      callback: spinRequestCallback,
      authority: wheelState,
      keypair: vrfSecret,
    });
    console.log(`Created VRF Account: ${vrfAccount.publicKey}`);

    const permissionAccount = await PermissionAccount.create(
      switchboard.program,
      {
        authority,
        granter: queue.publicKey,
        grantee: vrfAccount.publicKey,
      }
    );
    console.log(`Created Permission Account: ${permissionAccount.publicKey}`);

    // If queue requires permissions to use VRF, check the correct authority was provided
    if (!unpermissionedVrfEnabled) {
      if (!payer.publicKey.equals(authority)) {
        throw new Error(
          `queue requires PERMIT_VRF_REQUESTS and wrong queue authority provided`
        );
      }

      await permissionAccount.set({
        authority: payer,
        permission: SwitchboardPermission.PERMIT_VRF_REQUESTS,
        enable: true,
      });
      console.log(`Set VRF Permissions`);
    }

    // Get required switchboard accounts
    const [programStateAccount, programStateBump] =
      ProgramStateAccount.fromSeed(switchboard.program);
    const [permissionKey, permissionBump] = PermissionAccount.fromSeed(
      switchboard.program,
      authority,
      queue.publicKey,
      vrfAccount.publicKey
    );
    const { escrow } = await vrfAccount.loadData();

    await program.methods.spin!({
      switchboardStateBump: programStateBump,
      permissionBump,
      wheelId
    })
    .accounts({
      wheelState,
      wheelWallet,
      ticketMint,
      spinRequest,
      userAuthority: payer.publicKey,
      userTicketAccount: userTicketAccount.address,
      vrf: vrfAccount.publicKey,
      oracleQueue: queue.publicKey,
      queueAuthority: authority,
      dataBuffer,
      permission: permissionAccount.publicKey,
      escrow,
      programState: programStateAccount.publicKey,
      recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
      switchboardProgram: switchboard.program.programId,
      systemProgram: SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    })
    .rpc()
    .then((sig) => {
      console.log(`Spin tx: ${sig}`);
    });

    console.log(`Waiting updates of ${ spinRequest.toBase58() }`);
    const result = await awaitCallback(
        program.provider.connection,
        spinRequest,
        55_000
      );
  
    console.log(`SpinRequest Result: ${JSON.stringify(result)}`);
  });

  it("Takes a reward", async () => {
    return;
    await program.methods.take!({
      wheelId
    })
    .accounts({
      wheelState,
      wheelTokenAccount: wheelWallet,
      wheelWallet,
      spinRequest,
      prizeEscrow: userNativeTokenAccount.address,
      tokenMint: spl.NATIVE_MINT,
      userAuthority: payer.publicKey,
      userTokenAccount: userNativeTokenAccount.address,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    })
    .rpc()
    .then((sig) => {
      console.log(`Take tx: ${sig}`);
    });
  });

});

function toBytesInt16(num) {
  return Buffer.from([(num & 0xff00) >> 8, num & 0x00ff]);
}

async function awaitCallback(
  connection: anchor.web3.Connection,
  openRequestKey: anchor.web3.PublicKey,
  timeoutInterval: number,
  errorMsg = "Timed out waiting for VRF Client callback"
) {
  let ws: number | undefined = undefined;
  const result: SpinRequest = await promiseWithTimeout(
    timeoutInterval,
    new Promise(
      (
        resolve: (result: SpinRequest) => void,
        reject: (reason: string) => void
      ) => {
        ws = connection.onAccountChange(
          openRequestKey,
          async (
            accountInfo: anchor.web3.AccountInfo<Buffer>,
            context: anchor.web3.Context
          ) => {
            const clientState = SpinRequest.decode(accountInfo.data);
            if (clientState.result != 0) {
              resolve(clientState);
            }
          }
        );
      }
    ).finally(async () => {
      if (ws) {
        await connection.removeAccountChangeListener(ws);
      }
      ws = undefined;
    }),
    new Error(errorMsg)
  ).finally(async () => {
    if (ws) {
      await connection.removeAccountChangeListener(ws);
    }
    ws = undefined;
  });

  return result;
}
