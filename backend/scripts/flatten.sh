mkdir -p ./flattened/main
mkdir -p ./flattened/tokens
mkdir -p ./flattened/utils

npx hardhat flatten ./contracts/main/NitroLeague.sol > ./flattened/main/NitroLeague_flat.sol
npx hardhat flatten ./contracts/main/RaceEvent.sol > ./flattened/main/RaceEvent_flat.sol
npx hardhat flatten ./contracts/main/Race.sol > ./flattened/main/Race_flat.sol

npx hardhat flatten ./contracts/tokens/ERC20Token.sol > ./flattened/tokens/ERC20Token_flat.sol
npx hardhat flatten ./contracts/tokens/ERC721NFT.sol > ./flattened/tokens/ERC721NFT_flat.sol
npx hardhat flatten ./contracts/tokens/ERC1155NFT.sol > ./flattened/tokens/ERC1155NFT_flat.sol

npx hardhat flatten ./contracts/utils/RaceEventFactory.sol > ./flattened/utils/RaceEventFactory_flat.sol
npx hardhat flatten ./contracts/utils/RaceFactory.sol > ./flattened/utils/RaceFactory_flat.sol
npx hardhat flatten ./contracts/utils/RewardManager.sol > ./flattened/utils/RewardManager_flat.sol
npx hardhat flatten ./contracts/utils/TokenWithdrawer.sol > ./flattened/utils/TokenWithdrawer_flat.sol
