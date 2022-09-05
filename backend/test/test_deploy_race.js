const { expect } = require("chai");
const { ethers } = require("hardhat");
var artifact = {
  nitro: require("../artifacts/contracts/main/NitroLeague.sol/NitroLeague.json"),
  raceEvent: require("../artifacts/contracts/main/RaceEvent.sol/RaceEvent.json"),
  race: require("../artifacts/contracts/main/Race.sol/Race.json"),
  reward: require("../artifacts/contracts/utils/RewardManager.sol/RewardManager.json"),
};
var owner,
  nitro20,
  treasuryWallet,
  treasuryBalance = 0,
  openRaceFee = 10,
  nitro721,
  nitro1155,
  raceFactory,
  rewardFactory,
  raceEventFactory,
  nitro,
  raceEvent,
  race,
  openRace,
  players = [],
  amount = "1000000000000000000000000",
  rewardM,
  pause = 7;

const race_event_names = [
  "Daily Practice Race Event",
  "Weekly Tournament Race Event",
];

const race_names = ["Daily Practice Race", "Weekly Tournament Race"];

const deployNitroLeague = async function () {
  [owner, treasuryWallet] = await ethers.getSigners();

  let nitro20_ = await ethers.getContractFactory("ERC20Token");
  let nitro721_ = await ethers.getContractFactory("ERC721NFT");
  let nitro1155_ = await ethers.getContractFactory("ERC1155NFT");
  let raceEventFactory_ = await ethers.getContractFactory("RaceEventFactory");
  let raceFactory_ = await ethers.getContractFactory("RaceFactory");
  let rewardFactory_ = await ethers.getContractFactory("RewardFactory");
  let nitro_ = await ethers.getContractFactory("NitroLeague");

  nitro20 = await nitro20_.deploy("Nitro Token", "NITRO");
  nitro721 = await nitro721_.deploy("Nitro NFT", "N721");
  nitro1155 = await nitro1155_.deploy();

  raceEventFactory = await raceEventFactory_.deploy();
  raceFactory = await raceFactory_.deploy();
  rewardFactory = await rewardFactory_.deploy();

  nitro = await nitro_.deploy([
    owner.address,
    treasuryWallet.address,
    raceEventFactory.address,
    raceFactory.address,
    rewardFactory.address,
  ]);
};

const createRaceEvent = async function () {
  let i = 0;
  const tx = await nitro.createRaceEvent(
    [
      race_event_names[i] + " ID " + (i + 1),
      race_event_names[i] + " Title " + (i + 1),
      race_event_names[i] + " URI " + (i + 1),
    ],
    0 /* ,
    { gasPrice: 80000000000000, gasLimit: 3000000 } */
  );

  const receipt = await tx.wait();
  raceEvent = new ethers.Contract(
    receipt.logs[0].address,
    artifact.raceEvent.abi,
    owner
  );
};

const createRace = async function () {
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
    race_names[i] + " ID " + (i + 1),
    race_names[i] + " Title " + (i + 1),
    race_names[i] + " URI " + (i + 1),
  ];

  const tx = await raceEvent.createRace(
    nitro20.address,
    raceID_title_uri,
    int_settings
  );
  const receipt = await tx.wait();

  race = new ethers.Contract(receipt.logs[0].address, artifact.race.abi, owner);
  rewardM = new ethers.Contract(
    race.rewardManager(),
    artifact.reward.abi,
    owner
  );
};

