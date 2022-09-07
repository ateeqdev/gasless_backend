require("dotenv").config();
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
const { ethers } = require("ethers");
const { signMetaTxRequest } = require("./src/signer.js");
const { readFileSync, writeFileSync } = require("fs");

var app = express();

async function getInstance(name) {
  const provider = ethers.getDefaultProvider(process.env.AVAXFUJI_RPC);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const abi = JSON.parse(
    readFileSync("./artifacts/contracts/" + name + ".sol/" + name + ".json")
  )["abi"];

  const address = JSON.parse(readFileSync("tests/deploy.json"))[name];
  if (!address) throw new Error(`Contract ${name} not found in deploy.json`);

  return new ethers.Contract(address, abi, signer);
}

async function signTx(account, functionName, tokenId, amount) {
  const forwarder = await getInstance("MinimalForwarder");
  const erc1155 = await getInstance("ERC1155NFT");

  const { PRIVATE_KEY: signer } = process.env;
  const from = new ethers.Wallet(signer).address;
  console.log(`Signing minting 100 tokens of id 1 to ${account} as ${from}...`);
  const data = erc1155.interface.encodeFunctionData(functionName, [
    account,
    tokenId,
    amount,
    0xff,
  ]);
  const result = await signMetaTxRequest(signer, forwarder, {
    to: erc1155.address,
    from,
    data,
  });

  const signed = JSON.stringify(result, null, 2);
  writeFileSync("tmp/request.json", signed);
  return signed;
}

app.use("/", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/transfer", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(await signTx(req.query.account, "mint", 1, 100));
});

app.get("/mint", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(await signTx(req.query.account, "mint", 2, 1));
});

app.listen(30001);

console.log("Server started: http://localhost:30001/");
