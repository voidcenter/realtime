
export interface RawEvent {
    address: string;
    blockHash: string;
    blockNumber: number;
    data: string;
    logIndex: number;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: number;
}


export interface RawBlock {
    block_number: number;
    events: RawEvent[];
}


export interface Link {
    source: number;
    target: number;
    token: number;
    amount: number;
    txn_hash: string;
}

export interface ParsedBlock {
    block_number: number;
    addresses: string[];
    tokens: string[];
    links: Link[]; 
}

export interface Context {
    blocks: ParsedBlock[];
}


export enum ContextChange {
    APPEND_BLOCK = "Append Block",
    POP_FIRST_BLOCK = "Pop first",
}

export interface ContextDelta {
    type: ContextChange;
    newBlock?: RawBlock;
}


