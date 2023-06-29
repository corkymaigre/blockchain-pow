import Transaction from "./transaction";

export default interface BlockData {
  index: number;
  transactions: Transaction[];
}
