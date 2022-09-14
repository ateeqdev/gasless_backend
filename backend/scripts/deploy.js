/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const fs = require("fs");
const hardhat = require("hardhat");
const base_dir = "contracts";
const _flat = "";
var game;
var treasuryWallet;
const explorer = "https://testnet.bscscan.com/address/";
var args = [];

var contracts = {
  nitroLeague: {
    address: "",
    contract: "",
    name: "NitroLeague",
  },
  raceEventFactory: {
    address: "",
    contract: "",
    name: "RaceEventFactory",
  },
  raceFactory: {
    address: "",
    contract: "",
    name: "RaceFactory",
  },
  rewardFactory: {
    address: "",
    contract: "",
    name: "RewardFactory",
  },
  race: {
    address: "",
    contract: "",
    name: "Race",
  },
  raceEvent: {
    address: "",
    contract: "",
    name: "RaceEvent",
  },
  erc20: {
    address: "",
    contract: "",
    name: "ERC20Token",
  },
  erc721NFT: {
    address: "",
    contract: "",
    name: "ERC721NFT",
  },
  erc1155NFT: {
    address: "",
    contract: "",
    name: "ERC1155NFT",
  },
  raceEvent: {
    address: "",
    contract: "",
    name: `${base_dir}/main/RaceEvent${_flat}.sol:RaceEvent`,
  },
  race: {
    address: "",
    contract: "",
    name: `${base_dir}/main/Race${_flat}.sol:Race`,
  },
  rewardManager: {
    address: "",
    contract: "",
    name: `${base_dir}/utils/RewardManager${_flat}.sol:RewardManager`,
  },
  tokenWithdrawer: {
    address: "",
    contract: "",
    name: `${base_dir}/utils/TokenWithdrawer${_flat}.sol:TokenWithdrawer`,
  },
};

async function main() {
  console.log("initializing deployments...");
  console.log(
    "To verify contracts you can execute the './scripts/verify.sh' command or run individual commands after this script finishes execution..."
  );

  game = process.env.GAME_ACCOUNT;
  treasuryWallet = process.env.TREASURY_ACCOUNT;

  fs.writeFileSync("scripts/verify.sh", "");

  var twentyMinutesLater = new Date();
  twentyMinutesLater.setMinutes(twentyMinutesLater.getMinutes() + 20);
  twentyMinutesLater = Math.floor(twentyMinutesLater / 1000);

  await deployContract("raceFactory");
  await deployContract("raceEventFactory");
  await deployContract("rewardFactory");

  args.push({ name: "erc20", arguments: ["Nitro ERC20 Token", "Nitro"] });
  await deployContract("erc20", ...args[args.length - 1].arguments);

  args.push({ name: "erc721NFT", arguments: ["Nitro ERC721 NFT", "Nitro721"] });
  await deployContract("erc721NFT", ...args[args.length - 1].arguments);

  await deployContract("erc1155NFT");

  args.push({ name: "rewardManager", arguments: ["0", game] });
  await deployContract("rewardManager", ...args[args.length - 1].arguments);
  await deployContract("tokenWithdrawer");

  args.push({
    name: "nitroLeague",
    arguments: [
      [
        game,
        treasuryWallet,
        contracts.raceEventFactory.address,
        contracts.raceFactory.address,
        contracts.rewardFactory.address,
      ],
    ],
  });
  await deployContract("nitroLeague", ...args[args.length - 1].arguments);

  args.push({
    name: "raceEvent",
    arguments: [
      [contracts.nitroLeague.address, contracts.rewardFactory.address],
      ["Race_Event_ID_1", "Race_Event_Title_1", "Race_Event_URI_1"],
      0,
    ],
  });
  await deployContract("raceEvent", ...args[args.length - 1].arguments);

  args.push({
    name: "race",
    arguments: [
      [
        contracts.nitroLeague.address,
        contracts.erc20.address,
        contracts.rewardFactory.address,
      ],
      ["Race_ID_1", "Race_Title_1", "Race_URI_1"],
      [twentyMinutesLater, 0, 1, 16, 0, 3],
    ],
  });
  await deployContract("race", ...args[args.length - 1].arguments);
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
  console.log(verify);
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
