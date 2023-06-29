import BlockData from "./blockdata";

export default interface Block extends BlockData {
  timestamp: number;
  nonce: number;
  prevHash: string;
  hash: string;
}
