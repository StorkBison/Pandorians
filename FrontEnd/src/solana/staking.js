import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { Metaplex } from '@metaplex-foundation/js';
import { PublicKey, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, SYSVAR_RENT_PUBKEY, SystemProgram } from '@solana/web3.js';
import idl from './idl/staking.json';
import { sendTransactions } from './utils';

class Staking {
  constructor( provider ) {
    this.provider = provider;

    this.stakingId = 4;
    this.stakingIdSeed = [ ( this.stakingId & 0xff00 ) >> 8, this.stakingId & 0x00ff ];

    // program
    this.programId = new PublicKey( '3mfvmbDyHsPWvsH41EQ4EzjDGDAnNDdbYXLFGP5YsqoG' );
    this.program = new Program( idl, this.programId, provider );

    // other tools
    this.metaplex = new Metaplex( this.provider.connection );

    // accounts
    this.stakingState = this.#getPDA( [ "STAKING", this.stakingIdSeed ] )[ 0 ];
    this.stakingWallet = this.#getPDA( [ "WALLET", this.stakingIdSeed ] )[ 0 ];
  }

  async getStakingInfo () {
    const state = await this.program.account.stakingState.fetch( this.stakingState );
    console.log( state );
    let capacity = 0;
    for ( let i = 0; i < state.configs.length; i++ ) {
      capacity += state.configs[ i ].capacity * state.configs[ i ].supply;
    }

    return {
      capacity,
      funded: state.funded * 1
    };
  }

  async getStakedItems () {
    const accounts = await this.provider.connection.getParsedProgramAccounts( this.programId, {
      filters: [
        {
          dataSize: this.program.account.tokenState.size
        },
        {
          memcmp: {
            offset: 8,
            bytes: this.#getPayer().toBase58()
          }
        }
      ]
    } );

    const stakedNFTs = await this.metaplex.nfts().findAllByOwner( {
      owner: this.stakingState
    } );
    stakedNFTs.forEach( x => {
      x.tokenStateAddress = this.#getPDA( [ x.mintAddress, this.stakingIdSeed ] )[ 0 ];
      const account = accounts.filter( y => y.pubkey.toBase58() === x.tokenStateAddress.toBase58() )[ 0 ];
      if ( account !== null && account !== undefined ) {
        x.tokenStateData = this.program.coder.accounts.decode( "TokenState", account.account.data );
      }
    } );
    return stakedNFTs.filter( x => x.tokenStateData !== undefined );
  }

  async getSuitableForStaking () {
    const myNfts = await this.metaplex.nfts().findAllByOwner( {
      owner: this.#getPayer()
    } );
    return myNfts.filter( meta => meta.creators.at( 0 ).verified && meta.creators.at( 0 ).address.toBase58() === "8CtXuE1GaJKtGBiSHqzdU1XrUGcaDNc2sjoLVFi7hMxJ" );
  }

  async stake ( arr, connection, wallet ) {
    const instructions = [];
    const signerSet = [];
    signerSet.push( [] );
    for ( const item of arr ) {
      const tokenAccount = ( await this.provider.connection.getTokenAccountsByOwner( this.#getPayer(), {
        mint: item.mintAddress
      } ) ).value[ 0 ].pubkey;
      const tokenState = this.#getPDA( [ item.mintAddress, this.stakingIdSeed ] )[ 0 ];
      instructions.push(
        this.program.instruction.stake(
          {
            stakingId: this.stakingId,
            rarity: 1,
          },
          {
            accounts: {
              stakingState: this.stakingState,
              token: item.mintAddress,
              tokenAccount,
              tokenState,
              userAuthority: this.#getPayer(),
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId
            }
          }
        )
      );
    }
    const txHash = await sendTransactions( connection, wallet, [ instructions ], signerSet );
    console.log( `Staking Txn: ${ txHash }` );
  }

  async claim ( arr, connection, wallet ) {
    const instructions = [];
    const signerSet = [];

    const state = await this.program.account.stakingState.fetch( this.stakingState );

    signerSet.push( [] );
    for ( const item of arr ) {
      const tokenState = this.#getPDA( [ item.mintAddress, this.stakingIdSeed ] )[ 0 ];
      instructions.push(
        this.program.instruction.claim(
          {
            stakingId: this.stakingId,
            rarity: 1,
          },
          {
            accounts: {
              stakingState: this.stakingState,
              token: item.mintAddress,
              tokenState,
              escrow: state.escrow,
              userAuthority: this.#getPayer(),
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
              recentBlockhash: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
            }
          }
        )
      );
    }
    const txHash = await sendTransactions( connection, wallet, [ instructions ], signerSet );
    console.log( `claim Txn: ${ txHash }` );
  }

  async unstake ( arr, connection, wallet ) {
    const instructions = [];
    const signerSet = [];
    signerSet.push( [] );
    for ( const item of arr ) {
      const tokenAccount = ( await this.provider.connection.getTokenAccountsByOwner( this.stakingState, {
        mint: item.mintAddress
      } ) ).value[ 0 ].pubkey;
      const tokenState = this.#getPDA( [ item.mintAddress, this.stakingIdSeed ] )[ 0 ];
      instructions.push(
        this.program.instruction.unstake(
          {
            stakingId: this.stakingId,
          },
          {
            accounts: {
              stakingState: this.stakingState,
              token: item.mintAddress,
              tokenAccount,
              tokenState,
              userAuthority: this.#getPayer(),
              tokenProgram: TOKEN_PROGRAM_ID
            }
          }
        )
      );
    }
    const txHash = await sendTransactions( connection, wallet, [ instructions ], signerSet );
    console.log( `unStaking Txn: ${ txHash }` );
  }

  #getPDA ( seeds, programId = this.programId ) {
    return PublicKey.findProgramAddressSync( seeds.map( s => s.toBuffer != null ? s.toBuffer() : Buffer.from( s ) ), programId );
  }

  #getPayer () {
    return this.provider.wallet.publicKey;
  }
}

export { Staking };
