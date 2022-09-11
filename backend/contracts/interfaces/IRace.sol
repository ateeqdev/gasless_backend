// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

/// @title Race contract interface.
/// @author Nitro League.
interface IRace {
    // Metadata.
    function setURI(string calldata uri_) external;

    //Participants_info
    function setParticipantsURI(string calldata participants_info_uri_)
        external;

    // Game.
    function startRace() external;

    function endRace(address payable[] memory results_) external;

    function transferOwnership_(address newOwner) external;

    function cancelRace() external;

    // Players.
    function addPlayers(address payable[] memory players_) external;

    function joinRace() external;

    // Fees.
    function reclaimFee() external;
}
