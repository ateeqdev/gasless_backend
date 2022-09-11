// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "./ERC1155.sol";
import "./MetaOwnable.sol";

/// @title Standard ERC1155 NFT.
/// @author NitroLeague.
contract ERC1155NFT is ERC1155, MetaOwnable {
    // Mapping from race address to winner tokens that are claimed
    mapping(address => mapping(address => uint[])) private _claimed;

    constructor(address _forwarder) ERC1155("", _forwarder) {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev See {IERC1155-balanceOf}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function hasClaimed(address race, address account)
        public
        view
        returns (uint256[] memory)
    {
        require(
            account != address(0),
            "ERC1155: address zero is not a valid owner"
        );
        return _claimed[race][account];
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(
        address[2] memory race_to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _claimed[race_to[0]][race_to[1]].push(id);
        _mint(race_to[1], id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     */
    function gameTransferFrom(
        address from,
        address[2] calldata race_to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );
        _claimed[race_to[0]][race_to[1]].push(id);
        _safeTransferFrom(from, race_to[1], id, amount, data);
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function gameBatchTransferFrom(
        address from,
        address[2] calldata race_to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );
        for (uint i = 0; i < ids.length; i++) {
            _claimed[race_to[0]][race_to[1]].push(ids[i]);
        }
        _safeBatchTransferFrom(from, race_to[1], ids, amounts, data);
    }
}
