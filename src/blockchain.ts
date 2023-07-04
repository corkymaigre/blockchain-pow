import sha256 from "sha256";
import { v1 as uuid } from "uuid";

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

  public setChain(chain: Block[]): void {
    this.chain = chain;
  }

  public addBlock(block: Block): void {
    this.chain.push(block);
  }

  public getPendingTransactions(): Transaction[] {
    return this.pendingTransactions;
  }

  public setPendingTransactions(pendingTransactions: Transaction[]): void {
    this.pendingTransactions = pendingTransactions;
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

  public createTransaction(amount: number, from: string, to: string): Transaction {
    return { id: uuid().split("-").join(""), amount, from, to };
  }

  public addPendingTransaction(transaction: Transaction): number {
    this.pendingTransactions.push(transaction);
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

  public isChainValid(chain: Block[]): boolean {
    const genesis: Block = chain[0];
    const correctNonce = genesis.nonce === 100;
    const correctPrevHash = genesis.prevHash === "0";
    const correctHash = genesis.hash === "0";
    const correctTransactions = genesis.transactions.length === 0;
    if (!correctNonce || !correctPrevHash || !correctHash || !correctTransactions) return false;

    for (let i = 1; i < chain.length; i++) {
      const block: Block = chain[i];
      const prevBlock: Block = chain[i - 1];
      const hash: string = this.hash(
        prevBlock.hash,
        { transactions: block.transactions, index: block.index },
        block.nonce
      );
      if (hash.substring(0, 4) !== "0000") return false;
      if (block.prevHash !== prevBlock.hash) return false;
    }

    return true;
  }
}
