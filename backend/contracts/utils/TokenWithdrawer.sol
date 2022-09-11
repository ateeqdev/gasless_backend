// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title Utility contract to allow Owner to withdraw value from contracts.
/// @author Nitro League.
contract TokenWithdrawer is Ownable {
    constructor() {}

    /// Withdraw ETH to owner.
    /// Used for recovering value sent to contract.
    /// @param amount of ETH, in Wei, to withdraw.
    function _withdrawETH(uint256 amount) internal {
        (bool success, ) = payable(_msgSender()).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /// Withdraw ERC-20 token to owner.
    /// @param token as address.
    /// @param amount of tokens including decimals.
    function _withdrawERC20(address token, uint256 amount) internal {
        IERC20(token).transfer(_msgSender(), amount);
    }

    /// Withdraw ERC-721 token to owner.
    /// @param token as address.
    /// @param tokenID of NFT.
    function _withdrawERC721(address token, uint256 tokenID) internal {
        IERC721(token).transferFrom(address(this), owner(), tokenID);
    }

    /// Withdraw ERC1155 token to owner.
    /// @param token as address.
    /// @param tokenID of NFT.
    /// @param amount of NFT.
    function _withdrawERC1155(
        address token,
        uint256 tokenID,
        uint256 amount
    ) internal {
        IERC1155(token).safeTransferFrom(
            address(this),
            owner(),
            tokenID,
            amount,
            ""
        );
    }
}
