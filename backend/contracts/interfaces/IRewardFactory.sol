// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

/// @title RaceEventFactory contract interface.
/// @author Nitro League.
interface IRewardFactory {
    /// Create a new RewardManager.
    /// @param raceOrEventAddr_ as address of Race or RaceEvent.
    /// @return address RewardManager contract.
    function newRewardManager(uint8 contractType_, address raceOrEventAddr_)
        external
        returns (address);
}
