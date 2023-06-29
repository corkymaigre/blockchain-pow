import express from "express";
import bodyParser from "body-parser";
import { v1 as uuid } from "uuid";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import Blockchain from "./blockchain";
import Block from "./model/block";
import BlockData from "./model/blockdata";

const MINING_REWARD: number = 12.5;
const NODE_ADDRESS: string = uuid().split("-").join("");

const port: string = process.argv[2];

const blockchain: Blockchain = new Blockchain();

const app: express.Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", (req, res) => {
  res.json(blockchain);
});

app.post("/blockchain/transaction", (req, res) => {
  const blockIndex = blockchain.createTransaction(req.body.amount, req.body.from, req.body.to);
  res.json({ message: `Transaction will be added in block ${blockIndex}.` });
});

app.get("/blockchain/mine", (req, res) => {
  const lastBlock: Block = blockchain.getLastBlock();
  const prevHash: string = lastBlock.hash;

  const data: BlockData = {
    transactions: blockchain.getPendingTransactions(),
    index: lastBlock.index + 1,
  };

  const nonce: number = blockchain.proofOfWork(prevHash, data);
  const hash: string = blockchain.hash(prevHash, data, nonce);

  blockchain.createTransaction(MINING_REWARD, "00", NODE_ADDRESS);

  const block: Block = blockchain.mine(nonce, prevHash, hash);

  res.json({
    message: "New block mined successfully",
    block,
  });
});

app.post("/nodes/broadcast", (req, res) => {
  const newNode: string = req.body.node;

  if (!blockchain.getNodes().includes(newNode)) {
    blockchain.addNode(newNode);
  }

  const promises: Promise<AxiosResponse>[] = [];

  const nodes: string[] = blockchain.getNodes();
  for (const node of nodes) {
    const config: AxiosRequestConfig = {
      url: `${node}/nodes/register`,
      method: "POST",
      data: { node: newNode },
    };
    promises.push(axios(config));
  }

  Promise.all(promises)
    .then(() => {
      const config: AxiosRequestConfig = {
        url: `${newNode}/nodes/register/bulk`,
        method: "POST",
        data: { nodes: [...nodes, blockchain.getNode()] },
      };
      return axios(config);
    })
    .then(() => {
      res.json({ message: "New node registered with network successfully." });
    });
});

app.post("/nodes/register", (req, res) => {
  const node: string = req.body.node;
  if (!node) {
    res.json({ message: "Error: Node is null." });
    return;
  }
  if (blockchain.getNode() == node) {
    res.json({ message: "Error: Current node cannot be registered." });
    return;
  }
  if (blockchain.getNodes().includes(node)) {
    res.json({ message: "Error: Node already registered." });
    return;
  }
  blockchain.addNode(node);
  res.json({ message: "New node registered successfully." });
});

app.post("/nodes/register/bulk", (req, res) => {
  const nodes: string[] = req.body.nodes;
  for (const node of nodes) {
    if (blockchain.getNode() == node) continue;
    if (blockchain.getNodes().includes(node)) continue;
    blockchain.addNode(node);
  }
  res.json({ message: "Bulk registration successful." });
});

app.listen(Number(port) || 3000, () => {
  console.log(`Listening on port ${port || 3000}...`);
});

export default app;
