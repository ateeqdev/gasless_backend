// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

// Interfaces.
import "../interfaces/INitroLeague.sol";
import "../interfaces/IRaceEventFactory.sol";
import "../interfaces/IRaceEvent.sol";
import "../interfaces/IRaceFactory.sol";

// Utils.
import "../utils/TokenWithdrawer.sol";

// OpenZeppelin.
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Nitro League contract to create and manage RaceEvents.
/// @dev NitroLeague generates RaceEvent's (1 to many).
/// @dev    Each RaceEvent generates Race's (1 to many).
/// @dev    When RaceEvent is updated, a new NitroLeague should be deployed.
/// @dev    The current NitroLeague's state can be migrated using sendNitroLeague().
/// @author Nitro League.
contract NitroLeague is INitroLeague, Context, Ownable, TokenWithdrawer {
    ////////////
    // ACCESS //
    ////////////
    // See Ownable.

    /// Generates RaceEvent's.
    IRaceEventFactory public raceEventFactory;
    /// Generates Race's.
    IRaceFactory public raceFactory;

    // To generate reward managers
    address public rewardFactory;

    /// Authorized to end race and set results.
    address private _game;

    /////////////////
    // RACE EVENTS //
    /////////////////

    /// Unique ID's of all RaceEvents.
    string[] public raceEventIDsList;
    /// RaceEvent ID is true if it exists.
    mapping(string => bool) public raceEventIDs;
    /// RaceEvent ID and its RaceEvent.
    mapping(string => IRaceEvent) public raceEvents;
    /// Emitted by createRaceEvent().
    event CreateRaceEvent(
        string indexed raceEventID,
        address indexed raceEvent
    );

    ///////////
    // RACES //
    ///////////

    /// Unique ID's of all Races.
    string[] public raceIDsList;
    /// Race ID is true if it exists.
    mapping(string => bool) public raceIDs;
    /// Receiver of Race fees.
    address private _treasuryWallet;

    /////////////////
    // CONSTRUCTOR //
    /////////////////

    /** Create a new NitroLeague.
     * @param config_addrs addresses at the following
     * 0 as address of the game engine account.
     * 1 as address of the _treasuryWallet account.
     * 2 raceEventFactory_ as address of RaceEventFactory.
     * 3 raceFactory_ as address of RaceFactory.
     * 4 rewardFactory_ as address of rewardFactory.
     */
    constructor(address[5] memory config_addrs) {
        _game = config_addrs[0];
        _treasuryWallet = config_addrs[1];
        raceEventFactory = IRaceEventFactory(config_addrs[2]);
        raceFactory = IRaceFactory(config_addrs[3]);
        rewardFactory = config_addrs[4];
    }

    ////////////
    // ACCESS //
    ////////////

    /// Get address of the game engine account.
    /// @return address of game.
    function getGame() external view override returns (address) {
        return _game;
    }

    /// Set address of the game engine account.
    /// @param game_ as address.
    function setGame(address game_) external override onlyOwner {
        _game = game_;
    }

    /////////////////////
    // Reward Manager //
    /////////////////////

    /// Get address of the game engine account.
    /// @return address of game.
    function getrewardFactory() external view override returns (address) {
        return rewardFactory;
    }

    /// Set address of the game engine account.
    /// @param rewardFactory_ as address.
    function setrewardFactory(address rewardFactory_)
        external
        override
        onlyOwner
    {
        rewardFactory = rewardFactory_;
    }

    /////////////////
    // RACE EVENTS //
    /////////////////

    /// Get address of the RaceEventFactory.
    /// @return address of RaceEventFactory.
    function getRaceEventFactory() external view override returns (address) {
        return address(raceEventFactory);
    }

    /// Set address of the RaceEventFactory.
    /// @param raceEventFactory_ as address of RaceEventFactory.
    function setRaceEventFactory(address raceEventFactory_)
        external
        override
        onlyOwner
    {
        raceEventFactory = IRaceEventFactory(raceEventFactory_);
    }

    /** Create a new RaceEvent.
     * @param raceEventID_title_uri strings at the following indices
     * 0 as raceEventID string
     * 1 as race title string.
     * 2 as metadata uri string of the race event.
     * @param raceEventType type of Race Event
     * Pass 0 for PRACTICE.
     * Pass 1 for DAILY.
     * Pass 2 for SPECIAL.
     * Pass 3 for TOURNAMENT.
     * Pass 4 for CHAMPIONSHIP.
     */
    function createRaceEvent(
        string[3] calldata raceEventID_title_uri,
        uint8 raceEventType
    ) external override returns (address) {
        require(
            !raceEventIDs[raceEventID_title_uri[0]],
            "RaceEvent ID already exists"
        );

        IRaceEvent raceEvent = IRaceEvent(
            raceEventFactory.newRaceEvent(
                [address(this), rewardFactory],
                raceEventID_title_uri,
                raceEventType
            )
        );

        raceEvent.transferOwnership_(_msgSender());

        raceEventIDsList.push(raceEventID_title_uri[0]);
        raceEventIDs[raceEventID_title_uri[0]] = true;
        raceEvents[raceEventID_title_uri[0]] = raceEvent;
        emit CreateRaceEvent(raceEventID_title_uri[0], address(raceEvent));

        return address(raceEvent);
    }

    ///////////
    // RACES //
    ///////////

    /// Get address of the RaceFactory.
    /// @return address of RaceFactory.
    function getRaceFactory() external view override returns (address) {
        return address(raceFactory);
    }

    /// Set address of the RaceFactory.
    /// @param raceFactory_ as address of RaceFactory.
    function setRaceFactory(address raceFactory_) external override onlyOwner {
        raceFactory = IRaceFactory(raceFactory_);
    }

    /// Get address of the treasury wallet fee receiver.
    /// @return address of account.
    function getTreasuryWallet() external view override returns (address) {
        return _treasuryWallet;
    }

    /// Set treasury wallet receiver of fee.
    /// @param treasuryWallet_ as address.
    function setTreasuryWallet(address treasuryWallet_)
        external
        override
        onlyOwner
    {
        _treasuryWallet = treasuryWallet_;
    }

    /// Check if a given Race ID exists.
    /// @param raceID as string.
    /// @return bool as true if raceID exists.
    function raceIDExists(string calldata raceID)
        external
        view
        override
        returns (bool)
    {
        return raceIDs[raceID];
    }

    /// Track all Race ID's to prevent collisions.
    /// @param raceID as string of the unique Race ID.
    function addRaceID(string calldata raceID) external override {
        require(
            IRaceEvent(_msgSender()).isRaceEvent(),
            "Caller is not RaceEvent"
        );

        raceIDsList.push(raceID);
        raceIDs[raceID] = true;
    }

    ////////////
    // TOKENS //
    ////////////

    /// Withdraws ETH from this contract using TokenWithdrawer.
    /// @param amount of ETH in Wei to withdraw.
    function withdrawETH(uint256 amount) external onlyOwner {
        _withdrawETH(amount);
    }

    /// Withdraws ERC20 from this contract using TokenWithdrawer.
    /// @param token as address of ERC20 token.
    /// @param amount of token in Wei to withdraw.
    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        _withdrawERC20(token, amount);
    }

    /// Withdraws ERC721 from this contract using TokenWithdrawer.
    /// @param token as address of ERC721 token.
    /// @param tokenID as ID of NFT.
    function withdrawERC721(address token, uint256 tokenID) external onlyOwner {
        _withdrawERC721(token, tokenID);
    }

    /// Withdraws ERC1155 from this contract using TokenWithdrawer.
    /// @param token as address of ERC1155 token.
    /// @param tokenID as ID of NFT.
    /// @param amount of NFT to withdraw.
    function withdrawERC1155(
        address token,
        uint256 tokenID,
        uint256 amount
    ) external onlyOwner {
        _withdrawERC1155(token, tokenID, amount);
    }
}
