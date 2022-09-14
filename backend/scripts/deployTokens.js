/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const fs = require("fs");
const hardhat = require("hardhat");
var args = [];
const dailyLimit = 2;

var contracts = {
  minimalForwarder: {
    address: "",
    contract: "",
    name: "contracts/lib/MinimalForwarder.sol:MinimalForwarder",
  },
  Nitro1155Rewards: {
    address: "",
    contract: "",
    name: "contracts/tokens/Nitro1155Rewards.sol:Nitro1155Rewards",
  },
  Nitro721Rewards: {
    address: "",
    contract: "",
    name: "contracts/tokens/Nitro721Rewards.sol:Nitro721Rewards",
  },
  Nitro20Rewards: {
    address: "",
    contract: "",
    name: "contracts/tokens/Nitro20Rewards.sol:Nitro20Rewards",
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
    name: "Nitro1155Rewards",
    arguments: [
      contracts.minimalForwarder.address,
      process.env.MINTER_ACCOUNT,
      dailyLimit,
    ],
  });
  await deployContract("Nitro1155Rewards", ...args[args.length - 1].arguments);

  args.push({
    name: "Nitro721Rewards",
    arguments: [
      "Nitro721Rewards",
      "Nitro721Rewards",
      contracts.minimalForwarder.address,
      process.env.MINTER_ACCOUNT,
      dailyLimit,
    ],
  });
  await deployContract("Nitro721Rewards", ...args[args.length - 1].arguments);

  args.push({
    name: "Nitro20Rewards",
    arguments: [
      "Nitro20Rewards",
      "Nitro20Rewards",
      contracts.minimalForwarder.address,
      process.env.MINTER_ACCOUNT,
      dailyLimit,
    ],
  });
  await deployContract("Nitro20Rewards", ...args[args.length - 1].arguments);
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
