import request from "supertest";

import app from "./node";

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

  describe("GET /blockchain/mine", () => {
    it("should mine a new block and return the mined block", async () => {
      const response = await request(app).get("/blockchain/mine");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New block mined successfully");
      expect(response.body.block).toBeDefined();
    });
  });

  xdescribe("POST /nodes/broadcast", () => {
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
