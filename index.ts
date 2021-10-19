import { web3 } from "@project-serum/anchor";
import bs58 from 'bs58';
import * as dotenv from 'dotenv'
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token'
import { createMetadata, Creator, Data } from "./metaplex";
import { extendBorsh } from "./extendBorsh";
dotenv.config();

extendBorsh()

async function main() {
  const connection = new web3.Connection(
    web3.clusterApiUrl('devnet')
  );

  const bytes = bs58.decode(process.env.PRIVATE_KEY!)
  const account = web3.Keypair.fromSecretKey(bytes)

  var fromAirdropSignature = await connection.requestAirdrop(
    account.publicKey,
    web3.LAMPORTS_PER_SOL,
  );
  // Wait for airdrop confirmation
  await connection.confirmTransaction(fromAirdropSignature);


  const nftMint = await Token.createMint(
    connection,
    account, // minting authority
    account.publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  )
  console.log('NFT mint', nftMint.publicKey.toString())

  const nftAccountInfo = await nftMint.getOrCreateAssociatedAccountInfo(
    account.publicKey
  )

  await nftMint.mintTo(
    nftAccountInfo.address,
    account.publicKey,
    [account],
    100
  )

  // Add metadata

  const metadataTx = new web3.Transaction()
  const creator = new Creator({
    address: account.publicKey.toString(),
    verified: true,
    share: 100,
  })
  const metadata = new Data({
    name: 'Cyclos Tickets',
    symbol: 'CYST',
    uri: 'https://item.ohdat.io/paladin_panda/1',
    sellerFeeBasisPoints: 0,
    creators: [creator],
  })

  const metadataAccount = await createMetadata(
    metadata,
    account.publicKey.toString(),
    nftMint.publicKey.toString(),
    account.publicKey.toString(),
    metadataTx.instructions,
    account.publicKey.toString(),
  )
  const txResult = await connection.sendTransaction(metadataTx, [account])
}

(async () => {
  await main()
})()