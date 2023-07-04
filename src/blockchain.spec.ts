import Blockchain from "./blockchain";

import Block from "./model/block";
import BlockData from "./model/blockdata";
import Transaction from "./model/transaction";

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

  describe("addBlock", () => {
    it("should add a block to the chain", () => {
      const block: Block = { timestamp: 1, nonce: 2, prevHash: "prevHash", hash: "hash", index: 0, transactions: [] };
      blockchain.addBlock(block);
      expect(blockchain.getChain()).toContain(block);
    });
  });

  describe("getPendingTransactions", () => {
    it("should get the pending transactions", () => {
      expect(blockchain.getPendingTransactions()).toEqual([]);
    });
  });

  describe("setPendingTransactions", () => {
    it("should set the pending transactions", () => {
      const pendingTransactions: Transaction[] = [{ id: "id", amount: 0, from: "from", to: "to" }];
      blockchain.setPendingTransactions(pendingTransactions);
      expect(blockchain.getPendingTransactions()).toEqual(pendingTransactions);
    });
  });

  describe("getNode", () => {
    it("should get the current node", () => {
      expect(blockchain.getNode()).toBeDefined();
    });
  });

  describe("getNodes", () => {
    it("should get the network nodes", () => {
      expect(blockchain.getNodes()).toBeDefined();
      expect(blockchain.getNodes()).toBeInstanceOf(Array<string>);
    });
  });

  describe("addNode", () => {
    it("should add a node to the network", () => {
      const node: string = "foo";
      blockchain.addNode(node);
      expect(blockchain.getNodes()).toContain(node);
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
    it("should create a new transaction", () => {
      const amount: number = 100;
      const from: string = "sender";
      const to: string = "receiver";

      const transaction: Transaction = blockchain.createTransaction(amount, from, to);

      expect(transaction.amount).toEqual(amount);
      expect(transaction.from).toEqual(from);
      expect(transaction.to).toEqual(to);
      expect(transaction.id).toMatch(/^[a-fA-F0-9]{32}$/);
    });
  });

  describe("addPendingTransaction", () => {
    it("should add a new transaction to the pending transactions and return the index of the next block", () => {
      const amount: number = 100;
      const from: string = "sender";
      const to: string = "receiver";
      const id: string = "b59ba9c01a4411ee9313cb9a2da1dee1";
      const transaction: Transaction = { amount, from, to, id };

      const blockIndex: number = blockchain.addPendingTransaction(transaction);

      expect(blockIndex).toBe(2);
      expect(blockchain.getPendingTransactions()).toContainEqual({ amount, from, to, id });
    });
  });

  describe("hash", () => {
    it("should calculate the hash of the block", () => {
      const prevHash: string = "prevHash";
      const data: BlockData = {
        index: 5,
        transactions: [{ amount: 100, from: "sender", to: "receiver", id: "b59ba9c01a4411ee9313cb9a2da1dee1" }],
      };
      const nonce: number = 123;
      const expectedHash: string = "1884976c02422711806010020010ec80ccf7a2e48246d775f86b272c796ee03e";

      const hash: string = blockchain.hash(prevHash, data, nonce);

      expect(hash).toBe(expectedHash);
    });
  });

  describe("proofOfWork", () => {
    it("should find a valid nonce for the block", () => {
      const prevHash: string = "prevHash";
      const data: BlockData = {
        index: 5,
        transactions: [{ amount: 100, from: "sender", to: "receiver", id: "b59ba9c01a4411ee9313cb9a2da1dee1" }],
      };

      const nonce: number = blockchain.proofOfWork(prevHash, data);

      expect(nonce).toBeDefined();
      expect(blockchain.hash(prevHash, data, nonce).substring(0, 4)).toBe("0000");
    });
  });
});
