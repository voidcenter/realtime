import { ParsedBlock, RawBlock, RawEvent } from "./defs";
import { utils } from "ethers";


const ADDRESS_LENGTH = 40;

const parseAddress = (s: string) => '0x' + s.substring(s.length - ADDRESS_LENGTH).toLowerCase();


export const TRANSFER_TOPIC = utils.id("Transfer(address,address,uint256)");


interface TempTransfer {
    from: string;
    to: string;
    token: string;
    amount: number;
    txn_hash: string;
}


export function parseTransfer(event: RawEvent): TempTransfer {
    return {
        from: parseAddress(event.topics[1]),
        to: parseAddress(event.topics[2]),
        token: event.address.toLowerCase(),
        amount: Number(event.data),
        txn_hash: event.transactionHash,
    };
}

export function parseBlockTransfers(block: RawBlock): ParsedBlock {
    
    const transfers = block.events
        .filter(event => event.topics[0] === TRANSFER_TOPIC)
        .filter(event => event.topics.length === 3)    // filter out NFT transfers where there are four topics
        .map(event => parseTransfer(event));

    const addressSet: Set<string> = new Set();
    const tokenSet: Set<string> = new Set();
    transfers.forEach(t => {
        addressSet.add(t.from);
        addressSet.add(t.to);
        tokenSet.add(t.token);
    });
    const addresses = Array.from(addressSet);
    const tokens = Array.from(tokenSet);

    const links = transfers.map(t => ({
        source: addresses.indexOf(t.from),
        target: addresses.indexOf(t.to),
        token: tokens.indexOf(t.token),
        amount: t.amount,
        txn_hash: t.txn_hash,
    }));

    return {
        block_number: block.block_number,
        addresses, 
        tokens, 
        links,
    }
}

