import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@project-serum/anchor';

import { Box } from "./box";
import { CandyMachine } from "./candy";
import { Staking } from "./staking";
import { Wheel } from "./wheel";
import { RPCURL } from '../config';

function getProvider ( wallet ) {
    const opts = {
        preflightCommitment: "processed"
    };

    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = RPCURL;
    const connection = new Connection( network, opts.preflightCommitment );

    const provider = new AnchorProvider(
        connection, wallet, opts.preflightCommitment,
    );
    return provider;
}

export { Box, CandyMachine, Staking, Wheel, getProvider };
