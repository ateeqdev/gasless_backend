// /* eslint-disable spaced-comment */
/* eslint-disable no-console */
const ethers = require('ethers');
const provider = ethers.getDefaultProvider();
const hre = require('hardhat');


// Replace with your dev address.
const admin = '0xdF317eA4F7C345B34bf116f53e50330bD8E6d138';

// Add test players.
const players = {
    p1: '',
    p2: '',
    p3: '',
    p4: ''
}

// Get relevant chains addresses from README.
const contracts = {
    nitroLeague: {
        address: '0x40be54Cbcfe25b7C84f7EE7874cB0df8658148DE',
        contract: '',
        name: 'NitroLeague'
    },
    raceEvent: {
        address: '',
        contract: '',
        name: 'RaceEvent'
    },
    race: {
        address: '',
        contract: '',
        name: 'Race'
    }
}

// Get relevant chains addresses from README.
const tokens = {
    erc20: {
        address: '0x70910B55Afd3f6c00A468b87177f22B6246398D0',
        contract: '',
        name: 'ERC20Token'
    },
    erc721: {
        address: '0xe608d83b05a28a5fa33a476054ec7bbdc6532fc2',
        contract: '',
        name: 'ERC721NFT'
    },
    erc1155: {
        address: '0xeb66344a9abb1e2212461c5cce449d7ee7cdf84b',
        contract: '',
        name: 'ERC1155NFT'
    }
}


async function main() {

    await getTokenContracts();

    // NitroLeague.

    // Get NitroLeague.
    await getContract();
    // Set game.
    await setGame();
    // Create RaceEvent.
    await createRaceEvent();

    // RaceEvent.

    // Deposit RaceEvent rewards.
    // Note: 
    await depositRewards(contracts.raceEvent.contract, contracts.raceEvent.address);
    // Create Race.
    await createRace();
    await setRaceSettings();

    // Race.

    // Deposit Race rewards.
    await depositRewards(contracts.race.contract, contracts.race.address);
    // Add player to Race.
    await addPlayers();
    // Start Race.
    await startRace();
    // End Race.
    await endRace();
    // Claim Race rewards.
    await claimRewards(contracts.race.contract);

    // RaceEvent.

    // End RaceEvent.
    await endRaceEvent();
    // Claim RaceEvent rewards.
    await claimRewards(contracts.raceEvent.contract);
}


async function getTokenContracts() {
    console.log('\nGET TOKEN CONTRACTS');
    tokens.erc20.contract = await hre.ethers.getContractAt(tokens.erc20.name, tokens.erc20.address);
    tokens.erc721.contract = await hre.ethers.getContractAt(tokens.erc721.name, tokens.erc721.address);
    tokens.erc1155.contract = await hre.ethers.getContractAt(tokens.erc1155.name, tokens.erc1155.address);
}

async function getContract() {
    console.log('\nGET CONTRACT');
    contracts.nitroLeague.contract = await hre.ethers.getContractAt(contracts.nitroLeague.name, contracts.nitroLeague.address);
    console.log('Contract is: ' + contracts.nitroLeague.contract.address);
}

