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

  describe("setChain", () => {
    it("should set the chain", () => {
      const chain: Block[] = [{ timestamp: 0, nonce: 0, prevHash: "0", hash: "0", index: 0, transactions: [] }];
      blockchain.setChain(chain);
      expect(blockchain.getChain()).toEqual(chain);
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

  describe("isChainValid", () => {
    let chain: Block[];

    beforeEach(() => {
      // Set up a valid blockchain for each test
      chain = [
        {
          index: 1,
          timestamp: 1688472914200,
          transactions: [],
          nonce: 100,
          prevHash: "0",
          hash: "0",
        },
        {
          index: 2,
          timestamp: 1688473015798,
          transactions: [],
          nonce: 18140,
          prevHash: "0",
          hash: "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
        },
        {
          index: 3,
          timestamp: 1688473059402,
          transactions: [
            {
              id: "aab515301a6411ee95fdd39b394b00b5",
              amount: 12.5,
              from: "6e2479801a6411ee95fdd39b394b00b5",
              to: "00",
            },
            {
              id: "be203e601a6411ee95fdd39b394b00b5",
              amount: 10,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
            {
              id: "c0da7c601a6411ee95fdd39b394b00b5",
              amount: 20,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
            {
              id: "c2ec45601a6411ee95fdd39b394b00b5",
              amount: 30,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
          ],
          nonce: 53563,
          prevHash: "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
          hash: "000092afbbc53eb6756c9e9414873b2e21ab77ba5d841f9dde74b64faca6d5af",
        },
        {
          index: 4,
          timestamp: 1688473091677,
          transactions: [
            {
              id: "c4b0d8c01a6411ee95fdd39b394b00b5",
              amount: 12.5,
              from: "6e2479801a6411ee95fdd39b394b00b5",
              to: "00",
            },
            {
              id: "cf73f9401a6411ee95fdd39b394b00b5",
              amount: 40,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
            {
              id: "d18610601a6411ee95fdd39b394b00b5",
              amount: 50,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
            {
              id: "d3c9e5e01a6411ee95fdd39b394b00b5",
              amount: 60,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
            {
              id: "d60ca9f01a6411ee95fdd39b394b00b5",
              amount: 70,
              from: "fdjkghjkdfhgklfdjg",
              to: "hfgsjdkhfkj,gd",
            },
          ],
          nonce: 62611,
          prevHash: "000092afbbc53eb6756c9e9414873b2e21ab77ba5d841f9dde74b64faca6d5af",
          hash: "0000b0b39bf9c11336d737b0ec1bb6a06dc81f483cf03e5f754182e49f1ffadf",
        },
        {
          index: 5,
          timestamp: 1688473096350,
          transactions: [
            {
              id: "d7ed9ef01a6411ee95fdd39b394b00b5",
              amount: 12.5,
              from: "6e2479801a6411ee95fdd39b394b00b5",
              to: "00",
            },
          ],
          nonce: 89788,
          prevHash: "0000b0b39bf9c11336d737b0ec1bb6a06dc81f483cf03e5f754182e49f1ffadf",
          hash: "0000616d22bcd62d471fcb20b49777987283e316b1378957ec63e9484e71f76e",
        },
        {
          index: 6,
          timestamp: 1688473097649,
          transactions: [
            {
              id: "dab6aa001a6411ee95fdd39b394b00b5",
              amount: 12.5,
              from: "6e2479801a6411ee95fdd39b394b00b5",
              to: "00",
            },
          ],
          nonce: 1801,
          prevHash: "0000616d22bcd62d471fcb20b49777987283e316b1378957ec63e9484e71f76e",
          hash: "0000d9a97d761527263aad89d6bd5dfd06297a4243de89095102c070ca40b84c",
        },
      ];
    });

    it("should return true for a valid chain", () => {
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(true);
    });

    it("should return false if the genesis block has an incorrect nonce", () => {
      chain[0].nonce = 200;
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });

    it("should return false if the genesis block has an incorrect previous hash", () => {
      chain[0].prevHash = "invalid";
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });

    it("should return false if the genesis block has an incorrect hash", () => {
      chain[0].hash = "invalid";
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });

    it("should return false if the genesis block has incorrect transactions", () => {
      chain[0].transactions = [{ id: "id", amount: 0, from: "from", to: "to" }];
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });

    it("should return false if a block has an incorrect previous hash", () => {
      chain[1].prevHash = "invalid";
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });

    it("should return false if a block has an invalid hash", () => {
      chain[3].hash = "invalid";
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });
    it("should return false if a block has an incorrect transaction", () => {
      chain[2].transactions[0].from = "foo";
      const isValid = blockchain.isChainValid(chain);
      expect(isValid).toBe(false);
    });
  });
});
