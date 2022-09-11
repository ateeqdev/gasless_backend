// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

/// @title RaceFactory contract interface.
/// @author Nitro League.
interface IRaceFactory {
    function newRace(
        address[3] memory addrs,
        string[3] memory raceID_title_uri,
        uint256[6] memory int_settings
    ) external returns (address);
}
