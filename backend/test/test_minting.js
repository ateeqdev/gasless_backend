const { expect } = require("chai");
const { ethers } = require("hardhat");
const { signMetaTxRequest } = require("../src/signer.js");
const fs = require("fs");

var owner,
  minter,
  provider,
  users = [],
  forwarder,
  nitro20,
  nitro721,
  nitro1155,
  prefix = "Hello",
  amount = 10,
  tokenAmt = 1,
  dailyLimit = 2,
  tokenId = 0,
  current = 0,
  balances = {};

const deployTokens = async function () {
  [owner, minter, ...users] = await ethers.getSigners();

  let forwarder_ = await ethers.getContractFactory("MinimalForwarder");
  let nitro20_ = await ethers.getContractFactory("Nitro20Rewards");
  let nitro721_ = await ethers.getContractFactory("Nitro721Rewards");
  let nitro1155_ = await ethers.getContractFactory("Nitro1155Rewards");

  forwarder = await forwarder_.deploy();
  nitro20 = await nitro20_.deploy(
    "Nitro Token",
    "NITRO",
    forwarder.address,
    minter.address,
    dailyLimit
  );
  nitro721 = await nitro721_.deploy(
    "Nitro NFT",
    "N721",
    forwarder.address,
    minter.address,
    dailyLimit
  );
  nitro1155 = await nitro1155_.deploy(
    forwarder.address,
    minter.address,
    dailyLimit
  );
};

const verifyRights = async function () {
  expect(await nitro20.owner()).to.be.equal(owner.address);
  expect(await nitro20.minter()).to.be.equal(minter.address);

  expect(await nitro721.owner()).to.be.equal(owner.address);
  expect(await nitro721.minter()).to.be.equal(minter.address);

  expect(await nitro1155.owner()).to.be.equal(owner.address);
  expect(await nitro1155.minter()).to.be.equal(minter.address);
};

const mintERC20 = async function (by) {
  await nitro20
    .connect(by)
    .mintGame(prefix + tokenId, users[current].address, amount);
};

const mintERC721 = async function (by) {
  await nitro721
    .connect(by)
    .safeMintGame(prefix + tokenId, users[current].address);
};

const mintERC1155 = async function (by) {
  await nitro1155
    .connect(by)
    .mintGame(prefix + tokenId, users[current].address, tokenId, amount, 0xff);
};

const signTx = async function (contract, func, signer, relayer, args) {
  const data = contract.interface.encodeFunctionData(func, args);
  const result = await signMetaTxRequest(signer, forwarder, {
    to: contract.address,
    from: signer.address,
    relayer: relayer,
    data,
  });
  return result;
};

const signERC20 = async function () {
  return await signTx(nitro20, "mintGame", minter, users[current].address, [
    prefix + tokenId,
    users[current].address,
    amount,
  ]);
};

const signERC721 = async function () {
  return await signTx(
    nitro721,
    "safeMintGame",
    minter,
    users[current].address,
    [prefix + tokenId, users[current].address]
  );
};

const signERC1155 = async function () {
  return await signTx(nitro1155, "mintGame", minter, users[current].address, [
    prefix + tokenId,
    users[current].address,
    tokenId,
    amount,
    0xff,
  ]);
};

const mintAll = async function (by) {
  await mintERC20(by);
  await mintERC721(by);
  await mintERC1155(by);
};

const expectRevert = async function (by, revertMessage) {
  await expect(mintERC20(by)).to.be.revertedWith(revertMessage);

  await expect(mintERC721(by)).to.be.revertedWith(revertMessage);

  await expect(mintERC1155(by)).to.be.revertedWith(revertMessage);
};

const resetDailyLimits = async function () {
  nitro20.resetMintCounter();
  nitro721.resetMintCounter();
  nitro1155.resetMintCounter();
};

const testDailyMintLimit = async function () {
  resetDailyLimits();
  for (let index = 0; index < dailyLimit; index++) {
    await mintAll(minter, tokenId++);
  }
  await expectRevert(minter, "Mintable: Daily Limit Reached");
};

const testIncreaseDailyMintLimit = async function () {
  //Being called by the owner
  await nitro20.setDailyMintLimit(dailyLimit + 1);
  await nitro721.setDailyMintLimit(dailyLimit + 1);
  await nitro1155.setDailyMintLimit(dailyLimit + 1);

  //Being called by the minter
  await mintAll(minter, tokenId++);
};

const testMintingNextDay = async function () {
  const nextDay = Math.floor(new Date() / 1000) + 86400;
  await ethers.provider.send("evm_mine", [nextDay]);

  await mintAll(minter, tokenId++);

  await nitro20.setDailyMintLimit(dailyLimit + 100);
  await nitro721.setDailyMintLimit(dailyLimit + 100);
  await nitro1155.setDailyMintLimit(dailyLimit + 100);
};

const logClaimed = async function (idx) {
  const index = idx ? idx : tokenId;
  console.log(
    "ERC20: ",
    await nitro20.getClaimed(prefix + index, users[current].address),
    await nitro20.balanceOf(users[current].address),
    "ERC721: ",
    await nitro721.getClaimed(prefix + index, users[current].address),
    await nitro721.balanceOf(users[current].address),
    "ERC1155: ",
    await nitro1155.getClaimed(prefix + index, users[current].address),
    await nitro1155.balanceOf(users[current].address, index)
  );
};

const testMintingSameContext = async function () {
  await expectRevert(minter, "ClaimContext: Already Claimed");
};

const testMintingByUser = async function () {
  await expectRevert(users[current], "Mintable: caller is not minter");
};

const logBalances = async function () {
  console.log(
    "Minter ETH: ",
    balances.ethM,
    "End User ETH: ",
    balances.ethU,
    "ERC20: ",
    balances.e20,
    "ERC721: ",
    balances.e721,
    "ERC1155: ",
    balances.e1155
  );
};

const formatBalance = async function (balance, decimals, index) {
  const tmp = parseFloat(ethers.utils.formatUnits(balance, decimals));
  balances[index] = balances[index] ? tmp - balances[index] : tmp;
};

const checkBalanceChange = async function (
  logOutput = 0,
  expectChange = 0,
  e20 = 1,
  e721 = 1,
  e1155 = 1
) {
  const amount_back = amount;
  const oldTokenAmt_back = tokenAmt;
  if (expectChange == 0) balances = {};
  else if (expectChange == -1) tokenAmt = amount = 0;

  const provider = ethers.provider;
  const mAddr = minter.address;
  const uAddr = users[current].address;

  formatBalance(await provider.getBalance(mAddr), 18, "ethM");
  formatBalance(await provider.getBalance(uAddr), 18, "ethU");
  formatBalance(await nitro20.balanceOf(uAddr), 0, "e20");
  formatBalance(await nitro721.balanceOf(uAddr), 0, "e721");
  formatBalance(await nitro1155.balanceOf(uAddr, tokenId), 0, "e1155");

  if (logOutput) logBalances();

  if (expectChange != 0) {
    expect(balances.ethM).to.be.equal(0.0);
    // expect(balances.ethU).to.be.lessThan(0);
    e20 && expect(balances.e20).to.be.equal(parseFloat(amount));
    e721 && expect(balances.e721).to.be.equal(tokenAmt);
    e1155 && expect(balances.e1155).to.be.equal(parseFloat(amount));
  }

  if (expectChange == -1) {
    amount = amount_back;
    tokenAmt = oldTokenAmt_back;
  }
};

const signByMinter = async function () {
  tokenId++;
  await checkBalanceChange(0, 0);
  await relayTx(await signERC20(), users[current]);
  await relayTx(await signERC721(), users[current]);
  await relayTx(await signERC1155(), users[current]);
  await checkBalanceChange(0, 1, 1, 1, 1);
};

const relayOnlyOne = async function () {
  current = 0;
  tokenId++;
  const erc20req = await signERC20();
  const erc721req = await signERC721();
  const erc1155req = await signERC1155();

  await checkBalanceChange(0, 0);
  await relayTx(erc1155req, users[current]);
  await checkBalanceChange(0, 1, 0, 0, 1);

  expect(await forwarder.verify(erc721req.request, erc721req.signature)).to.be
    .false;
  expect(await forwarder.verify(erc20req.request, erc20req.signature)).to.be
    .false;
};

const relayWhenPaused = async function () {
  tokenId++;
  current = 0;
  const uAddr = users[current].address;
  balances = {};
  balances.e20 = parseFloat(
    ethers.utils.formatUnits(await nitro20.balanceOf(uAddr), 0)
  );

  await nitro20.pauseMint();
  const erc20req = await signERC20();

  await relayTx(erc20req, users[current]);

  balances.e20 -= parseFloat(
    ethers.utils.formatUnits(await nitro20.balanceOf(uAddr), 0)
  );
  expect(balances.e20).to.be.equal(0.0);
  await nitro20.unPauseMint();
};

const relayTx = async function (req, relayer) {
  // Validate request on the forwarder contract
  const valid = await forwarder.verify(req.request, req.signature);
  expect(valid).to.be.true;

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(req.request.gas) + 50000).toString();
  return await forwarder
    .connect(relayer)
    .execute(req.request, req.signature, { gasLimit });
};

const setMinter = async function (addr) {
  await nitro20.setMinter(addr);
  expect(await nitro20.minter()).to.be.equal(addr);
  await nitro721.setMinter(addr);
  expect(await nitro721.minter()).to.be.equal(addr);
  await nitro1155.setMinter(addr);
  expect(await nitro1155.minter()).to.be.equal(addr);
};

const signByPrevMinter = async function () {
  tokenId++;
  const uAddr = users[current].address;
  await setMinter(uAddr);
  current++;

  await checkBalanceChange(0, 0);
  await relayTx(await signERC20(), users[current]);
  await relayTx(await signERC721(), users[current]);
  await relayTx(await signERC1155(), users[current]);
  await checkBalanceChange(0, -1, 1, 1, 1);

  const mAddr = minter.address;
  await setMinter(mAddr);
};

describe("Minting ERC20, ERC721, ERC1155 assets through fron-end relayer", async function () {
  it("should deploy token contract", deployTokens);
  it("should not allow minting by non-minter", verifyRights);
  it("should not allow minting more than daily limit", testDailyMintLimit);
  it("should mint after daily limit is increased", testIncreaseDailyMintLimit);
  it("should continue minting next day", testMintingNextDay);
  it("should not mint twice for the same context", testMintingSameContext);
  it("should not allow minting by end user", testMintingByUser);
  it("Should not relay mint from previous minter", signByPrevMinter);
  it("End user should relay transactions signed by minter", signByMinter);
  it("Should invalidate older transactions", relayOnlyOne);
  it("Should not relay mint when paused", relayWhenPaused);
});
