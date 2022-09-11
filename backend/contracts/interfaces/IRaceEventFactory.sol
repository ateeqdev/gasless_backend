// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

/// @title RaceEventFactory contract interface.
/// @author Nitro League.
interface IRaceEventFactory {
    function newRaceEvent(
        address[2] memory nitro_rewardFactory,
        string[3] memory raceEventID_title_uri,
        uint8 raceEventType_
    ) external returns (address);
}
