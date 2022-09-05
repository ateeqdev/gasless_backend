/* eslint-disable spaced-comment */
/* eslint-disable no-console */
const ethers = require('ethers');
const provider = ethers.getDefaultProvider();
const hre = require('hardhat');
const { string } = require('hardhat/internal/core/params/argumentTypes');

const contracts = {
    erc20token: {
        address: '',
        contract: '',
        name: 'ERC20Token'
    },
    erc721nft: {
        address: '',
        contract: '',
        name: 'ERC721NFT'
    },
    erc1155nft: {
        address: '',
        contract: '',
        name: 'ERC1155NFT'
    }
};


async function main() {
    await deploy20();
    await deploy721();
    await deploy1155();

    console.log(contracts);
    
    console.log('erc20token: ' + contracts.erc20token.address);
    console.log('erc721nft: ' + contracts.erc721nft.address);
    console.log('erc1155nft: ' + contracts.erc1155nft.address);
}

async function deploy20() {
    // const token_name = "Test NITRO";
    // const token_symbol = "tNITRO";

    // const token_name = "NITRO FUEL";
    // const token_symbol = "nlFUEL";

    const token_name = "NITRO CREDIT";
    const token_symbol = "nlCREDIT";

    const erc20token = await hre.ethers.getContractFactory(contracts.erc20token.name);
    contracts.erc20token.contract = await erc20token.deploy(token_name, token_symbol);
    contracts.erc20token.address = contracts.erc20token.contract.address;
}

async function deploy721() {
    // const token_name = "NITRO LEAGUE Edition 01";
    // const token_symbol = "NLNFT01";

    // const token_name = "NITRO LEAGUE Edition 02";
    // const token_symbol = "NLNFT02";

    const token_name = "NITRO LEAGUE Edition 03";
    const token_symbol = "NLNFT03";

    const erc721nft = await hre.ethers.getContractFactory(contracts.erc721nft.name);
    contracts.erc721nft.contract = await erc721nft.deploy(token_name, token_symbol);
    contracts.erc721nft.address = contracts.erc721nft.contract.address;
}

async function deploy1155() {
    const erc1155nft = await hre.ethers.getContractFactory(contracts.erc1155nft.name);
    contracts.erc1155nft.contract = await erc1155nft.deploy();
    contracts.erc1155nft.address = contracts.erc1155nft.contract.address;
}

/*
npx hardhat verify  0xDB09E12b0AD380514F7b04e7deb1FF15210948B4 "Test NITRO" "tNITRO" --network BSCTESTNET
npx hardhat verify  0xAEd82CF1935a4925968CdB4066d802D45321E856 "NITRO LEAGUE Edition 01" "NLNFT01" --network BSCTESTNET

npx hardhat verify  0xE151b82f127D87C2Ac4cEF7f85667DAbe8e0FAE1 "NITRO FUEL" "nlFUEL" --network BSCTESTNET
npx hardhat verify  0xaAeFCFba77C4AE8133d9FEEEA1AC961aff22941e "NITRO LEAGUE Edition 02" "NLNFT02" --network BSCTESTNET

npx hardhat verify  0xc45aA7282f87F9403f4C87Ae27a0c39DE61A177c "NITRO CREDIT" "nlCREDIT" --network BSCTESTNET
npx hardhat verify  0xb67e594bD8Ef1d958E8b3d6002A6906edAC8DE78 "NITRO LEAGUE Edition 03" "NLNFT03" --network BSCTESTNET

ERC20
"Test NITRO", "tNITRO"
https://testnet.bscscan.com/address/0xDB09E12b0AD380514F7b04e7deb1FF15210948B4

"NITRO FUEL", "nlFUEL"
https://testnet.bscscan.com/address/0xE151b82f127D87C2Ac4cEF7f85667DAbe8e0FAE1

"NITRO CREDIT", "nlCREDIT"
https://testnet.bscscan.com/address/0xc45aA7282f87F9403f4C87Ae27a0c39DE61A177c


BSC Testnet
------------------------------
ERC721
"NITRO LEAGUE Edition 01" "NLNFT01"
https://testnet.bscscan.com/address/0xAEd82CF1935a4925968CdB4066d802D45321E856

"NITRO LEAGUE Edition 02" "NLNFT02"
https://testnet.bscscan.com/address/0xaAeFCFba77C4AE8133d9FEEEA1AC961aff22941e

"NITRO LEAGUE Edition 03" "NLNFT03"
https://testnet.bscscan.com/address/0xb67e594bD8Ef1d958E8b3d6002A6906edAC8DE78


MUMBAI
------------------------------
ERC721
"NITRO LEAGUE Edition 01" "NLNFT01"
https://mumbai.polygonscan.com/address/0x70aC92D80033459F138a3252B01c5733D2Ef9d41

"NITRO LEAGUE Edition 02" "NLNFT02"
https://mumbai.polygonscan.com/address/0xdcBfAA8Fa2410918a35bF5037fb9084f5A715036

"NITRO LEAGUE Edition 03" "NLNFT03"
https://mumbai.polygonscan.com/address/0x6B3132a20e702370D18A20e31C40DB88a3f2c8f0

GOERLI
------------------------------
ERC721
"NITRO LEAGUE Edition 01" "NLNFT01"
https://goerli.etherscan.io/address/0x819DFCb811898437F89886C3c6ad92d3527e32D5

"NITRO LEAGUE Edition 02" "NLNFT02"
https://goerli.etherscan.io/address/0x325C9dCee3dAc75dc65E25A79E28bF1F87b67f64

"NITRO LEAGUE Edition 03" "NLNFT03"
https://goerli.etherscan.io/address/0x9bac82490cFEE1814AF3A5621545D5b36013a4d5



ERC1155 
https://testnet.bscscan.com/address/0x5A9B29f0651eC4fF1B3CE72d397C0D60DBA6e539
https://testnet.bscscan.com/address/0xdf257eE461aA000817590D679d98960CebE60594
https://testnet.bscscan.com/address/0xbCdEa5F17EdEf327F86e546DA2e072327B387a06

*/



main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });