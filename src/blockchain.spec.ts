import Blockchain from "./blockchain";

import Block from "./model/block";
import BlockData from "./model/blockdata";

describe("Blockchain", () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1688033869313);

    blockchain = new Blockchain();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getChain", () => {
    it("should get the chain", () => {
      expect(blockchain.getChain()).toEqual([
        {
          hash: "0",
          index: 1,
          nonce: 100,
          prevHash: "0",
          timestamp: 1688033869313,
          transactions: [],
        },
      ]);
    });
  });

  describe("getPendingTransactions", () => {
    it("should get the pending transactions", () => {
      expect(blockchain.getPendingTransactions()).toEqual([]);
    });
  });

  describe("getNode", () => {
    it("should get the current node", () => {
      expect(blockchain.getNode()).toBeDefined();
    });
  });

  describe("addNode", () => {
    it("should add a node to the network", () => {
      const node: string = "foo";
      blockchain.addNode(node);
      expect(blockchain.getNodes()).toContain(node);
    });
  });

  describe("getNodes", () => {
    it("should get the network nodes", () => {
      expect(blockchain.getNodes()).toBeDefined();
      expect(blockchain.getNodes()).toBeInstanceOf(Array<string>);
    });
  });

  describe("mine", () => {
    it("should mine a new block with the provided nonce, prevHash, and hash", () => {
      const nonce: number = 123;
      const prevHash: string = "prevHash";
      const hash: string = "blockHash";

      const block: Block = blockchain.mine(nonce, prevHash, hash);

      expect(block).toBeDefined();
      expect(block.index).toBe(blockchain.getChain().length);
      expect(block.timestamp).toBeDefined();
      expect(block.transactions).toEqual(blockchain.getPendingTransactions());
      expect(block.nonce).toBe(nonce);
      expect(block.prevHash).toBe(prevHash);
      expect(block.hash).toBe(hash);
      expect(blockchain.getPendingTransactions()).toEqual([]);
    });
  });

  describe("getLastBlock", () => {
    it("should return the last block in the chain", () => {
      const block1: Block = blockchain.mine(1, "prevHash1", "hash1");
      const block2: Block = blockchain.mine(2, "prevHash2", "hash2");

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
      const prevHash: string = "prevHash";
      const data: BlockData = { index: 5, transactions: [{ amount: 100, from: "sender", to: "receiver" }] };
      const nonce: number = 123;
      const expectedHash: string = "ca28acf55f03c2daea1cb5e676bc6de34f2a60f43189eba2b2d8dc6ab3fa08cd";

      const hash: string = blockchain.hash(prevHash, data, nonce);

      expect(hash).toBe(expectedHash);
    });
  });

  describe("proofOfWork", () => {
    it("should find a valid nonce for the block", () => {
      const prevHash: string = "prevHash";
      const data: BlockData = { index: 5, transactions: [{ amount: 100, from: "sender", to: "receiver" }] };

      const nonce: number = blockchain.proofOfWork(prevHash, data);

      expect(nonce).toBeDefined();
      expect(blockchain.hash(prevHash, data, nonce).substring(0, 4)).toBe("0000");
    });
  });
});
