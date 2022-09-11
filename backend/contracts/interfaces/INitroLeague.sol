// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

import "./IRaceEvent.sol";

/// @title NitroLeague contract interface.
/// @author Nitro League.
interface INitroLeague {
    // Access.
    function getGame() external view returns (address);

    function setGame(address game_) external;

    // Reward Manager
    function getrewardFactory() external view returns (address);

    function setrewardFactory(address rewardFactory_) external;

    // RaceEvents.
    function getRaceEventFactory() external view returns (address);

    function setRaceEventFactory(address raceEventFactory_) external;

    function createRaceEvent(
        string[3] calldata raceEventID_title_uri,
        uint8 raceEventType
    ) external returns (address);

    // Races.
    function getRaceFactory() external view returns (address);

    function setRaceFactory(address raceEventFactory_) external;

    function getTreasuryWallet() external returns (address);

    function setTreasuryWallet(address treasuryWallet_) external;

    function raceIDExists(string calldata raceID) external returns (bool);

    function addRaceID(string calldata raceID) external;
}
