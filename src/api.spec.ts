import request from "supertest";

import app from "./api";

describe("Blockchain API", () => {
  describe("GET /blockchain", () => {
    test("should return the blockchain", async () => {
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

  describe("POST /transaction", () => {
    test("should create a new transaction", async () => {
      const transaction = {
        amount: 10,
        from: "sender-address",
        to: "recipient-address",
      };

      const response = await request(app).post("/transaction").send(transaction);

      expect(response.status).toBe(200);
      expect(response.body.note).toMatch(/Transaction will be added in block \d+./);
    });
  });

  describe("GET /mine", () => {
    test("should mine a new block", async () => {
      const response = await request(app).get("/mine");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("New block mined successfully");
      expect(response.body.block).toBeDefined();
    });
  });
});
