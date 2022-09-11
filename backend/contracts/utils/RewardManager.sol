// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

import "../interfaces/IRewardManager.sol";

// Tokens.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// ERC721.
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
// ERC1155.
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
// Utilities.
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// Security.
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Utility contract to manage Rewards for RaceEvent's and Race's.
/// @author Nitro League.
contract RewardManager is
    IRewardManager,
    Context,
    Ownable,
    ReentrancyGuard,
    ERC721Holder,
    ERC1155Holder
{
    using Counters for Counters.Counter;

    /// EMPTY when no rewards are added.
    /// UNAWARDED once rewards are added.
    /// AWARDED once results are submitted.
    /// CLAIMED once all winners have claimed prize.
    enum RewardState {
        EMPTY,
        UNAWARDED,
        AWARDED,
        CLAIMED
    }
    RewardState public rewardState;

    /// Number of winning positions.
    uint256 public winningPositions;

    /// Used for all reward types.
    struct Reward {
        TokenType tokenType;
        address token;
        uint256 tokenID; // Not applicable to ERC-20.
        uint256 amount; // Not applicable to ERC-721.
        bool claimed;
        string description; // Applicable to off-chain rewards.
    }

    enum ContractType {
        RACEEVENT,
        RACE
    }

    ContractType public contractType;
    address public raceOrEventAddr;

    /// Incrementally set Reward ID's.
    Counters.Counter public rewardIDCounter;
    /// Unique ID's for each Reward.
    mapping(uint256 => Reward) public rewards; // rewardID => Reward
    /// Amount of rewards set.
    uint256 public depositedRewardsCount;
    /// Amount of off-chain rewards set.
    uint256 public offChainRewardsCount;
    /// Amount of rewards claimed.
    uint256 public claimedRewardsCount;
    /// The rewards awarded to each winning position. First place is key 1.
    mapping(uint256 => uint256[]) public positionRewards; // position => [rewardID, ...]
    /// Final event results. First place is key 1.
    mapping(address => uint256) public positionResults; // position => player
    /// Emitted on claimReward().
    event ClaimReward(
        address indexed claimant,
        address indexed token,
        uint256 indexed amount
    );

    constructor(uint8 contractType_, address raceOrEventAddr_) {
        contractType = ContractType(contractType_);
        raceOrEventAddr = raceOrEventAddr_;
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
    ) external override onlyOwner {
        for (uint256 i = 0; i < positions.length; i++) {
            // Transfer reward token from owner to contract.
            bool transferred = false;
            if (tokenTypes[i] == uint8(TokenType.ERC20)) {
                IERC20(tokens[i]).transferFrom(from, address(this), amounts[i]);
                transferred = true;
            } else if (tokenTypes[i] == uint8(TokenType.ERC721)) {
                IERC721(tokens[i]).transferFrom(
                    from,
                    address(this),
                    tokenIDs[i]
                );
                transferred = true;
            } else if (tokenTypes[i] == uint8(TokenType.ERC1155)) {
                IERC1155(tokens[i]).safeTransferFrom(
                    from,
                    address(this),
                    tokenIDs[i],
                    amounts[i],
                    ""
                );
                transferred = true;
            } else if (tokenTypes[i] == uint8(TokenType.OFF_CHAIN)) {
                transferred = true;
                offChainRewardsCount++;
            }
            require(transferred, "Failed transfer");
            // Create rewardID.
            uint256 rewardID = rewardIDCounter.current();
            // Assign Reward to rewardID.
            rewards[rewardID] = Reward(
                TokenType(tokenTypes[i]),
                tokens[i],
                tokenIDs[i],
                amounts[i],
                false,
                descriptions[i]
            );
            // Assign rewardID to position.
            positionRewards[positions[i]].push(rewardID);
            // Increment rewardID.
            rewardIDCounter.increment();
        }
        // Set reward state.
        rewardState = RewardState.UNAWARDED;
        // Update reward count.
        depositedRewardsCount += positions.length;
    }

    /// As winner, claim rewards for the won position.
    function claimRewards(address winner)
        external
        override
        onlyOwner
        nonReentrant
    {
        // Check claim validity.
        uint position = positionResults[winner];

        // For each Reward awarded to this position.
        for (uint256 i = 0; i < positionRewards[position].length; i++) {
            // Get rewardID.
            uint256 rewardID = positionRewards[position][i];
            // If Reward is unclaimed.
            if (!rewards[rewardID].claimed) {
                //Checks-Effects-Interactions pattern, first update contract variables, then transfer tokens
                rewards[rewardID].claimed = true;
                claimedRewardsCount += 1;
                // Get token type of Reward to claim.
                TokenType tokenType = rewards[rewardID].tokenType;
                // Transfer rewarded token to winner.
                if (tokenType == TokenType.ERC20) {
                    IERC20(rewards[rewardID].token).transfer(
                        winner,
                        rewards[rewardID].amount
                    );
                } else if (tokenType == TokenType.ERC721) {
                    IERC721(rewards[rewardID].token).transferFrom(
                        address(this),
                        winner,
                        rewards[rewardID].tokenID
                    );
                } else if (tokenType == TokenType.ERC1155) {
                    IERC1155(rewards[rewardID].token).safeTransferFrom(
                        address(this),
                        winner,
                        rewards[rewardID].tokenID,
                        rewards[rewardID].amount,
                        ""
                    );
                }
                // Emit ClaimReward.
                emit ClaimReward(
                    winner,
                    rewards[rewardID].token,
                    rewards[rewardID].amount
                );
            }
        }

        // Check if all rewards are claimed.
        if (depositedRewardsCount - offChainRewardsCount == claimedRewardsCount)
            // Update reward state once all rewards are claimed.
            rewardState = RewardState.CLAIMED;
    }

    /// Get a reward's description.
    /// @param rewardID_ as string ID of reward.
    /// @return string of reward description.
    function getRewardDescription(uint256 rewardID_)
        external
        view
        override
        returns (string memory)
    {
        return rewards[rewardID_].description;
    }

    function getRewardState() external view override returns (uint8) {
        return uint8(rewardState);
    }

    function setPositionResults(address payable[] memory results)
        external
        override
        onlyOwner
    {
        for (uint256 i = 0; i < results.length; i++)
            // Update position results.
            // Result mapping begins at 1.
            positionResults[results[i]] = i + 1;

        rewardState = RewardState.AWARDED;

        if (depositedRewardsCount == offChainRewardsCount)
            rewardState = RewardState.CLAIMED;
    }

    function getWinningPositions() external view override returns (uint) {
        return winningPositions;
    }

    function setWinningPositions(uint winningPositions_)
        external
        override
        onlyOwner
    {
        winningPositions = winningPositions_;
    }
}
