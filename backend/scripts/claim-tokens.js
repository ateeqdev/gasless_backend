/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const ethers = require('ethers');
const provider = ethers.getDefaultProvider();
const hre = require('hardhat');


// Set this to your address.
const claimerAddress = '0xdF317eA4F7C345B34bf116f53e50330bD8E6d138';

// Set these to the relevant addresses.
const contracts = {
    erc20token: {
        address: '0x70910B55Afd3f6c00A468b87177f22B6246398D0',
        contract: '',
        name: 'ERC20Token'
    },
    erc721nft: {
        address: '0xE608D83b05A28A5FA33a476054ec7bBDc6532fC2',
        contract: '',
        name: 'ERC721NFT'
    },
    erc1155nft: {
        address: '0xEb66344a9aBB1E2212461C5CCe449D7EE7CdF84b',
        contract: '',
        name: 'ERC1155NFT'
    }
};


async function main() {
    await getContracts();
    await claimTokens();
}


async function getContracts() {
    contracts.erc20token.contract = await hre.ethers.getContractAt(contracts.erc20token.name, contracts.erc20token.address);
    contracts.erc721nft.contract = await hre.ethers.getContractAt(contracts.erc721nft.name, contracts.erc721nft.address);
    contracts.erc1155nft.contract = await hre.ethers.getContractAt(contracts.erc1155nft.name, contracts.erc1155nft.address);
}

async function claimTokens() {
    const claim20 = await contracts.erc20token.contract.mint(
        claimerAddress,
        '1000'
    );
    const claimed20 = await claim20.wait();
    console.log(
        claimed20.status
        ? 'Claim ERC20 success: ' + claimed20.transactionHash
        : 'Claim ERC20 fail' + claimed20
    );

    const claim721 = await contracts.erc721nft.contract.claimNewMint();
    const claimed721 = await claim721.wait();
    console.log(
        claimed721.status
        ? 'Claim ERC721 success: ' + claimed721.transactionHash
        : 'Claim ERC721 fail' + claimed721
    );

    const claim1155 = await contracts.erc1155nft.contract.mint(
        claimerAddress,
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
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });