const { ethers } = require("hardhat");
const fs = require("fs");

var artifact = {
  raceEvent: require("../artifacts/contracts/main/RaceEvent.sol/RaceEvent.json"),
  race: require("../artifacts/contracts/main/Race.sol/Race.json"),
  reward: require("../artifacts/contracts/utils/RewardManager.sol/RewardManager.json"),
};
var owner,
  addrs,
  nitro,
  nitro20,
  nitro721,
  nitro1155,
  raceEvent,
  race,
  players = [],
  amount = "1000000000000000000000000",
  rewardM,
  totalTasks = 9,
  currentTask = 0,
  pause = 20;

const race_names = ["Daily Practice Race", "Weekly Tournament Race"];

const logTask = function (message) {
  console.log("Task " + ++currentTask + "/" + totalTasks + ": " + message);
};

const setAddresses = async function () {
  addrs = JSON.parse(
    fs.readFileSync(
      "addresses/" + process.env.HARDHAT_NETWORK.toLowerCase() + ".json",
      "utf8"
    )
  );
};

const createRaceEvent = async function () {
  const timestamp = Math.floor(Date.now() / 1000);
  nitro = await ethers.getContractFactory("NitroLeague");
  nitro = await nitro.attach(addrs.nitroLeague);
  let tx = await nitro.setGame(owner.address);
  let receipt = tx.wait();
  tx = await nitro.createRaceEvent(
    [
      "RaceEvent_ID_" + timestamp,
      "RaceEvent_Title_" + timestamp,
      "RaceEvent_URI_" + timestamp,
    ],
    0
  );
  receipt = await tx.wait();
  addrs.raceEvent = receipt.logs[0].address;
};

const createRace = async function () {
  const timestamp = Math.floor(Date.now() / 1000);
  logTask("Creating race " + timestamp + " ...");
  raceEvent = await ethers.getContractFactory("RaceEvent");
  raceEvent = await raceEvent.attach(addrs.raceEvent);

  let future = new Date();
  future = Math.floor(future / 1000) + pause;
  const race_access = 0; //1 for open to everyone, 0 for admin-only
  const min_players = 1; //Minimum number of players
  const max_players = 16; //maximum number of players allowed
  const fee_amount = 0; //Fees a player should pay to enter the race
  const win_positions = 3; //Number of winning positions
  const int_settings = [
    future,
    race_access,
    min_players,
    max_players,
    fee_amount,
    win_positions,
  ];
  let i = 0;
  const raceID_title_uri = [
    race_names[i] + " ID " + timestamp,
    race_names[i] + " Title " + timestamp,
    race_names[i] + " URI " + timestamp,
  ];

  const tx = await raceEvent.createRace(
    addrs.erc20,
    raceID_title_uri,
    int_settings
  );
  const receipt = await tx.wait();

  race = new ethers.Contract(receipt.logs[0].address, artifact.race.abi, owner);
  rewardM = new ethers.Contract(
    await race.rewardManager(),
    artifact.reward.abi,
    owner
  );
  logTask("Deployed race at " + race.address);
};

const addPlayersToRace = async function () {
  logTask("Adding players to the race...");

  players = [
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    ethers.Wallet.createRandom().address,
    owner.address,
  ];
  const tx = await race.addPlayers(players);
  await tx.wait();
};

const mintAndApprove = async function () {
  /** Mint ERC20 tokens and set allowance */
  await nitro20.mint(owner.address, amount);
  await nitro20.approve(rewardM.address, amount);

  /** Mint NFTs and set allowance */
  await nitro721.claimNewMint();
  await nitro721.setApprovalForAll(rewardM.address, true);

  /** Mint ERC1155 tokens and set allowance */
  await nitro1155.mint(owner.address, 1, amount, 0xff);
  await nitro1155.setApprovalForAll(rewardM.address, true);
};

const depositRewardsToRace = async function () {
  logTask("Depositing Rewards to the race...");
  const tx = await race.depositRewards(
    [1, 1, 2, 3],
    [3, 3, 3, 3],
    [
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
    ],
    [0, 0, 0, 0],
    [amount, amount, 1, amount],
    ["", "", "", ""]
  );
  await tx.wait();
};

const setParticipantsURI = async function () {
  logTask("Setting participants URI to the race...");
  await race.setParticipantsURI("participants_uri.com");
};

const startRaceAndEndRace = async function () {
  const raceStartTime = await race.raceStartTime();
  logTask(
    "Waiting for race start time... " + (await race.raceStartTime()),
    Math.floor(new Date() / 1000)
  );
  await new Promise((resolve) => setTimeout(resolve, pause * 1000)); // Wait till race start time
  logTask("Starting race...");

  let tx = await race.startRace();
  await tx.wait();

  logTask("Ending race and publishing results...");
  tx = await race.endRace([owner.address, players[0], players[1]]);
  await tx.wait();

  logTask("Writing race address to the DB...");
  var db = { race: race.address, winner: owner.address };
  fs.writeFileSync("./tmp/db.json", JSON.stringify(db));
};

async function main() {
  await setAddresses();
  [owner] = await ethers.getSigners();
  await createRace();
  await addPlayersToRace();
  await depositRewardsToRace();
  await setParticipantsURI();
  await startRaceAndEndRace();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
