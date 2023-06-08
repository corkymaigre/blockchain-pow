import sha256 from "sha256";

import Block from "./model/block";
import Transaction from "./model/transaction";

export default class Blockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];

  public constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.mineBlock(100, "0", "0");
  }

  public getChain(): Block[] {
    return this.chain;
  }

  public getPendingTransactions(): Transaction[] {
    return this.pendingTransactions;
  }

  public mineBlock(nonce: number, prevBlockHash: string, hash: string): Block {
    const block: Block = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce,
      prevBlockHash,
      hash,
    };
    this.pendingTransactions = [];
    this.chain.push(block);
    return block;
  }

  public getLastBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  public createTransaction(amount: number, from: string, to: string): number {
    this.pendingTransactions.push({ amount, from, to });
    return this.getLastBlock()["index"] + 1;
  }

  public hash(prevBlockHash: string, data: Transaction[], nonce: number): string {
    return sha256(prevBlockHash + String(nonce) + JSON.stringify(data));
  }

  public proofOfWork(prevBlockHash: string, data: Transaction[]): number {
    let nonce: number = 0;
    let hash: string = this.hash(prevBlockHash, data, nonce);
    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hash(prevBlockHash, data, nonce);
    }
    return nonce;
  }
}
