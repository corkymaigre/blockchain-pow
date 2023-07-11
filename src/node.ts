import express from "express";
import bodyParser from "body-parser";
import { v1 as uuid } from "uuid";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

import Blockchain from "./blockchain";
import Block from "./model/block";
import BlockData from "./model/blockdata";
import Transaction from "./model/transaction";

interface BlockchainData {
  chain: Block[];
  pendingTransactions: Transaction[];
}

const MINING_REWARD: number = 12.5;
const NODE_ADDRESS: string = uuid().split("-").join("");

const port: string = process.argv[2];

export const blockchain: Blockchain = new Blockchain();

const app: express.Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/blockchain", (_req, res) => {
  res.json(blockchain);
});

app.post("/blockchain/transaction", (req, res) => {
  const transaction: Transaction = req.body;
  const blockIndex: number = blockchain.addPendingTransaction(transaction);
  res.json({ message: `Transaction will be added in block ${blockIndex}.` });
});

app.post("/blockchain/transaction/broadcast", (req, res) => {
  const transaction: Transaction = blockchain.createTransaction(req.body.amount, req.body.from, req.body.to);
  blockchain.addPendingTransaction(transaction);

  const promises: Promise<AxiosResponse>[] = [];
  for (const node of blockchain.getNodes()) {
    const config: AxiosRequestConfig = {
      url: `${node}/blockchain/transaction`,
      method: "POST",
      data: transaction,
    };
    promises.push(axios(config));
  }

  Promise.all(promises).then(() => {
    res.json({ message: "Transaction created and broadcast successfully." });
  });
});

app.get("/blockchain/mine", (_req, res) => {
  const lastBlock: Block = blockchain.getLastBlock();
  const prevHash: string = lastBlock.hash;

  const data: BlockData = {
    transactions: blockchain.getPendingTransactions(),
    index: lastBlock.index + 1,
  };

  const nonce: number = blockchain.proofOfWork(prevHash, data);
  const hash: string = blockchain.hash(prevHash, data, nonce);
  const block: Block = blockchain.mine(nonce, prevHash, hash);

  const promises: Promise<AxiosResponse>[] = [];

  for (const node of blockchain.getNodes()) {
    const config: AxiosRequestConfig = {
      url: `${node}/blockchain/receive`,
      method: "POST",
      data: { block },
    };
    promises.push(axios(config));
  }

  Promise.all(promises)
    .then(() => {
      const config: AxiosRequestConfig = {
        url: `${blockchain.getNode()}/blockchain/transaction/broadcast`,
        method: "POST",
        data: {
          amount: MINING_REWARD,
          to: "00",
          from: NODE_ADDRESS,
        },
      };
      return axios(config);
    })
    .then(() => {
      res.json({
        message: "New block mined and broadcast successfully",
        block,
      });
    });
});

app.post("/blockchain/receive", (req, res) => {
  const block: Block = req.body.block;
  const lastBlock: Block = blockchain.getLastBlock();
  const correctHash: boolean = lastBlock.hash === block.prevHash;
  const correctIndex: boolean = lastBlock["index"] + 1 === block["index"];
  if (correctHash && correctIndex) {
    blockchain.addBlock(block);
    blockchain.setPendingTransactions([]);
    res.json({
      message: "New block received and accepted",
      block,
    });
  } else {
    res.json({
      message: "New block rejected",
      block,
    });
  }
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

app.get("/consensus", (req, res) => {
  const promises: Promise<AxiosResponse>[] = [];
  for (const node of blockchain.getNodes()) {
    const config: AxiosRequestConfig = {
      url: `${node}/blockchain`,
      method: "GET",
    };
    promises.push(axios(config));
  }
  Promise.all(promises).then((responses: AxiosResponse<BlockchainData>[]) => {
    const chainLength: number = blockchain.getChain().length;
    let maxChainLength: number = chainLength;
    let longestChain: Block[] | undefined;
    let transactions: Transaction[] | undefined;

    for (const response of responses) {
      const chain: Block[] = response.data.chain;
      const pendingTransactions: Transaction[] = response.data.pendingTransactions;
      const length: number = chain.length;
      if (length > maxChainLength) {
        maxChainLength = length;
        longestChain = chain;
        transactions = pendingTransactions;
      }
    }

    if (!longestChain || !transactions || (longestChain && transactions && !blockchain.isChainValid(longestChain))) {
      return res.json({ message: "Current chain has not been replaced.", chain: blockchain.getChain() });
    }

    blockchain.setChain(longestChain);
    blockchain.setPendingTransactions(transactions);
    res.json({ message: "This chain has been replaced.", chain: blockchain.getChain() });
  });
});

app.get("/block/:hash", (req, res) => {
  const hash: string = req.params.hash;
  const block: Block | undefined = blockchain.getBlock(hash);
  res.json({
    block,
  });
});

app.get("/transaction/:id", (req, res) => {
  const id: string = req.params.id;
  const transactionData = blockchain.getTransaction(id);
  res.json(transactionData);
});

app.get("/address/:address", (req, res) => {
  const address = req.params.address;
  const addressData = blockchain.getAddressData(address);
  res.json(addressData);
});

app.listen(Number(port) || 3000, () => {
  console.log(`Listening on port ${port || 3000}...`);
});

export default app;
