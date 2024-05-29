import { Program, BorshInstructionCoder } from "@project-serum/anchor";
import {
  SystemProgram,
  PublicKey,
  Keypair,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import * as borsh from "@project-serum/borsh";
import {
  Orao,
  networkStateAccountAddress,
  randomnessAccountAddress,
} from "@orao-network/solana-vrf";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token
} from "@solana/spl-token";
import idl from "./idl/p_box.json";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { TOKEN_METADATA_PROGRAM_ID, authorizationRulesProgram } from "../config";
import { sleep } from "./utils";

class Box {
  constructor( { id, key }, provider ) {
    this.provider = provider;

    this.boxId = id;
    this.key = key;
    this.boxIdSeed = [ ( id & 0xff00 ) >> 8, id & 0x00ff ];
    this.boxIxCoder = new BorshInstructionCoder( idl );

    // program
    this.programId = new PublicKey(
      "9RjbXvVXJpFQDgL3RWxCaac4tj1fLuiBcWGGzifHz5Zr"
    );
    this.program = new Program( idl, this.programId, provider );

    // other tools
    this.metaplex = new Metaplex( this.provider.connection );

    // accounts
    this.boxState = this.#getPDA( [ "BOX", this.boxIdSeed ] )[ 0 ];
  }

  async getKeysCount () {
    const keyAccount = await this.#getKeyAccount();
    return keyAccount?.data.parsed.info.tokenAmount.amount ?? 0;
  }

