/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const ethers = require('ethers');
const provider = ethers.getDefaultProvider();
const hre = require('hardhat');


const testAddress = '0xdF317eA4F7C345B34bf116f53e50330bD8E6d138';

const nitroLeague = {
    address: '0x40be54Cbcfe25b7C84f7EE7874cB0df8658148DE',
    contract: '',
    name: 'NitroLeague'
}

const raceEventFactory = '0x59AC7B0Fe6c4bef7FbA7272b80475Abe444C3bb1';
const raceFactory = '0x548C024dD617aD23CA213058E6A58b50a1F1CE44';


async function main() {
    await getContract();
    // Access.
    await getGame();
    await setGame();
    await getGame();
    // RaceEvents.
    await getRaceEventFactory();
    await setRaceEventFactory();
    await getRaceEventFactory();
    await createRaceEvent();
    // Races.
    await getRaceFactory();
    await setRaceFactory();
    await getRaceFactory();
    await getRaceEventID();
    await getTreasuryWallet();
    await setTreasuryWallet();
    await getTreasuryWallet();
    await raceIDExists();
    await addRaceID();
}


async function getContract() {
    console.log('\nGET CONTRACT');
    nitroLeague.contract = await hre.ethers.getContractAt(nitroLeague.name, nitroLeague.address);
    console.log('Contract is: ' + nitroLeague.contract.address);
}

// Access.

async function getGame(index) {
    console.log('\nGET GAME');
    console.log(await nitroLeague.contract.getGame());
}

async function setGame() {
    console.log('\nSET GAME');
    try {
        const tx = await nitroLeague.contract.setGame(testAddress);
        const res = await tx.wait();
        console.log(res.status ? 'Success' : 'Failure');
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

// RaceEvents.

async function getRaceEventFactory() {
    console.log('\nGET RACE EVENT FACTORY');
    console.log(await nitroLeague.contract.raceEventFactory());
}

async function setRaceEventFactory() {
    console.log('\nSET RACE EVENT FACTORY');
    try {
        const tx = await nitroLeague.contract.setRaceEventFactory(raceEventFactory);
        const res = await tx.wait();
        console.log(res.status ? 'Success' : 'Failure');
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function createRaceEvent() {
    console.log('\nCREATE RACE EVENT');
    try {
        const tx = await nitroLeague.contract.createRaceEvent(
            Math.random(100).toString(),
            '0',
            'q'
        );
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

// Races.

async function getRaceFactory() {
    console.log('\nGET RACE FACTORY');
    console.log(await nitroLeague.contract.raceFactory());
}

async function setRaceFactory() {
    console.log('\n SET RACE FACTORY');
    try {
        const tx = await nitroLeague.contract.setRaceFactory(raceFactory);
        const res = await tx.wait();
        console.log(res.status ? 'Success' : 'Failure');
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function getRaceEventID() {
    console.log('\nGET RACE EVENT ID');
    try {
        console.log(await nitroLeague.contract.raceEventIDsList('0'));
    } catch (error) {
        console.log(error)
    }
}

async function getTreasuryWallet() {
    console.log('\nGET TREASURY WALLET');
    console.log(await nitroLeague.contract.getTreasuryWallet());
}

async function setTreasuryWallet() {
    console.log('\nSET TREASURY WALLET');
    try {
        const tx = await nitroLeague.contract.setTreasuryWallet(testAddress);
        const res = await tx.wait();
        console.log(res.status ? 'Success' : 'Failure');
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function raceIDExists() {
    console.log('\nRACE ID EXISTS');
    try {
        console.log(await nitroLeague.contract.raceIDExists('100'));
    } catch (error) {
        console.log(error)
    }
}

async function addRaceID() {
    console.log('\n ADD RACE ID');
    try {
        const tx = await nitroLeague.contract.addRaceID('100');
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log('Tx failed as expected.');
    }
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });