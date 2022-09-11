// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

import "../interfaces/IRewardFactory.sol";
import "../utils/RewardManager.sol";

/// @title Factory contract to generate RaceEvent's.
/// @author Nitro League.
contract RewardFactory is IRewardFactory {
    constructor() {}

    /// Create a new RewardManager.
    /// @param raceOrEventAddr_ as address of Race or RaceEvent.
    /// @return address RewardManager contract.
    function newRewardManager(uint8 contractType_, address raceOrEventAddr_)
        external
        returns (address)
    {
        RewardManager rewardManager = new RewardManager(
            contractType_,
            raceOrEventAddr_
        );
        rewardManager.transferOwnership(raceOrEventAddr_);
        return address(rewardManager);
    }
}