  async findTokenRecordPda (
    mint,
    token,
  ) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from( "metadata" ),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from( "token_record" ),
        token.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[ 0 ];
  }

  async getPrizes () {
    const tokens = Object.assign(
      {},
      ...(
        await this.metaplex.nfts().findAllByOwner( {
          owner: this.boxState,
        } )
      ).map( ( x ) => ( { [ x.mintAddress ]: x } ) )
    );
    const state = await this.#getBoxState();
    const prizes = {};
    for ( let i = 0; i < 256; i++ ) {
      if ( state.slots[ i ] !== 0 ) {
        let address = this.#getPDA( [
          "TOKEN",
          this.boxIdSeed,
          [ ( state.slots[ i ] & 0xff00 ) >> 8, state.slots[ i ] & 0x00ff ],
        ] )[ 0 ];
        let account = await this.provider.connection.getParsedAccountInfo(
          address
        );
        try {
          const prize = tokens[ account.value.data.parsed.info.mint ];
          try {
            const data = await (
              await fetch( prize.uri.replace( "ipfs.infura.io", "infura-ipfs.io" ) )
            ).json();
            prize.json = data;
          } catch ( e ) {

          }
          prizes[ state.slots[ i ] ] = { ...prize, tokenId: state.slots[ i ] };
        } catch ( e ) {
          console.error( e );
        }
      }
    }
    console.log( prizes );
    return prizes;
  }

  async openBox () {
    const vrfSecret = Keypair.generate();
    const vrf = new Orao( this.provider );
    const random = randomnessAccountAddress( vrfSecret.publicKey.toBuffer() );
    const state = await vrf.getNetworkState();
    const keyMint = new PublicKey( this.key );
    await this.program.methods.open( {
      boxId: this.boxId,
      force: [ ...vrfSecret.publicKey.toBuffer() ]
    } )
      .accounts( {
        boxState: this.boxState,
        keyMint,
        userAuthority: this.#getPayer(),
        userKeyAccount: await this.#getATA( keyMint ),
        random,
        treasury: state.config.treasury,
        config: networkStateAccountAddress(),
        vrf: vrf.programId,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      } )
      .rpc()
      .then( ( sig ) => {
        console.log( `Open box tx: ${ sig }` );
      } );

    // store vrfSecret in browser storage.
    localStorage.setItem( this.boxState, vrfSecret.publicKey.toBase58() );
    await sleep( 1300 );
    let randomness = await vrf.waitFulfilled( vrfSecret.publicKey.toBuffer() );
    const boxState = await this.#getBoxState();
    const offset = randomness.randomness[ 0 ];
    let tokenId = 0;
    for ( let i = offset; i < 255 + offset + 1; i++ ) {
      if ( boxState.slots[ i % 255 ] !== 0 ) {
        tokenId = boxState.slots[ i % 255 ];
        break;
      }
    }
    return tokenId;
  }

  async takeFromBox () {
    const vrf = new Orao( this.provider );

    const vrfSecret = localStorage.getItem( this.boxState );
    if ( vrfSecret == null ) {
      return;
    }

    const vrfSecretPublicKey = new PublicKey( vrfSecret );
    const random = randomnessAccountAddress( vrfSecretPublicKey.toBuffer() );
    const randomness = await vrf.waitFulfilled( vrfSecretPublicKey.toBuffer() );

    // determine NFT address (as smart contract does)
    let tokenId;

    const state = await this.#getBoxState();
    const offset = randomness.randomness[ 0 ];
    for ( let i = offset; i < 255 + offset + 1; i++ ) {
      if ( state.slots[ i % 255 ] !== 0 ) {
        tokenId = state.slots[ i % 255 ];
        break;
      }
    }

    const boxTokenAccount = this.#getPDA( [
      "TOKEN",
      this.boxIdSeed,
      [ ( tokenId & 0xff00 ) >> 8, tokenId & 0x00ff ],
    ] )[ 0 ];
    let account = await this.provider.connection.getParsedAccountInfo(
      boxTokenAccount
    );
    const mint = new PublicKey( account.value.data.parsed.info.mint );
    const [ metadata ] = await PublicKey.findProgramAddress(
      [
        Buffer.from( "metadata" ),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );

    let metadataInfo = await Metadata.fromAccountAddress( this.provider.connection, metadata );

    const masterEdition = (
      await PublicKey.findProgramAddress(
        [
          Buffer.from( "metadata" ),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
          Buffer.from( "edition" ),
        ],
        TOKEN_METADATA_PROGRAM_ID,
      )
    )[ 0 ];

    const userTokenAccount = Keypair.generate();
    const ownerTokenRecord = await this.findTokenRecordPda( mint, boxTokenAccount );
    const destinationTokenRecord = await this.findTokenRecordPda(
      mint,
      userTokenAccount.publicKey,
    );
    const additionalComputeBudgetInstruction =
      ComputeBudgetProgram.requestUnits( {
        units: 800000,
        additionalFee: 0,
      } );

    await this.program.methods
      .take( {
        boxId: this.boxId,
        tokenId,
        force: [ ...vrfSecretPublicKey.toBuffer() ],
      } )
      .accounts( {
        boxState: this.boxState,
        random,
        userAuthority: this.#getPayer(),
        boxTokenAccount: boxTokenAccount,
        tokenInfo: userTokenAccount.publicKey,
        tokenMintInfo: mint,
        metadataInfo: metadata,
        ownerTokenRecord,
        destinationTokenRecord,
        edition: masterEdition,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        splAtaProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        authorizationRulesProgram: authorizationRulesProgram,
        authorizationRules: metadataInfo.programmableConfig.ruleSet,
      } )
      .signers( [ userTokenAccount ] )
      .preInstructions( [ additionalComputeBudgetInstruction ] )
      .rpc()
      .then( ( sig ) => {
        console.log( `Take from box tx: ${ sig }` );
      } );

    // clear vrfSecret
    localStorage.removeItem( this.boxState );
  }

  isPending () {
    return localStorage.getItem( this.boxState ) !== null;
  }

  #getATA ( mint, owner = this.#getPayer() ) {
    return Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      owner,
    );
  }

  #getPDA ( seeds, programId = this.programId ) {
    return PublicKey.findProgramAddressSync(
      seeds.map( ( s ) => ( s.toBuffer != null ? s.toBuffer() : Buffer.from( s ) ) ),
      programId
    );
  }

  #getPayer () {
    return this.provider.wallet.publicKey;
  }

  async #getKeyAccount () {
    const address = await this.#getATA( new PublicKey( this.key ) );
    const accountInfo = await this.provider.connection.getParsedAccountInfo(
      address
    );
    return accountInfo.value;
  }

  async #getBoxState () {
    const account = await this.program.account.boxState.getAccountInfo(
      this.boxState
    );
    const layout = borsh.struct( [
      borsh.u16( "nextId" ),
      borsh.array( borsh.u16(), 256, "slots" ),
      borsh.publicKey( "keyMint" )
    ] );
    return layout.decode( account.data, 8 );
  }
}

export { Box };
