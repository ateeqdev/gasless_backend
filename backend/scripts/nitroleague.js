/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const ethers = require('ethers');
const provider = ethers.getDefaultProvider();
const hre = require('hardhat');

const dead = '0x000000000000000000000000000000000000dEaD';
const game = '0x000000000000000000000000000000000000dEaD';

const contracts = {
    nitroLeague: {
        address: '',
        contract: '',
        name: 'NitroLeague'
    },
    raceEventFactory: {
        address: '',
        contract: '',
        name: 'RaceEventFactory'
    },
    raceEvent: {
        address: '',
        contract: '',
        name: 'RaceEvent'
    },
    raceFactory: {
        address: '',
        contract: '',
        name: 'RaceFactory'
    },
    race: {
        address: '',
        contract: '',
        name: 'Race'
    }
};

async function main() {
    await initDeploy();
    console.log(contracts);
}

async function initDeploy() {
    // RaceEventFactory.
    const raceEventFactory = await hre.ethers.getContractFactory(contracts.raceEventFactory.name);
    contracts.raceEventFactory.contract = await raceEventFactory.deploy();
    contracts.raceEventFactory.address = contracts.raceEventFactory.contract.address;

    // RaceFactory.
    // const raceFactory = await hre.ethers.getContractFactory(contracts.raceFactory.name);
    // contracts.raceFactory.contract = await raceFactory.deploy();
    // contracts.raceFactory.address = contracts.raceFactory.contract.address;

    // // NitroLeague.
    // const nitroLeague = await hre.ethers.getContractFactory(contracts.nitroLeague.name);
    // contracts.nitroLeague.contract = await nitroLeague.deploy(
    //     contracts.raceEventFactory.address,
    //     contracts.raceEventFactory.address,
    //     contracts.raceFactory.address
    // );
}

async function initGet() {
    contracts.raceEventFactory.contract = await getContract('RaceEventFactory', contracts.raceEventFactory.address);
    contracts.raceFactory.contract = await getContract('RaceFactory', contracts.raceFactory.address);
    contracts.nitroLeague.contract = await getContract('NitroLeague', contracts.nitroLeague.address);
}

async function deploy(name, args) {
    const contract = await hre.ethers.getContractFactory(name);
    return contract.deploy(args);
}

async function getContract(name, address) {
    return hre.ethers.getContractAt(name, address);
}

async function execute(contract, functionName, arg1, arg2) {
    const tx = await contract.functionName(arg1, arg2)
    return tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });