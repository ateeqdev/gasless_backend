// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

/// @title RaceEvent contract interface.
/// @author Nitro League.
interface IRewardManager {
    /// Token type of reward.
    enum TokenType {
        ERC20,
        ERC721,
        ERC1155,
        OFF_CHAIN
    }

    /// Deposit rewards.
    /// @dev Caller must approve this contract to spend the tokens being deposited.
    /// @param positions as uint256 array.
    /// @param tokenTypes as TokenType array.
    /// @param tokens as address array.
    /// @param tokenIDs of NFTs, where applicable. Use `0` for non-NFT Rewards.
    /// @param amounts of tokens, in decimals.
    /// @param descriptions as string array of token descriptions.
    function depositRewards(
        uint256[] memory positions,
        uint8[] calldata tokenTypes,
        address[] memory tokens,
        uint256[] calldata tokenIDs,
        uint256[] calldata amounts,
        string[] calldata descriptions,
        address from
    ) external;

    /// As winner, claim rewards for the won position.
    function claimRewards(address winner) external;

    /// Get a reward's description.
    /// @param rewardID_ as string ID of reward.
    /// @return string of reward description.
    function getRewardDescription(uint256 rewardID_)
        external
        view
        returns (string memory);

    function getRewardState() external view returns (uint8);

    function setPositionResults(address payable[] memory results) external;

    function getWinningPositions() external view returns (uint);

    function setWinningPositions(uint winningPositions_) external;
}
