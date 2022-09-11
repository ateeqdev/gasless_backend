// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

import "../interfaces/IRaceFactory.sol";
import "../main/Race.sol";

/// @title Factory contract to generate Race's.
/// @author Nitro League.
contract RaceFactory is IRaceFactory {
    constructor() {}

    /** Create a new Race.
     * @param addrs addresses of the following
     * 0 address of the driver NitroLeague contract
     * 1 address of token paid to join game.
     * 2 address of reward manager factory.
     * @param raceID_title_uri strings at the following indices
     * 0 as raceEventID string
     * 1 as race title string.
     * 2 as metadata uri string of the race event.
     * @param int_settings uint256s at the following indices,
     * 0 raceStartTime_ as UNIX timestamp after which the race can begin.
     * 1 raceAccess_ as index in RaceAccess type (0 for admin controlled, one for open to everyone).
     * 2 minimum players.
     * 3 maximum number of players.
     * 4 fee amount.
     * 5 number of winning positions.
     */
    function newRace(
        address[3] memory addrs,
        string[3] memory raceID_title_uri,
        uint256[6] memory int_settings
    ) external override returns (address) {
        Race race = new Race(addrs, raceID_title_uri, int_settings);
        race.transferOwnership_(msg.sender);
        return address(race);
    }
}
