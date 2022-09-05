# Nitro League Contracts

## Architecture

NitroLeague deploys RaceEvent via RaceEventFactory.

RaceEvent deploys Race via RaceFactory.

After Race is deployed, call Race.setRaceSettings(...)

Rewards are added to NitroLeague, RaceEvent, Race via inherited RewardManager.

Tokens are withdrawn from NitroLeague, RaceEvent, Race via inherited TokenWithdrawer. There are limits on withdrawing tokens while rewards are unclaimed.

[Miro](https://miro.com/app/board/uXjVOo1UiF8=/?share_link_id=270614917881)

![Schema Diagram](./Schema.png)

## Notes

Interfaces are used to allow interactions between contracts without requiring callers to carry the called contract's bytecode.

## Addresses

### Mainnet

None.

### Testnet (Avalanche Fuji)

#### NitroLeague
[0xd8cbfeb1f6a8659ead3b060a45f2b00775714812](https://testnet.snowtrace.io/address/0xd8cbfeb1f6a8659ead3b060a45f2b00775714812)

#### RaceEventFactory
[0x6724dcbd93d908cae1be8a04C50868382067CC14](https://testnet.snowtrace.io/address/0x6724dcbd93d908cae1be8a04C50868382067CC14)

#### RaceFactory
[0x534Dd1d8280F9982a62880b51493fD979a1BE180](https://testnet.snowtrace.io/address/0x534Dd1d8280F9982a62880b51493fD979a1BE180)

#### RewardFactory
[0x6835257Ef09a3ee08f4137c8C8AbD7EC577a8eF5](https://testnet.snowtrace.io/address/0x6835257Ef09a3ee08f4137c8C8AbD7EC577a8eF5)

#### RaceEvent
[0xb6Bd1990ee4413DD86e4b93E84bAfeC361d445a3](https://testnet.snowtrace.io/address/0xb6Bd1990ee4413DD86e4b93E84bAfeC361d445a3)

#### Race
[0x3E4E2326ED687C2399E450c824697059263A1Bc5](https://testnet.snowtrace.io/address/0x3E4E2326ED687C2399E450c824697059263A1Bc5)

#### RewardManager
[0x3155b3ac39E10294Ad7b96936B5de069e03cc1E0](https://testnet.snowtrace.io/address/0x3155b3ac39E10294Ad7b96936B5de069e03cc1E0)

#### ERC20Token
[0x04D1F70838221e929956197d49C5A33b385699d0](https://testnet.snowtrace.io/address/0x04D1F70838221e929956197d49C5A33b385699d0)

#### ERC721NFT
[0x39D2F529B83Bb8bE678621cbA89F861debeF2Bf4](https://testnet.snowtrace.io/address/0x39D2F529B83Bb8bE678621cbA89F861debeF2Bf4)

#### ERC1155NFT
[0x47bbec32F274745d71383554E64aC96A33823401](https://testnet.snowtrace.io/address/0x47bbec32F274745d71383554E64aC96A33823401)


## Scripts:

#### Deploy contracts:

```
npx hardhat run scripts/deploy.js --network AVAXFUJI
```

#### Verify the contracts:

```
./scripts/verify.sh
```

#### Test-run the complete race flow:

```
npx hardhat test --show-stack-traces
```


## Hardhat

### Hardhat tutorial:

https://hardhat.org/tutorial/

https://docs.polygon.technology/docs/develop/hardhat/

### Using Hardhat:

Install packages:

```
npm install
```

- Create a new account in MetaMask.
- Get Matic from the Polygon [faucet](https://faucet.polygon.technology/).
- Export the account's private key from MetaMask.
- Add that private key to network.yourNetwork.accounts in hardhat.config.js.

Run local hardhat node using npm:

```
npm exec hardhat node
```

If error:

  `OpenSSL error ERR_OSSL_EVP_UNSUPPORTED:`

or

  `Error HH604: Error running JSON-RPC server: error:0308010C:digital envelope routines::unsupported`

run:

```
export NODE_OPTIONS=--openssl-legacy-provider
```

If error:

  `node: --openssl-legacy-provider is not allowed in NODE_OPTIONS`

run:

```
unset NODE_OPTIONS
```

Run a script (from root dir, same level as hardhat.config.js):

```
npx hardhat run --network <your-network> scripts/<your-script>.js
```

### Flattening contracts

The script for flattening contracts can be found in:

```
<version>/scripts/flatten.sh
```

To flatten contracts, from a UNIX command line, while in the root directory of the desired version, run:

```
sh scripts/flatten.sh
```

Flattened contracts can be found in:

```
<version>/dapp-files/flattened/<section>/<contractname>_flat.sol
```

### Generating ABI's

The script for generating ABI's can be found in:

```
root/scripts/abi.js
```

To generate ABI's, using node, while in the root directory of the desired version, run:

```
node scripts/abi.js
```

ABI's can be found in:

```
root/dapp-files/abi/<section>/<contractname>_ABI.sol
```

### Verify contracts on Polygonscan

To verify contracts on Polygonscan, run:

```
npx hardhat verify --network <network> <address> <constructor args1> <constructor args2> <...>
```

Notes:
- Contracts must be deployed to `<network>`
- `<network>` must be in `hardhat.config.js`
- Contracts need to be validated by enough nodes. May require waiting ~5 minutes.
- `optimizer` config in `hardhat.config.js` must match optimizer config that contracts were deployed with.
- `etherscan.apiKey` in `hardhat.config.js` must be valid.

### Claim tokens

ERC20, ERC721, ERC1155 tokens can be automatically claimed using the `claim-tokens` script.

To do so, run:

```
npx hardhat run --network <network> scripts/claim-tokens.js
```

Ensure that `claimerAddress` and contract addresses are set appropriately.

### Full Test

The NitroLeague->RaceEvent->Race flow can be tested using `tests/full_test.js`.

To do so, run:

```
npx hardhat run --network <network> tests/full_test.js
```

Addresses in script will need to be updated.

Timestamp comparison between Ethers and the blockchain can cause issues. See comment in script.