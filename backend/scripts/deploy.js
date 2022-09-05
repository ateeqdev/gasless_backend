/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const fs = require("fs");
const hardhat = require("hardhat");
var args = [];

var contracts = {
  minimalForwarder: {
    address: "",
    contract: "",
    name: "contracts/MinimalForwarder.sol:MinimalForwarder",
  },
  ERC1155NFT: {
    address: "",
    contract: "",
    name: "contracts/ERC1155NFT.sol:ERC1155NFT",
  },
};

async function main() {
  console.log("initializing deployments...");
  console.log(
    "To verify contracts you can execute the './scripts/verify.sh' command or run individual commands after this script finishes execution..."
  );

  fs.writeFileSync("scripts/verify.sh", "");

  await deployContract("minimalForwarder");

  args.push({
    name: "ERC1155NFT",
    arguments: [contracts.minimalForwarder.address],
  });
  await deployContract("ERC1155NFT", ...args[args.length - 1].arguments);
}

async function deployContract(contract, ...args) {
  const deployConfig = await hardhat.ethers.getContractFactory(
    contracts[contract].name
  );
  contracts[contract].contract = await deployConfig.deploy(...args);
  contracts[contract].address = contracts[contract].contract.address;

  let verify =
    "npx hardhat verify --network " +
    process.env.HARDHAT_NETWORK +
    " " +
    contracts[contract].address;
  if (args[0]) verify += ` --constructor-args scripts/arguments/${contract}.js`;
  verify += ";\n";

  fs.appendFile("scripts/verify.sh", verify, function (err) {
    if (err) {
      return console.log(err);
    }
  });
  if (args[0])
    fs.writeFileSync(
      `scripts/arguments/${contract}.js`,
      "module.exports = " + JSON.stringify(args) + ";"
    );

  await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 sec

  console.log(contract + ": " + contracts[contract].address);
  console.log(contract + ": " + verify);
}

/**
 * Write argument files for contracts
 */
async function writeArguments() {
  for (let index = 0; index < args.length; index++) {
    fs.writeFileSync(
      `scripts/arguments/${args[index].name}.js`,
      "module.exports = " + JSON.stringify(args[index].arguments) + ";"
    );
  }
}

main()
  .then(() => {
    writeArguments();
  })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
