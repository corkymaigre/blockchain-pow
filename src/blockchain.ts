import sha256 from "sha256";

import Block from "./model/block";
import Transaction from "./model/transaction";
import BlockData from "./model/blockdata";

const port: string = process.argv[2];

export default class Blockchain {
  private node: string;
  private nodes: string[];
  private chain: Block[];
  private pendingTransactions: Transaction[];

  public constructor() {
    this.node = `http://localhost:${port}`;
    this.nodes = [];
    this.chain = [];
    this.pendingTransactions = [];
    this.mine(100, "0", "0");
  }

  public getChain(): Block[] {
    return this.chain;
  }

  public getPendingTransactions(): Transaction[] {
    return this.pendingTransactions;
  }

  public getNode(): string {
    return this.node;
  }

  public getNodes(): string[] {
    return this.nodes;
  }

  public addNode(node: string): void {
    this.nodes.push(node);
  }

  public mine(nonce: number, prevHash: string, hash: string): Block {
    const block: Block = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      nonce,
      prevHash,
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

  public hash(prevHash: string, data: BlockData, nonce: number): string {
    return sha256(prevHash + String(nonce) + JSON.stringify(data));
  }

  public proofOfWork(prevHash: string, data: BlockData): number {
    let nonce: number = 0;
    let hash: string = this.hash(prevHash, data, nonce);
    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hash(prevHash, data, nonce);
    }
    return nonce;
  }
}
