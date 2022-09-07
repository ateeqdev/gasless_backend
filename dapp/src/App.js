import * as React from "react";
import { ethers } from "ethers";
import ERC1155 from "./artifacts/contracts/ERC1155NFT.sol/ERC1155NFT.json";
import MinimalForwarder from "./artifacts/contracts/MinimalForwarder.sol/MinimalForwarder.json";

const ERC1155_ADDRESS = "0x3b1C5769c04071EFd3AAd0106F52360c711D10B1";
const FORWARDER_ADDRESS = "0x158675B7381b53380242f2F6d344A07FA241C5aC";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { balance: 0 };
  }

  async fetchBalance() {
    if (typeof window.ethereum !== "undefined") {
      //ethereum is usable get reference to the contract
      await this.requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const erc1155 = new ethers.Contract(
        ERC1155_ADDRESS,
        ERC1155.abi,
        provider
      );

      //try to get the balance in the contract
      try {
        let data = await erc1155.balanceOf(await signer.getAddress(), 1);
        data = data.toString();
        this.setState({ balance: data });
        console.log("Data: ", data);
      } catch (e) {
        console.log("Err: ", e);
      }
    }
  }

  async claimNewMint(apiEndpoint) {
    if (typeof window.ethereum !== "undefined") {
      //ethereum is usable, get reference to the contract
      await this.requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      //signer needed for transaction that changes state
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log(address);

      const forwarder = new ethers.Contract(
        FORWARDER_ADDRESS,
        MinimalForwarder.abi,
        signer
      );
      fetch("http://localhost:30001/" + apiEndpoint + "?account=" + address, {
        method: "get",
        dataType: "json",
        headers: {
          Accept: "application/json",
        },
      }).then(async (result) => {
        result = await result.json();
        await this.relay(forwarder, result.request, result.signature);
        this.fetchBalance();
      });
      //preform transaction
    }
  }

  async requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    console.log("requesting account");
  }

  async relay(forwarder, request, signature) {
    console.log(request, signature);
    // Validate request on the forwarder contract
    const valid = await forwarder.verify(request, signature);
    if (!valid) throw new Error(`Invalid request`);
    console.log("valid", valid);

    // Send meta-tx through relayer to the forwarder contract
    const gasLimit = (parseInt(request.gas) + 50000).toString();
    return await forwarder.execute(request, signature, { gasLimit });
  }

  render() {
    return (
      <div>
        <h1>Your Balance: {this.state.balance}</h1>
        <button onClick={() => this.fetchBalance()}>Refresh Balance</button>
        <hr />
        <button
          onClick={() => {
            this.claimNewMint("transfer");
          }}
        >
          Claim 100 Nitro Tokens
        </button>
        <hr />
        <button
          onClick={() => {
            this.claimNewMint("mint");
          }}
        >
          Use XP to mint a new car
        </button>
      </div>
    );
  }
}
