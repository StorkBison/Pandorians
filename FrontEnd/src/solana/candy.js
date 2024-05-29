import * as anchor from "@project-serum/anchor";
import { SystemProgram, PublicKey, SYSVAR_SLOT_HASHES_PUBKEY, Transaction } from '@solana/web3.js';
import { MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as spl from "@solana/spl-token-v2";
import { CandyMachineProgram } from "@metaplex-foundation/mpl-candy-machine";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

class CandyMachine {
  constructor( address, provider ) {
    this.address = new PublicKey( address );
    this.provider = provider;

    // ...
    this.programId = new PublicKey( CandyMachineProgram.PUBKEY );
  }

  async mint () {
    const anchorIdl = await anchor.Program.fetchIdl( this.programId, this.provider );
    const program = new anchor.Program( anchorIdl, this.programId, this.provider );
    const payer = this.#getPayer();

    const mint = anchor.web3.Keypair.generate();
    const userTokenAccountAddress = this.#getAssociatedTokenAddress( mint.publicKey )[ 0 ];

    const candyMachineAddress = this.address;
    const candyMachineAccount = await program.provider.connection.getAccountInfo( candyMachineAddress );
    const candyMachineData = program.coder.accounts.decodeUnchecked( "CandyMachine", candyMachineAccount.data );
    console.log( candyMachineData );

    const remainingAccounts = [];
    const instructions = [];
    const signers = [];

    signers.push( mint );
    instructions.push(
      ...[
        anchor.web3.SystemProgram.createAccount( {
          fromPubkey: payer,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports:
            await program.provider.connection.getMinimumBalanceForRentExemption(
              MintLayout.span
            ),
          programId: TOKEN_PROGRAM_ID,
        } ),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          0,
          payer,
          payer
        ),
        spl.createAssociatedTokenAccountInstruction(
          this.#getPayer(),
          userTokenAccountAddress,
          this.#getPayer(),
          mint.publicKey
        ),
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          userTokenAccountAddress,
          payer,
          [],
          1
        ),
      ]
    );

    if ( candyMachineData.data.gatekeeper ) {
      console.error( "gatekeeper is not supported currently!" );
      return;
    }

    if ( candyMachineData.data.whitelistMintSettings ) {
      console.error( "whitelist is not supported currently!" );
      return;
    }

    if ( candyMachineData.tokenMint ) {
      console.error( "tokenMint is not supported currently!" );
      return;
    }

    const metadataAddress = this.#getPDA( [ "metadata", TOKEN_METADATA_PROGRAM_ID, mint.publicKey ], TOKEN_METADATA_PROGRAM_ID )[ 0 ];
    const masterEdition = this.#getPDA( [ "metadata", TOKEN_METADATA_PROGRAM_ID, mint.publicKey, "edition" ], TOKEN_METADATA_PROGRAM_ID )[ 0 ];

    const [ candyMachineCreator, creatorBump ] = this.#getPDA( [ "candy_machine", this.address ] );

    // freezePDA
    console.warn( "freeze PDA is not supported currently!" );

    console.log( remainingAccounts.map( ( rm ) => rm.pubkey.toBase58() ) );
    instructions.push(
      program.instruction.mintNft( creatorBump, {
        accounts: {
          candyMachine: candyMachineAddress,
          candyMachineCreator,
          payer: payer,
          wallet: candyMachineData.wallet,
          mint: mint.publicKey,
          metadata: metadataAddress,
          masterEdition,
          mintAuthority: payer,
          updateAuthority: payer,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          recentBlockhashes: SYSVAR_SLOT_HASHES_PUBKEY,
          instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        },
        remainingAccounts:
          remainingAccounts.length > 0 ? remainingAccounts : undefined,
      } )
    );

    const collectionPDA = this.#getPDA( [ "collection", this.address ] )[ 0 ];
    const collectionPDAAccount =
      await program.provider.connection.getAccountInfo(
        collectionPDA
      );

    // state.retainAuthority
    if ( collectionPDAAccount && true ) {
      const collectionData = program.coder.accounts.decodeUnchecked( "CollectionPDA", collectionPDAAccount.data );
      console.log( collectionData );

      const collectionMint = collectionData.mint;
      const collectionAuthorityRecord = this.#getPDA( [ "metadata", TOKEN_METADATA_PROGRAM_ID, collectionMint, "collection_authority", collectionPDA ], TOKEN_METADATA_PROGRAM_ID )[ 0 ];
      console.log( collectionMint );

      if ( collectionMint ) {
        const collectionMetadata = this.#getPDA( [ "metadata", TOKEN_METADATA_PROGRAM_ID, collectionMint ], TOKEN_METADATA_PROGRAM_ID )[ 0 ];
        const collectionMasterEdition = this.#getPDA( [ "metadata", TOKEN_METADATA_PROGRAM_ID, collectionMint, "edition" ], TOKEN_METADATA_PROGRAM_ID )[ 0 ];
        console.log( "Collection PDA: ", collectionPDA.toBase58() );
        console.log( "Authority: ", candyMachineData.authority.toBase58() );

        instructions.push(
          await program.instruction.setCollectionDuringMint( {
            accounts: {
              candyMachine: candyMachineAddress,
              metadata: metadataAddress,
              payer: payer,
              collectionPda: collectionPDA,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              instructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
              collectionMint,
              collectionMetadata,
              collectionMasterEdition,
              authority: candyMachineData.authority,
              collectionAuthorityRecord,
            },
          } )
        );
      }
    }

    const transaction = new Transaction();
    instructions.forEach( ( instruction ) => transaction.add( instruction ) );
    transaction.recentBlockhash = ( await this.provider.connection.getLatestBlockhash( "singleGossip" ) ).blockhash;
    transaction.feePayer = this.provider.wallet.publicKey;

    if ( signers.length > 0 ) {
      transaction.partialSign( ...signers );
    }

    const signedTx = await this.provider.wallet.signTransaction( transaction );

    let signature = await this.provider.connection.sendRawTransaction( signedTx.serialize() );
    console.log( `Mint tx: ${ signature })` );

    return null;
  }

  #getAssociatedTokenAddress ( mint, owner = this.#getPayer() ) {
    return this.#getPDA( [ owner, TOKEN_PROGRAM_ID, mint ], ASSOCIATED_TOKEN_PROGRAM_ID );
  }

  #getPDA ( seeds, programId = this.programId ) {
    return PublicKey.findProgramAddressSync( seeds.map( s => s.toBuffer != null ? s.toBuffer() : Buffer.from( s ) ), programId );
  }

  #getPayer () {
    return this.provider.wallet.publicKey;
  }
}

export { CandyMachine };