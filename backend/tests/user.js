const ethers = require("ethers");

const { ForwarderAbi } = require("../src/forwarder");
const ForwarderAddress = require("./deploy.json").MinimalForwarder;
var request = require("../tmp/request.json");
const hre = require("hardhat");

async function relay(forwarder, request, signature) {
  // Validate request on the forwarder contract
  const valid = await forwarder.verify(request, signature);
  if (!valid) throw new Error(`Invalid request`);
  console.log("valid", valid);

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(request.gas) + 50000).toString();
  return await forwarder.execute(request, signature, { gasLimit });
}

async function main() {
  //   let { PRIVATE_KEY: signer } = process.env;

  // Parse webhook payload
  if (!request) throw new Error(`Missing payload`);

  const forwarder = await hre.ethers.getContractAt(
    "MinimalForwarder",
    ForwarderAddress
  );

  console.log(`Relaying`, request.request);

  // Relay transaction!
  const tx = await relay(forwarder, request.request, request.signature);
  console.log(`Sent meta-tx: ${tx.hash}`);
  return { txHash: tx.hash };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
