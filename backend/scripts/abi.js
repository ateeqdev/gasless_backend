const fs = require("fs");

const nitroLeague = require("../artifacts/contracts/main/NitroLeague.sol/NitroLeague.json");
const raceEvent = require("../artifacts/contracts/main/RaceEvent.sol/RaceEvent.json");
const race = require("../artifacts/contracts/main/Race.sol/Race.json");

const erc20 = require("../artifacts/contracts/tokens/ERC20Token.sol/ERC20Token.json");
const erc721 = require("../artifacts/contracts/tokens/ERC721NFT.sol/ERC721NFT.json");
const erc1155 = require("../artifacts/contracts/tokens/ERC1155NFT.sol/ERC1155NFT.json");

const raceEventFactory = require("../artifacts/contracts/utils/RaceEventFactory.sol/RaceEventFactory.json");
const raceFactory = require("../artifacts/contracts/utils/RaceFactory.sol/RaceFactory.json");
const rewardManager = require("../artifacts/contracts/utils/RewardManager.sol/RewardManager.json");
const tokenWithdrawer = require("../artifacts/contracts/utils/TokenWithdrawer.sol/TokenWithdrawer.json");

async function main() {
  fs.writeFileSync(
    "./abi/main/NitroLeague_ABI.json",
    JSON.stringify(nitroLeague.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/main/RaceEvent_ABI.json",
    JSON.stringify(raceEvent.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/main/Race_ABI.json",
    JSON.stringify(race.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  fs.writeFileSync(
    "./abi/tokens/ERC20Token_ABI.json",
    JSON.stringify(erc20.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/tokens/ERC721NFT_ABI.json",
    JSON.stringify(erc721.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/tokens/ERC1155NFT_ABI.json",
    JSON.stringify(erc1155.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  fs.writeFileSync(
    "./abi/utils/RaceEventFactory_ABI.json",
    JSON.stringify(raceEventFactory.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/utils/RaceFactory_ABI.json",
    JSON.stringify(raceFactory.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/utils/RewardManager_ABI.json",
    JSON.stringify(rewardManager.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
  fs.writeFileSync(
    "./abi/utils/TokenWithdrawer_ABI.json",
    JSON.stringify(tokenWithdrawer.abi),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
