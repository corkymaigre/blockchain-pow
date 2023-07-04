import request from "supertest";
import axios from "axios";

import app, { blockchain } from "./node";

jest.mock("axios");

describe("API Routes", () => {
  describe("GET /blockchain", () => {
    it("should return the blockchain", async () => {
      const response = await request(app).get("/blockchain");
      expect(response.status).toBe(200);
      expect(response.body.chain).toHaveLength(1);
      expect(response.body.chain[0].hash).toBe("0");
      expect(response.body.chain[0].index).toBe(1);
      expect(response.body.chain[0].nonce).toBe(100);
      expect(response.body.chain[0].prevHash).toBe("0");
      expect(response.body.chain[0]).toHaveProperty("timestamp");
      expect(response.body.chain[0].transactions).toEqual([]);
      expect(response.body.pendingTransactions).toEqual([]);
    });
  });

  describe("POST /blockchain/transaction", () => {
    it("should create a new transaction and return a success message", async () => {
      const transaction = {
        amount: 10,
        from: "senderAddress",
        to: "recipientAddress",
      };

      const response = await request(app).post("/blockchain/transaction").send(transaction);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/Transaction will be added in block \d+./);
    });
  });

  xdescribe("POST /blockchain/transaction/broadcast", () => {
    it("should create and broadcast a transaction", (done) => {
      const mockTransaction = {
        amount: 10,
        from: "sender-address",
        to: "recipient-address",
      };

      const mockNodes = ["http://node1", "http://node2", "http://node3"];

      const mockAxiosResponse = { data: {} };

      // Mock blockchain methods
      blockchain.createTransaction = jest.fn().mockReturnValue(mockTransaction);
      blockchain.addPendingTransaction = jest.fn();
      blockchain.getNodes = jest.fn().mockReturnValue(mockNodes);

      // Mock axios
      axios.post.mockImplementation(() => Promise.resolve(mockAxiosResponse));

      // Replace the actual implementation with mocks
      jest.mock("./blockchain", () => ({
        __esModule: true,
        default: jest.mock("blockchain"),
      }));

      // Make the request to the endpoint
      request(app)
        .post("/blockchain/transaction/broadcast")
        .send(mockTransaction)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          // Verify the response
          expect(res.body).toEqual({ message: "Transaction created and broadcast successfully." });

          // Verify the blockchain methods were called correctly
          expect(blockchain.createTransaction).toHaveBeenCalledWith(
            mockTransaction.amount,
            mockTransaction.from,
            mockTransaction.to
          );
          expect(blockchain.addPendingTransaction).toHaveBeenCalledWith(mockTransaction);
          expect(blockchain.getNodes).toHaveBeenCalled();

          // Verify the axios requests were made to the correct URLs
          expect(axios.post).toHaveBeenCalledTimes(mockNodes.length);
          for (const node of mockNodes) {
            expect(axios.post).toHaveBeenCalledWith(`${node}/blockchain/transaction`, mockTransaction);
          }

          done();
        });
    });
  });

  describe("GET /blockchain/mine", () => {
    it("should mine a new block and return the mined block", async () => {
      const response = await request(app).get("/blockchain/mine");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New block mined successfully");
      expect(response.body.block).toBeDefined();
    });
  });

  describe("POST /blockchain/receive", () => {
    let block;
    let lastBlock;

    beforeEach(() => {
      // Mock the blockchain and its methods for each test
      block = {
        index: 1,
        prevHash: "previous-hash",
        // Add other properties as needed
      };
      lastBlock = {
        index: 0,
        hash: "previous-hash",
        // Add other properties as needed
      };
      // Mock getLastBlock and addBlock methods of blockchain
      blockchain.getLastBlock = jest.fn().mockReturnValue(lastBlock);
      blockchain.addBlock = jest.fn();
      blockchain.setPendingTransactions = jest.fn();
    });

    it("should accept a new block with correct hash and index", async () => {
      // Mock the correct hash and index
      lastBlock.hash = "previous-hash";
      lastBlock.index = 0;

      const response = await request(app).post("/blockchain/receive").send({ block });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New block received and accepted");
      expect(response.body.block).toEqual(block);

      // Verify that the blockchain methods were called correctly
      expect(blockchain.getLastBlock).toHaveBeenCalled();
      expect(blockchain.addBlock).toHaveBeenCalledWith(block);
      expect(blockchain.setPendingTransactions).toHaveBeenCalledWith([]);
    });

    it("should reject a new block with incorrect hash", async () => {
      // Mock an incorrect hash
      lastBlock.hash = "incorrect-hash";

      const response = await request(app).post("/blockchain/receive").send({ block });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New block rejected");
      expect(response.body.block).toEqual(block);

      // Verify that the blockchain methods were not called
      expect(blockchain.getLastBlock).toHaveBeenCalled();
      expect(blockchain.addBlock).not.toHaveBeenCalled();
      expect(blockchain.setPendingTransactions).not.toHaveBeenCalled();
    });

    it("should reject a new block with incorrect index", async () => {
      // Mock an incorrect index
      lastBlock.index = 2;

      const response = await request(app).post("/blockchain/receive").send({ block });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New block rejected");
      expect(response.body.block).toEqual(block);

      // Verify that the blockchain methods were not called
      expect(blockchain.getLastBlock).toHaveBeenCalled();
      expect(blockchain.addBlock).not.toHaveBeenCalled();
      expect(blockchain.setPendingTransactions).not.toHaveBeenCalled();
    });
  });

  describe("POST /nodes/broadcast", () => {
    it("should register a new node with the network and broadcast it to other nodes", async () => {
      const newNode = "boo";

      const response = await request(app).post("/nodes/broadcast").send({ node: newNode });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New node registered with network successfully.");
    });
  });

  describe("POST /nodes/register", () => {
    it("should register a new node", async () => {
      const newNode = "foo";

      const response = await request(app).post("/nodes/register").send({ node: newNode });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New node registered successfully.");
    });
  });

  describe("POST /nodes/register/bulk", () => {
    it("should bulk register multiple nodes", async () => {
      const nodes = ["node1", "node2", "node3"];

      const response = await request(app).post("/nodes/register/bulk").send({ nodes });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Bulk registration successful.");
    });
  });
});
