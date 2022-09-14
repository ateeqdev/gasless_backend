require("dotenv").config();
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
const { ethers } = require("ethers");
const raceAddr = require("../tmp/db.json");
const { signMetaTxRequest } = require("../src/signer.js");
const { readFileSync, writeFileSync } = require("fs");

var artifact = {
  race: require("../artifacts/contracts/main/Race.sol/Race.json"),
  reward: require("../artifacts/contracts/utils/RewardManager.sol/RewardManager.json"),
};
var race,
  rewardM,
  totalTasks = 9,
  currentTask = 0;

const logTask = function (message) {
  console.log("Task " + ++currentTask + "/" + totalTasks + ": " + message);
};

const verifyRaceWinner = async function (winner) {
  // Second parameter is chainId, 1 for Ethereum mainnet
  const provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  race = new ethers.Contract(raceAddr.race, artifact.race.abi, signer);

  rewardM = new ethers.Contract(
    await race.rewardManager(),
    artifact.reward.abi,
    signer
  );

  const position = await rewardM.positionResults(winner);
  const positionRewards = await rewardM.positionRewards(position, 0);
  const positionRewards2 = await rewardM.positionRewards(position, 1);
  console.log(position, "\n", positionRewards, "\n", positionRewards2);

  const positionRewards3 = await rewardM.positionRewards(position, 3);
  console.log(positionRewards3);
};

async function main() {
  await verifyRaceWinner(process.env.ACCOUNT);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
