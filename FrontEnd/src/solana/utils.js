import * as anchor from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

export function promiseWithTimeout ( promise, timeoutTime = 5000 ) {
  return new Promise( ( resolve, reject ) => {
    const timeout = setTimeout( () => reject( { message: 'timeout' } ), timeoutTime );

    const resolveWithTimeout = ( res ) => {
      clearTimeout( timeout );
      resolve( res );
    };

    const rejectWithTimeout = ( err ) => {
      clearTimeout( timeout );
      reject( err );
    };

    promise.then( resolveWithTimeout ).catch( rejectWithTimeout );
  } );
}

export const sendTransactions = async (
  connection,
  wallet,
  instructionSet,
  signersSet,
  sequenceType,
  commitment = "singleGossip",
  block
) => {
  if ( !wallet.publicKey ) throw new WalletNotConnectedError();

  const unsignedTxns = [];

  if ( !block ) {
    block = await connection.getRecentBlockhash( commitment );
  }

  for ( let i = 0; i < instructionSet.length; i++ ) {
    const instructions = instructionSet[ i ];
    const signers = signersSet[ i ];

    if ( instructions.length === 0 ) {
      continue;
    }

    let transaction = new anchor.web3.Transaction();
    instructions.forEach( ( instruction ) => transaction.add( instruction ) );
    transaction.recentBlockhash = block.blockhash;
    transaction.setSigners(
      // fee payed by the wallet owner
      wallet.publicKey,
      ...signers.map( ( s ) => s.publicKey )
    );

    if ( signers.length > 0 ) {
      transaction.partialSign( ...signers );
    }

    unsignedTxns.push( transaction );
  }

  const signedTxns = await wallet.signAllTransactions( unsignedTxns );

  const pendingTxns = [];

  let breakEarlyObject = { breakEarly: false, i: 0 };

  const txIds = [];
  for ( let i = 0; i < signedTxns.length; i++ ) {
    const signedTxnPromise = sendSignedTransaction( {
      connection,
      signedTransaction: signedTxns[ i ],
    } );

    try {
      const { txid } = await signedTxnPromise;
      txIds.push( txid );
    } catch ( error ) {
      if ( sequenceType === 2 ) {
        breakEarlyObject.breakEarly = true;
        breakEarlyObject.i = i;
      }
    }

    if ( sequenceType !== 1 ) {
      try {
        await signedTxnPromise;
      } catch ( e ) {
        console.log( "Caught failure", e );
        if ( breakEarlyObject.breakEarly ) {
          console.log( "Died on ", breakEarlyObject.i );
          return breakEarlyObject.i; // Return the txn we failed on by index
        }
      }
    } else {
      pendingTxns.push( signedTxnPromise );
    }
  }

  if ( sequenceType !== 1 ) {
    await Promise.all( pendingTxns );
  }

  return txIds;
};


export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

const DEFAULT_TIMEOUT = 15000;

export function sleep ( ms ) {
  return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

export async function sendSignedTransaction ( {
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
} ) {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  let slot = 0;
  const txid =
    await connection.sendRawTransaction( rawTransaction, {
      skipPreflight: true,
    } );

  // console.log('Started awaiting confirmation for', txid);

  let done = false;
  ( async () => {
    while ( !done && getUnixTs() - startTime < timeout ) {
      connection.sendRawTransaction( rawTransaction, {
        skipPreflight: true,
      } );
      await sleep( 500 );
    }
  } )();
  try {
    const confirmation = await awaitTransactionSignatureConfirmation(
      txid,
      timeout,
      connection,
      "recent",
      true
    );

    if ( !confirmation )
      throw new Error( "Timed out awaiting confirmation on transaction" );

    if ( confirmation.err ) {
      console.error( confirmation.err );
      throw new Error( "Transaction failed: Custom instruction error" );
    }

    slot = confirmation?.slot || 0;
  } catch ( err ) {
    console.error( "Timeout Error caught", err );
    if ( err.timeout ) {
      throw new Error( "Timed out awaiting confirmation on transaction" );
    }
    let simulateResult = null;
    try {
      simulateResult = (
        await simulateTransaction( connection, signedTransaction, "single" )
      ).value;
    } catch ( e ) { }
    if ( simulateResult && simulateResult.err ) {
      if ( simulateResult.logs ) {
        for ( let i = simulateResult.logs.length - 1; i >= 0; --i ) {
          const line = simulateResult.logs[ i ];
          if ( line.startsWith( "Program log: " ) ) {
            throw new Error(
              "Transaction failed: " + line.slice( "Program log: ".length )
            );
          }
        }
      }
      throw new Error( JSON.stringify( simulateResult.err ) );
    }
  } finally {
    done = true;
  }

  return { txid, slot };
}

async function awaitTransactionSignatureConfirmation (
  txid,
  timeout,
  connection,
  commitment = "recent",
  queryStatus = false
) {
  let done = false;
  let status = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise( async ( resolve, reject ) => {
    setTimeout( () => {
      if ( done ) {
        return;
      }
      done = true;
      // console.log('Rejecting for timeout...');
      reject( { timeout: true } );
    }, timeout );
    try {
      subId = connection.onSignature(
        txid,
        ( result, context ) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if ( result.err ) {
            reject( status );
          } else {
            resolve( status );
          }
        },
        commitment
      );
    } catch ( e ) {
      done = true;
      console.error( "WS error in setup", txid, e );
    }
    while ( !done && queryStatus ) {
      // eslint-disable-next-line no-loop-func
      ( async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses( [
            txid,
          ] );
          status = signatureStatuses && signatureStatuses.value[ 0 ];
          if ( !done ) {
            if ( !status ) {
            } else if ( status.err ) {
              done = true;
              reject( status.err );
            } else if ( !status.confirmations ) {
            } else {
              done = true;
              resolve( status );
            }
          }
        } catch ( e ) {
          if ( !done ) {
          }
        }
      } )();
      await sleep( 2000 );
    }
  } );

  //@ts-ignore
  if ( connection._signatureSubscriptions[ subId ] )
    connection.removeSignatureListener( subId );
  done = true;
  // console.log('Returning status', status);
  return status;
}

async function simulateTransaction (
  connection,
  transaction,
  commitment
) {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching
  );

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize( signData );
  const encodedTransaction = wireTransaction.toString( "base64" );
  const config = { encoding: "base64", commitment };
  const args = [ encodedTransaction, config ];

  // @ts-ignore
  const res = await connection._rpcRequest( "simulateTransaction", args );
  if ( res.error ) {
    throw new Error( "failed to simulate transaction: " + res.error.message );
  }
  return res.result;
}