async function setGame() {
    console.log('\nSET GAME');
    try {
        const tx = await contracts.nitroLeague.contract.setGame(admin);
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function createRaceEvent() {
    console.log('\nCREATE RACE EVENT');
    try {
        const tx = await contracts.nitroLeague.contract.createRaceEvent(
            Math.random(1000).toString(),
            '0',
            'q'
        );
        const res = await tx.wait();
        console.log(res.transactionHash);
        contracts.raceEvent.address = res.events[0].address;
        contracts.raceEvent.contract = await hre.ethers.getContractAt(contracts.raceEvent.name, contracts.raceEvent.address);
    } catch (error) {
        console.log(error);
    }
}

async function claimTokens() {
    console.log('\nCLAIM TOKENS');
    const claim20 = await tokens.erc20.contract.mint(
        admin,
        '1000'
    );
    const claimed20 = await claim20.wait();
    console.log(
        claimed20.status
        ? 'Claim ERC20 success: ' + claimed20.transactionHash
        : 'Claim ERC20 fail' + claimed20
    );

    const claim721 = await tokens.erc721.contract.claimNewMint();
    const claimed721 = await claim721.wait();
    const id721 = claimed721.events[0].args.tokenId.toString();
    console.log(claimed721.events[0].args.tokenId.toString());
    console.log(
        claimed721.status
        ? 'Claim ERC721 success: ' + claimed721.transactionHash
        : 'Claim ERC721 fail' + claimed721
    );

    const claim1155 = await tokens.erc1155.contract.mint(
        admin,
        '0',
        '1000',
        "0x6c00000000000000000000000000000000000000000000000000000000000000"
    );
    const claimed1155 = await claim1155.wait();
    console.log(
        claimed1155.status
        ? 'Claim ERC1155 success: ' + claimed1155.transactionHash
        : 'Claim ERC1155 fail' + claimed1155
    );

    return id721;
}

async function approveTokens(address) {
    console.log('\nAPPROVE TOKEN SPEND');
    try {
        const tx20 = await tokens.erc20.contract.approve(address, '1000');
        const res20 = await tx20.wait();
        console.log(res20.transactionHash);

        const tx721 = await tokens.erc721.contract.setApprovalForAll(address, 'true');
        const res721 = await tx721.wait();
        console.log(res721.transactionHash);

        const tx1155 = await tokens.erc1155.contract.setApprovalForAll(address, 'true');
        const res1155 = await tx1155.wait();
        console.log(res1155.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function depositRewards(contract, address) {
    const id721 = await claimTokens();
    await approveTokens(address);

    console.log('\nDEPOSIT REWARDS');
    try {
        const tx = await contract.depositRewards(
            ['1', '1', '2', '3'], // uint256[] positions,
            ['0', '1', '2', '3'], // TokenType[] tokenTypes
            [tokens.erc20.address, tokens.erc721.address, tokens.erc1155.address, admin], // address[] tokens
            ['0', id721, '0', '0'], // uint256[] tokenIDs
            ['1', '1', '1', '1'], // uint256[] amounts
            ['', '', '', '0'], // string[] descriptions
        );
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function createRace() {
    console.log('\nCREATE RACE');
    try {
        // NOTE: comparing ethers UTC UNIX timestamp with chain timestamp can cause issues.
        // This step may need to be done manually.
        const timestamp = Date.now().toString();
        console.log(timestamp);
        const tx = await contracts.raceEvent.contract.createRace(
            Math.random(1000).toString(), // string raceID
            'race', // string title
            'q', // string uri_
            timestamp, // uint256 raceStartTime,
            '0', // uint256 raceAccess
        );
        console.log(Date.now(), timestamp);

        const res = await tx.wait();
        console.log(res.transactionHash);
        contracts.race.address = res.events[0].address;
        contracts.race.contract = await hre.ethers.getContractAt(contracts.race.name, contracts.race.address);
    } catch (error) {
        console.log(error);
    }
}

async function setRaceSettings() {
    console.log('\nSET RACE SETTINGS');
    try {
        const tx = await contracts.race.contract.setRaceSettings(
            ['1', '16'], // uint256[] minMaxPlayers
            tokens.erc20.address, // address feeToken
            '0', // uint256 feeAmount
            '4' // uint256 winningPositions
        );
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function addPlayers() {
    console.log('\nADD PLAYERS');
    try {
        const tx = await contracts.race.contract.addPlayers(
            [admin, admin, admin, admin]
        );
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function startRace() {
    console.log('\nSTART RACE');
    try {
        const tx = await contracts.race.contract.startRace();
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function endRace() {
    console.log('\nEND RACE');
    try {
        const tx = await contracts.race.contract.endRace(
            [admin, admin, admin, admin]
        );
        const res = await tx.wait();
        console.log(res.transactionHash);
    } catch (error) {
        console.log(error);
    }
}

async function claimRewards(contract) {
    console.log('\nEND RACE');
    try {
        const tx1 = await contract.claimRewards('1');
        const res1 = await tx1.wait();
        console.log(res1.transactionHash);

        const tx2 = await contract.claimRewards('2');
        const res2 = await tx2.wait();
        console.log(res2.transactionHash);

        const tx3 = await contract.claimRewards('3');
        const res3 = await tx3.wait();
        console.log(res3.transactionHash);

        const tx4 = await contract.claimRewards('4');
        const res4 = await tx4.wait();
        console.log(res4.transactionHash);
    } catch (error) {
        console.log(error);
    }
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });