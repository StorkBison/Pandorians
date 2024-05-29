import { Program, BorshInstructionCoder } from '@project-serum/anchor';
import { SystemProgram, PublicKey, Keypair, SYSVAR_RENT_PUBKEY, SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from '@solana/web3.js';
import * as borsh from "@project-serum/borsh";
import { Orao, networkStateAccountAddress, randomnessAccountAddress } from "@orao-network/solana-vrf";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as spl from "@solana/spl-token-v2";
import idl from './idl/wheel.json';
import { config_wheels } from '../config/Config_wheels';
import { OG_MINT_KEY, WL_MINT_KEY } from '../config';
import { sleep } from './utils';

class Wheel {
  constructor( { id, lamports, key, ticket, Prohibitions }, provider ) {

    this.provider = provider;
    this.wheelId = id;
    this.lamports = lamports;
    this.key = key;
    this.Prohibitions = Prohibitions;
    this.wheelIdSeed = [ ( id & 0xff00 ) >> 8, id & 0x00ff ];
    this.wheelIxCoder = new BorshInstructionCoder( idl );
    // program
    this.programId = new PublicKey( 'Fky46ut985HRdKzbfByrdQwvNGT6Ef4HpqddTTabdLnU' );
    this.program = new Program( idl, this.programId, provider );

    // accounts
    this.ticketMint = new PublicKey( ticket );
    this.wheelState = this.#getPDA( [ "STATE", this.wheelIdSeed ] )[ 0 ];
    this.globalState = this.#getPDA( [ 'GLOBAL' ] )[ 0 ];
    this.globalEscrow = new PublicKey( "4pA5rpKycVWgkjPoEwHpjtiZLC69LkyfvPebA6dFW6cy" );
  }

  /**
   * `buyTickets` buys tickets for the user, using the `mint` method of the `Wheel` program
   * @param [amount=1] - The number of tickets to buy.
   */
  async buyTickets ( amount = 1 ) {
    const ticketAccount = await this.#getTicketAccount();
    const wheelState = await this.#getWheelState();
    console.log( `Buying ${ amount } ticket(-s) for ${ amount * wheelState.price } lamports...` );
    await this.program.methods.mint( {
      amount,
      wheelId: this.wheelId
    } )
      .accounts( {
        wheelState: this.wheelState,
        globalState: this.globalState,
        escrow: this.globalEscrow,
        wheelTokenAccount: this.#getAssociatedTokenAddress( wheelState.ticketMint, this.globalState )[ 0 ],
        ticketMint: wheelState.ticketMint,
        userAuthority: this.#getPayer(),
        userTicketAccount: this.#getAssociatedTokenAddress( wheelState.ticketMint )[ 0 ],
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      } )
      .preInstructions( ticketAccount != null ? [] : [
        spl.createAssociatedTokenAccountInstruction(
          this.#getPayer(),
          this.#getAssociatedTokenAddress( this.ticketMint )[ 0 ],
          this.#getPayer(),
          this.ticketMint
        )
      ] )
      .rpc( { skipPreflight: true } )
      .then( ( sig ) => {
        console.log( `Purchase tx: ${ sig }` );
      } );
  }

  /**
   * It returns the number of tickets owned by the user
   * @returns The number of tickets in the ticket account.
   */
  async getTicketsCount () {
    const ticketAccount = await this.#getTicketAccount();
    return ticketAccount?.data.parsed.info.tokenAmount.amount ?? 0;
  }

  /**
   * `spin2` sends a spin request and waits for result from VRF provider.
   */
  async spin ( setStatus ) {
    if ( localStorage.getItem( this.wheelState ) != null ) {
      throw Error( "You should take your reward from prev spin!" );
    }
    const vrfSecret = Keypair.generate();
    const vrf = new Orao( this.provider );
    // const spinRequest = this.#getPDA( [ "SPIN", vrfSecret.publicKey, this.wheelIdSeed ] )[ 0 ];

    const random = randomnessAccountAddress( vrfSecret.publicKey.toBuffer() );
    const state = await vrf.getNetworkState();
    await this.program.methods.spin( {
      wheelId: this.wheelId,
      force: [ ...vrfSecret.publicKey.toBuffer() ]
    } )
      .accounts( {
        wheelState: this.wheelState,
        ticketMint: this.ticketMint,
        userTicketAccount: this.#getAssociatedTokenAddress( this.ticketMint )[ 0 ],
        payer: this.#getPayer(),
        random,
        treasury: state.config.treasury,
        config: networkStateAccountAddress(),
        vrf: vrf.programId,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      } )
      .rpc()
      .then( ( sig ) => {
        console.log( `Spin2 tx: ${ sig }` );
        setStatus( 'PENDING' );
      } );
    await sleep( 1500 );
    // store vrfSecret in browser storage.
    localStorage.setItem( this.wheelState, vrfSecret.publicKey.toBase58() );
    let randomness = await vrf.waitFulfilled( vrfSecret.publicKey.toBuffer() );
    return randomness;
  }

  async getWheelState () {
    const wheelState = await this.#getWheelState();
    return wheelState;
  }

  /** [DEPRECATED] */
  async takePrize () {
    const vrfSecret = localStorage.getItem( this.wheelState );
    const vrf = new Orao( this.provider );
    if ( vrfSecret == null ) {
      throw Error( "Nothing to take!" );
    }
    const vrfSecretPublicKey = new PublicKey( vrfSecret );
    const random = randomnessAccountAddress( vrfSecretPublicKey.toBuffer() );
    let randomness = await vrf.waitFulfilled( vrfSecretPublicKey.toBuffer() );
    const firstFourBytes = randomness.randomness.subarray( 0, 4 );
    const view = new DataView( firstFourBytes.buffer );
    let u32 = view.getUint32( 0, true );
    let limit = 0;
    let result = 0;
    let prizez = this.Prohibitions;
    for ( let i = 0; i <= 6; i++ ) {
      limit += prizez[ i ] * 4294967295;
      if ( u32 < limit ) {
        result = i;
        break;
      }
    }

    for ( let i = 0; i < result; i++ ) {
      u32 -= prizez[ i ] * 4294967295;
    }

    let token_mint = "";
    if ( result === 3 ) {
      limit = 0.1 * 4294967295 * prizez[ result ];
      if ( u32 < limit ) {
        token_mint = WL_MINT_KEY;
      } else {
        limit += 0.05 * 4294967295 * prizez[ result ];
        if ( u32 < limit )
          token_mint = OG_MINT_KEY;
      }
    } else if ( result === 2 ) {
      token_mint = this.key;
    } else {
      token_mint = config_wheels.legendary.key;
    }
    if ( token_mint === "" ) token_mint = config_wheels.legendary.key;

    const ticketAccount = this.#getAssociatedTokenAddress( new PublicKey( token_mint ) )[ 0 ];
    const accountInfo = await this.provider.connection.getParsedAccountInfo( ticketAccount );
    const sig = await this.program.methods.take( {
      wheelId: this.wheelId,
      force: [ ...vrfSecretPublicKey.toBuffer() ]
    } )
      .accounts( {
        wheelState: this.wheelState,
        wheelTokenAccount: this.#getAssociatedTokenAddress( new PublicKey( token_mint ), this.globalState )[ 0 ],
        globalState: this.globalState,
        random: random,
        escrow: this.globalEscrow,
        tokenMint: new PublicKey( token_mint ),
        userAuthority: this.#getPayer(),
        userTokenAccount: this.#getAssociatedTokenAddress( new PublicKey( token_mint ) )[ 0 ],
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        recentBlockhash: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
      } )
      .preInstructions( accountInfo.value != null ? [] : [
        spl.createAssociatedTokenAccountInstruction(
          this.#getPayer(),
          this.#getAssociatedTokenAddress( new PublicKey( token_mint ) )[ 0 ],
          this.#getPayer(),
          new PublicKey( token_mint )
        )
      ] )
      .rpc();
    console.log( `Take tx: ${ sig }` );
    localStorage.removeItem( this.wheelState );
    return sig;
  }

  #getAssociatedTokenAddress ( mint, owner = this.#getPayer() ) {
    return this.#getPDA( [ owner, TOKEN_PROGRAM_ID, mint ], ASSOCIATED_TOKEN_PROGRAM_ID );
  }

  #getPDA ( seeds, programId = this.programId ) {
    return PublicKey.findProgramAddressSync( seeds.map( s => !!s && s.toBuffer != null ? s.toBuffer() : Buffer.from( s ) ), programId );
  }

  #getPayer () {
    return this.provider.wallet.publicKey;
  }

  async #getTicketAccount () {
    const address = this.#getAssociatedTokenAddress( this.ticketMint )[ 0 ];
    const accountInfo = await this.provider.connection.getParsedAccountInfo( address );
    return accountInfo.value;
  }

  async #getWheelState () {
    const account = await this.program.account.wheelState.getAccountInfo( this.wheelState );
    const layout = borsh.struct( [
      borsh.publicKey( "escrow" ),
      borsh.publicKey( "ticketMint" ),
      borsh.bool( "mintable" ),
      borsh.u64( "price" ),
      borsh.array(
        borsh.struct( [
          borsh.u64( "amount" ),
          borsh.u64( "cost" ),
          borsh.publicKey( "escrow" ),
          borsh.f32( "probability" ),
          borsh.publicKey( "token" )
        ] ), 6, "prizes" ),
    ] );
    return layout.decode( account.data, 8 );
  }
}

export { Wheel };
