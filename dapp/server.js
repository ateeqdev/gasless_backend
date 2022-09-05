var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
const { ethers } = require("hardhat");
const { signMetaTxRequest } = require("./src/signer");
const { readFileSync, writeFileSync } = require("fs");

function getInstance(name) {
  const address = JSON.parse(readFileSync("tests/deploy.json"))[name];
  if (!address) throw new Error(`Contract ${name} not found in deploy.json`);
  return ethers.getContractFactory(name).then((f) => f.attach(address));
}

async function main() {
  const forwarder = await getInstance("MinimalForwarder");
  const registry = await getInstance("Registry");

  const { NAME: name, PRIVATE_KEY: signer } = process.env;
  const from = new ethers.Wallet(signer).address;
  console.log(`Signing registration of ${name || DEFAULT_NAME} as ${from}...`);
  const data = registry.interface.encodeFunctionData("register", [
    name || DEFAULT_NAME,
  ]);
  const result = await signMetaTxRequest(signer, forwarder, {
    to: registry.address,
    from,
    data,
  });

  writeFileSync("tmp/request.json", JSON.stringify(result, null, 2));
  console.log(`Signature: `, result.signature);
  console.log(`Request: `, result.request);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

app.use("/", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/name", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(comments));
});

app.listen(30001);

console.log("Server started: http://localhost:30001/");