const addPlayersToRace = async function () {
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

const addDuplicatePlayers = async function () {
  const random_addr = ethers.Wallet.createRandom().address;
  const tx = await race.addPlayers([owner.address, random_addr]);
  const receipt = await tx.wait();
  expect(receipt.logs.length).to.be.equal(1);
};

const joinDuplicate = async function () {
  openRace = await ethers.getContractFactory("Race");
  let future2 = new Date();
  future2 = Math.floor(future2 / 1000) + 10;
  const race_access = 1; //1 for open to everyone, 0 for admin-only
  const min_players = 1; //Minimum number of players
  const max_players = 16; //maximum number of players allowed
  const win_positions = 1; //Number of winning positions
  const int_settings = [
    future2,
    race_access,
    min_players,
    max_players,
    openRaceFee,
    win_positions,
  ];
  let i = 1;
  const raceID_title_uri = [
    race_names[i] + " ID " + (i + 1),
    race_names[i] + " Title " + (i + 1),
    race_names[i] + " URI " + (i + 1),
  ];
  openRace = await openRace.deploy(
    [nitro.address, nitro20.address, rewardFactory.address],
    raceID_title_uri,
    int_settings
  );

  await expect(openRace.joinRace()).to.be.revertedWith(
    "Insufficient allowance"
  );

  /** set allowance without balance */
  await nitro20.approve(openRace.address, openRaceFee * 10);
  await expect(openRace.joinRace()).to.be.revertedWith(
    "Insufficient allowance"
  );

  /** Mint ERC20 tokens and join successfully */
  await nitro20.mint(owner.address, openRaceFee * 10);
  await openRace.joinRace();

  await expect(openRace.joinRace()).to.be.revertedWith("Duplicate player");

  openRace.setParticipantsURI("participants2");
};

const mintAndApprove = async function () {
  /** Mint ERC20 tokens and set allowance */
  await nitro20.mint(owner.address, amount);
  await nitro20.approve(rewardM.address, amount);
  let allowance = await nitro20.allowance(owner.address, rewardM.address);
  expect(allowance.toString()).to.equal(amount);

  /** Mint NFTs and set allowance */
  await nitro721.claimNewMint();
  await nitro721.setApprovalForAll(rewardM.address, true);
  allowance = await nitro721.isApprovedForAll(owner.address, rewardM.address);
  expect(allowance).to.equal(true);

  /** Mint ERC1155 tokens and set allowance */
  await nitro1155.mint(owner.address, 1, amount, 0xff);
  await nitro1155.setApprovalForAll(rewardM.address, true);
  allowance = await nitro1155.isApprovedForAll(owner.address, rewardM.address);
  expect(allowance).to.equal(true);
};

const depositRewardsToRace = async function () {
  let balance = await nitro20.balanceOf(rewardM.address);
  expect(Number(balance)).to.equal(0);
  balance = await nitro721.balanceOf(rewardM.address);
  expect(Number(balance)).to.equal(0);
  balance = await nitro1155.balanceOf(rewardM.address, 1);
  expect(Number(balance)).to.equal(0);

  let allowance = await nitro20.allowance(owner.address, rewardM.address);
  expect(allowance.toString()).to.equal(amount);

  const tx = await race.depositRewards(
    [1, 2, 3],
    [0, 1, 2],
    [nitro20.address, nitro721.address, nitro1155.address],
    [0, 1, 1],
    [amount, 1, amount],
    ["", "", ""]
  );
  await tx.wait();

  balance = await nitro20.balanceOf(rewardM.address);
  expect(balance.toString()).to.equal(amount);
  balance = await nitro721.balanceOf(rewardM.address);
  expect(Number(balance)).to.equal(1);
  balance = await nitro1155.balanceOf(rewardM.address, 1);
  expect(balance.toString()).to.equal(amount);
};

const setParticipantsURI = async function () {
  expect(race.startRace()).to.be.revertedWith("participants_info_uri not set");
  race.setParticipantsURI("participants_uri.com");
};

const endInactiveRace = async function () {
  await expect(race.endRace([owner.address])).to.be.revertedWith(
    "Race is not active"
  );
};

const startRaceAndEndRace = async function () {
  await new Promise((resolve) => setTimeout(resolve, pause * 1000)); // Wait till race start time

  await race.startRace();

  const random_addr = ethers.Wallet.createRandom().address;
  expect(
    race.endRace([random_addr, owner.address, owner.address])
  ).to.be.revertedWith("Non-player winner");

  await race.endRace([owner.address, owner.address, owner.address]);
  let owner_position = await rewardM.positionResults(owner.address);
  expect(Number(owner_position)).to.equal(3);
};

const transferFee = async function () {
  await openRace.startRace();

  /**
   * Increase the balance of Open Race to verify wheather
   * all the balance is transferred or only the (race fees * no. of players)
   */
  nitro20.mint(openRace.address, 100000000);

  expect(await nitro20.balanceOf(treasuryWallet.address)).to.be.equal(
    treasuryBalance
  );
  await openRace.endRace([owner.address]);

  /**
   * Although, race contract has more balance than the fee amount generated
   * Only 1 * openRaceFee is transferred to the treasury wallet
   * Because only one player joined the race
   * */
  expect(await nitro20.balanceOf(treasuryWallet.address)).to.be.equal(
    1 * openRaceFee
  );
};

const claimRewards = async function () {
  balance = await nitro1155.balanceOf(owner.address, 1);
  expect(Number(balance)).to.equal(0);
  await race.claimRewards();
  balance = await nitro1155.balanceOf(owner.address, 1);
  expect(balance.toString()).to.equal(amount);
};

describe("Complete flow of race", async function () {
  it("should deploy NitroLeague contract", deployNitroLeague);
  it("should create a Race Event via NitroLeague contract", createRaceEvent);
  it("should create a Race via RaceEvent contract", createRace);
  it("should add players to the Race contract", addPlayersToRace);
  it("should not add a duplicate player via addPlayer", addDuplicatePlayers);
  it("should not allow a player to join multiple times", joinDuplicate);
  it("should mint new tokens and set approval", mintAndApprove);
  it("should deposit rewards to the Race contract", depositRewardsToRace);
  it(
    "should not start race before setting participants info",
    setParticipantsURI
  );
  it("should not end an inactive race", endInactiveRace);
  it(
    "should start race, end race, and make sure winners are from players",
    startRaceAndEndRace
  );
  it("should transfer fee for an open race", transferFee);
  it("should allow winners to claim rewards", claimRewards);
});
