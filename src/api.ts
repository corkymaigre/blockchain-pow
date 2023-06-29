import express from "express";
import bodyParser from "body-parser";
import { v1 as uuid } from "uuid";

import Blockchain from "./blockchain";
import Block from "./model/block";
import BlockData from "./model/blockdata";

const MINING_REWARD: number = 12.5;
const NODE_ADDRESS: string = uuid().split("-").join("");

const blockchain: Blockchain = new Blockchain();

const app: express.Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", (req, res) => {
  res.send(blockchain);
});

app.post("/transaction", (req, res) => {
  const blockIndex = blockchain.createTransaction(req.body.amount, req.body.from, req.body.to);
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

app.get("/mine", (req, res) => {
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

app.listen(3000, () => {
  console.log("Listening on port 3000...");
});

export default app;
