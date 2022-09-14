// SPDX-License-Identifier: Unlicensed
pragma solidity >=0.8.15 <0.9.0;

import "../lib/ERC721.sol";
import "../lib/ERC721Enumerable.sol";
import "../lib/MetaOwnable.sol";
import "../lib/Mintable.sol";
import "../lib/MinimalClaimContext.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

/** @title Standard ERC721 NFT Contract with support of
 * 1. Meta transactions (owner as signer, user as executor).
 * 2. Contextual claim (List of tokens for a wallet against identifier)
 * 3. Minter (has the minting rights, different from owner)
 *
 * @author NitroLeague.
 */
contract Nitro721Rewards is
    ERC721Enumerable,
    MetaOwnable,
    Mintable,
    MinimalClaimContext
{
    using Counters for Counters.Counter;
    string private baseURI;

    Counters.Counter private _tokenIdCounter;

    constructor(
        string memory _name,
        string memory _symbol,
        address _forwarder,
        address minter,
        uint dailyLimit
    ) ERC721(_name, _symbol, _forwarder) Mintable(dailyLimit) {
        setMinter(minter);
        unPauseMint();
        _transferOwnership(_msgSender());
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        require(bytes(_baseURI).length > 0, "baseURI cannot be empty");
        baseURI = _baseURI;
    }

    function getBaseURI() public view returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI query for nonexistent token");
        return
            string(
                abi.encodePacked(
                    baseURI,
                    Strings.toString((tokenId % 5) + 1),
                    ".json"
                )
            );
    }

    function safeMint(address _to) public onlyOwner {
        _tokenIdCounter.increment();
        _safeMint(_to, _tokenIdCounter.current());
    }

    function claimNewMint() external onlyOwner {
        safeMint(_msgSender());
    }

    function safeMintGame(string memory _context, address _to)
        public
        onlyMinter
        mintingAllowed
        inLimit
        validClaim(_context, _to)
    {
        setContext(_context, _to);
        _incrementMintCounter();
        _tokenIdCounter.increment();
        _safeMint(_to, _tokenIdCounter.current());
    }
}
