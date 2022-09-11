// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

/// @title RaceEvent contract interface.
/// @author Nitro League.
interface IRaceEvent {
    // RaceEvent.
    function isRaceEvent() external returns (bool);

    function endRaceEvent(address payable[] memory results_) external;

    function cancelRaceEvent() external;

    function transferOwnership_(address newOwner) external;

    function depositRewards(
        uint256[] memory positions,
        uint8[] calldata tokenTypes,
        address[] memory tokens,
        uint256[] calldata tokenIDs,
        uint256[] calldata amounts,
        string[] calldata descriptions
    ) external;

    // Races.
    function createRace(
        address feeToken_,
        string[3] memory raceID_title_uri,
        uint256[6] memory int_settings
    ) external returns (address);
}
