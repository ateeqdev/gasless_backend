/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const ethers = require("ethers");
const provider = ethers.getDefaultProvider();
const hre = require("hardhat");

const game = "0x3e1820fB4A21D920b9E5CA02ECb3090B979a635c";
const treasuryWallet = "0x131f0d765D60c1049B19cED1Dfe7c6150ec72ED0";

const contracts = {
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
  rewardManager: {
    address: "",
    contract: "",
    name: "RewardManager",
  },
};

async function main() {
  await deployRewardManager();
  await deployRaceEventFactory();
  await deployRaceFactory();
  await deployNitroLeague();
  //   console.log(contracts);

  console.log("nitroLeague: " + contracts.nitroLeague.address);
  console.log("rewardManager: " + contracts.rewardManager.address);
  console.log("game: " + game);
  console.log("treasuryWallet: " + treasuryWallet);
  console.log("raceEventFactory: " + contracts.raceEventFactory.address);
  console.log("raceFactory: " + contracts.raceFactory.address);
}

async function deployRaceEventFactory() {
  const raceEventFactory = await hre.ethers.getContractFactory(
    contracts.raceEventFactory.name
  );
  contracts.raceEventFactory.contract = await raceEventFactory.deploy();
  contracts.raceEventFactory.address =
    contracts.raceEventFactory.contract.address;
}

async function deployRewardManager() {
  const rewardManager = await hre.ethers.getContractFactory(
    contracts.rewardManager.name
  );
  contracts.rewardManager.contract = await rewardManager.deploy();
  contracts.rewardManager.address = contracts.rewardManager.contract.address;
}

async function deployRaceFactory() {
  const raceFactory = await hre.ethers.getContractFactory(
    contracts.raceFactory.name
  );
  contracts.raceFactory.contract = await raceFactory.deploy();
  contracts.raceFactory.address = contracts.raceFactory.contract.address;
}

async function deployNitroLeague() {
  const nitroLeague = await hre.ethers.getContractFactory(
    contracts.nitroLeague.name
  );
  contracts.nitroLeague.contract = await nitroLeague.deploy([
    game,
    treasuryWallet,
    contracts.raceEventFactory.address,
    contracts.raceFactory.address,
  ]);
  contracts.nitroLeague.address = contracts.nitroLeague.contract.address;
  console.log("Nitroleague address: ", contracts.nitroLeague.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// npx hardhat verify contractAddress game raceEventFactory raceFactory --network BSCTESTNET
