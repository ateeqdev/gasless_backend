// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

import "../interfaces/IRaceEventFactory.sol";
import "../main/RaceEvent.sol";

/// @title Factory contract to generate RaceEvent's.
/// @author Nitro League.
contract RaceEventFactory is IRaceEventFactory {
    constructor() {}

    /** Create a new RaceEvent.
     * @param nitro_rewardFactory address of the driver NitroLeague contract
     * @param raceEventID_title_uri strings at the following indices
     * 0 as raceEventID string
     * 1 as race title string.
     * 2 as metadata uri string of the race event.
     * @param raceEventType_ type of Race Event
     * Pass 0 for PRACTICE.
     * Pass 1 for DAILY.
     * Pass 2 for SPECIAL.
     * Pass 3 for TOURNAMENT.
     * Pass 4 for CHAMPIONSHIP.
     */
    function newRaceEvent(
        address[2] memory nitro_rewardFactory,
        string[3] memory raceEventID_title_uri,
        uint8 raceEventType_
    ) external override returns (address) {
        RaceEvent raceEvent = new RaceEvent(
            nitro_rewardFactory,
            raceEventID_title_uri,
            raceEventType_
        );
        raceEvent.transferOwnership_(msg.sender);
        return address(raceEvent);
    }
}
