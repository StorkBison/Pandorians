import * as anchor from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { createAssociatedTokenAccountInstruction, createInitializeMintInstruction, getAssociatedTokenAddress, mintTo, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createCreateMetadataAccountV2Instruction, CreateMetadataAccountV2InstructionAccounts } from "@metaplex-foundation/mpl-token-metadata";
import { PublicKey } from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const nftName = new Date().toLocaleString();
const nftSymbol = "ZooNft";

export const mintElephant = async (connection: anchor.web3.Connection, wallet: NodeWallet, uriSuffix: String = ''): Promise<[anchor.web3.PublicKey, anchor.web3.PublicKey]> => {
    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const nftTokenAccount = await getAssociatedTokenAddress(
        mintKey.publicKey,
        wallet.publicKey
    );

    // already uploaded Animal(97): Elephant (ZooNft)
    const metadataUri = `https://ipfs.infura.io/ipfs/QmemzENUaJbJrbtFj9fMp2tnyZJV2TBVFM7Rc7zTG2jGRc${ uriSuffix }`;
    const metadataAddress = await getMetadata(mintKey.publicKey);

    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const mint_tx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mintKey.publicKey,
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
            lamports,
        }),
        createInitializeMintInstruction(
            mintKey.publicKey,
            0,
            wallet.publicKey,
            wallet.publicKey,
        ),
        createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            nftTokenAccount,
            wallet.publicKey,
            mintKey.publicKey
        ),
        createCreateMetadataAccountV2Instruction(
            {
                metadata: metadataAddress,
                mint: mintKey.publicKey,
                mintAuthority: wallet.publicKey,
                payer: wallet.publicKey,
                updateAuthority: wallet.publicKey
            },
            {
                createMetadataAccountArgsV2: {
                    data: {
                        name: nftName,
                        symbol: nftSymbol,
                        uri: metadataUri,
                        sellerFeeBasisPoints: 0,
                        creators: [{
                            address: wallet.publicKey,
                            verified: true,
                            share: 100
                        }],
                        collection: null,
                        uses: null
                    },
                    isMutable: true
                }
            }
        )
    );

    // creating mint with meta
    const res = await connection.sendTransaction(mint_tx, [wallet.payer, mintKey]);
    await connection.confirmTransaction(res);

    // minting to wallet
    const res2 = await mintTo(connection, wallet.payer, mintKey.publicKey, nftTokenAccount, wallet.publicKey, 1);
    await connection.confirmTransaction(res2);

    return [mintKey.publicKey, nftTokenAccount];
}

const getMetadata = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
    return (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
  };