import Transaction from "./transaction";

export default interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  prevBlockHash: string;
  hash: string;
}
