// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "./ERC1155.sol";
import "./MetaOwnable.sol";

/// @title Standard ERC1155 NFT.
/// @author NitroLeague.
contract ERC1155NFT is ERC1155, MetaOwnable {
    constructor(address _forwarder) ERC1155("", _forwarder) {
        _transferOwnership(_msgSender());
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
}
