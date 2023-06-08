import Blockchain from "./blockchain";
import Block from "./model/block";
import Transaction from "./model/transaction";

describe("Blockchain", () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  describe("mineBlock", () => {
    it("should mine a new block with the provided nonce, prevBlockHash, and hash", () => {
      const nonce: number = 123;
      const prevBlockHash: string = "prevHash";
      const hash: string = "blockHash";

      const block: Block = blockchain.mineBlock(nonce, prevBlockHash, hash);

      expect(block).toBeDefined();
      expect(block.index).toBe(blockchain.getChain().length);
      expect(block.timestamp).toBeDefined();
      expect(block.transactions).toEqual(blockchain.getPendingTransactions());
      expect(block.nonce).toBe(nonce);
      expect(block.prevBlockHash).toBe(prevBlockHash);
      expect(block.hash).toBe(hash);
      expect(blockchain.getPendingTransactions()).toEqual([]);
    });
  });

  describe("getLastBlock", () => {
    it("should return the last block in the chain", () => {
      const block1: Block = blockchain.mineBlock(1, "prevHash1", "hash1");
      const block2: Block = blockchain.mineBlock(2, "prevHash2", "hash2");

      const lastBlock: Block = blockchain.getLastBlock();

      expect(lastBlock).not.toBe(block1);
      expect(lastBlock).toBe(block2);
    });
  });

  describe("createTransaction", () => {
    it("should create a new transaction and return the index of the next block", () => {
      const amount: number = 100;
      const from: string = "sender";
      const to: string = "receiver";

      const blockIndex: number = blockchain.createTransaction(amount, from, to);

      expect(blockIndex).toBe(2);
      expect(blockchain.getPendingTransactions()).toContainEqual({ amount, from, to });
    });
  });

  describe("hash", () => {
    it("should calculate the hash of the block", () => {
      const prevBlockHash: string = "prevHash";
      const data: Transaction[] = [{ amount: 100, from: "sender", to: "receiver" }];
      const nonce: number = 123;
      const expectedHash: string = "722a6a8def3f495b9bfa3f35af6c4aa0f91a8dd3847f57404ec7db43f97095b6";

      const hash: string = blockchain.hash(prevBlockHash, data, nonce);

      expect(hash).toBe(expectedHash);
    });
  });

  describe("proofOfWork", () => {
    it("should find a valid nonce for the block", () => {
      const prevBlockHash: string = "prevHash";
      const data: Transaction[] = [{ amount: 100, from: "sender", to: "receiver" }];

      const nonce: number = blockchain.proofOfWork(prevBlockHash, data);

      expect(nonce).toBeDefined();
      expect(blockchain.hash(prevBlockHash, data, nonce).substring(0, 4)).toBe("0000");
    });
  });
});
