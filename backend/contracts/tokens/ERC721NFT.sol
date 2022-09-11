// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

//IERC721Metadata

/// @title Standard ERC721 NFT.
/// @author NitroLeague.
contract ERC721NFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    string private baseURI;

    Counters.Counter private _tokenIdCounter;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

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

    function safeMint(address to) public onlyOwner {
        _tokenIdCounter.increment();
        _safeMint(to, _tokenIdCounter.current());
    }

    function claimNewMint() external {
        safeMint(_msgSender());
    }

    function publicMint(uint256 quantity) external {
        require(quantity <= 50, "You can int only 50 tokens in one go");
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIdCounter.increment();
            _safeMint(_msgSender(), _tokenIdCounter.current());
        }
    }
}
