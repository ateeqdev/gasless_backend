// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

// Interfaces.
import "../interfaces/INitroLeague.sol";
import "../interfaces/IRaceEvent.sol";
import "../interfaces/IRaceFactory.sol";
import "../interfaces/IRace.sol";
import "../interfaces/IRewardManager.sol";
import "../interfaces/IRewardFactory.sol";

// Utils.
import "../utils/RewardManager.sol";
import "../utils/TokenWithdrawer.sol";
// OpenZeppelin.
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/// @title Nitro League RaceEvent to create and manage Race's.
/// @author Nitro League.
contract RaceEvent is IRaceEvent, Context, Ownable, TokenWithdrawer {
    ////////////
    // ACCESS //
    ////////////
    // See Ownable.

    /// Permit INitroLeague to create the RaceEvent.
    INitroLeague public nitroLeague;
    /// Generates Races.
    IRaceFactory public raceFactory;

    /// Respective Reward Manager contract
    IRewardManager public rewardManager;

    //////////////
    // METADATA //
    //////////////

    /// Unique string ID.
    string public raceEventID;
    /// String title of the event.
    string public title;
    /// Unique location of off-chain metadata.
    string public uri;

    ////////////////
    // RACE EVENT //
    ////////////////

    /// ACTIVE when contract is deployed.
    /// COMPLETE when results are set.
    /// CANCELLED only if rewardState is EMPTY.
    /// @dev Default is index 0: ACTIVE.
    enum RaceEventState {
        ACTIVE,
        COMPLETE,
        CANCELLED
    }
    RaceEventState public raceEventState;

    /// Type of Race Event.
    /// @dev Default is index 0: PRACTICE.
    enum RaceEventType {
        PRACTICE,
        DAILY,
        SPECIAL,
        TOURNAMENT,
        CHAMPIONSHIP
    }
    RaceEventType public raceEventType;

    address rewardFactory;

    /// RaceEvent completed.
    event CompleteRaceEvent();
    /// RaceEvent cancelled.
    event CancelRaceEvent();

    ///////////
    // RACES //
    ///////////
    // Event => Race(s) is 1 => many.

    /// Race ID's and their Race.
    mapping(string => IRace) public races; // raceID => Race.
    /// Emitted on createRace().
    event CreateRace(string indexed raceID, address indexed raceAddress);

    /////////////
    // REWARDS //
    /////////////

    modifier emptyOrClaimed() {
        require(
            rewardManager.getRewardState() == 0 ||
                rewardManager.getRewardState() == 3,
            "Rewards not empty or claimed"
        );
        _;
    }

    ///////////////////////
    // CREATE RACE EVENT //
    ///////////////////////

    /** RaceEvent Constructor.
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
    constructor(
        address[2] memory nitro_rewardFactory,
        string[3] memory raceEventID_title_uri,
        uint8 raceEventType_
    ) {
        nitroLeague = INitroLeague(nitro_rewardFactory[0]);
        rewardFactory = nitro_rewardFactory[1];
        address rewardManager_ = IRewardFactory(nitro_rewardFactory[1])
            .newRewardManager(0, address(this));
        rewardManager = IRewardManager(rewardManager_);

        raceFactory = IRaceFactory(nitroLeague.getRaceFactory());
        transferOwnership(_msgSender());

        raceEventID = raceEventID_title_uri[0];
        title = raceEventID_title_uri[1];
        uri = raceEventID_title_uri[2];

        raceEventState = RaceEventState.ACTIVE;
        raceEventType = RaceEventType(raceEventType_);
    }

    ////////////////
    // RACE EVENT //
    ////////////////

    /// Confirms to INitroLeague that this is a RaceEvent.
    /// @return bool as true.
    function isRaceEvent() external pure override returns (bool) {
        return true;
    }

    function transferOwnership_(address newOwner) external {
        transferOwnership(newOwner);
    }

    /// Deposit rewards.
    /// @dev Caller must approve this contract to spend the tokens being deposited.
    /// @param positions as uint256 array.
    /// @param tokenTypes as TokenType array.
    /// @param tokens as address array.
    /// @param tokenIDs of NFTs, where applicable. Use `0` for non-NFT Rewards.
    /// @param amounts of tokens, in decimals.
    /// @param descriptions as string array of token descriptions.
    function depositRewards(
        uint256[] memory positions,
        uint8[] calldata tokenTypes,
        address[] memory tokens,
        uint256[] calldata tokenIDs,
        uint256[] calldata amounts,
        string[] calldata descriptions
    ) external onlyOwner {
        rewardManager.depositRewards(
            positions,
            tokenTypes,
            tokens,
            tokenIDs,
            amounts,
            descriptions,
            _msgSender()
        );
    }

    /// Assign winners to complete Race Event.
    /// @dev First position in array (index 0)
    ///        maps to winner of race
    ///        which is stored in positionResults[1].
    /// @param results_ as address array of players, where first index is winner.
    function endRaceEvent(address payable[] memory results_) external override {
        // Check caller is authorized to end Race Event.
        require(
            _msgSender() == nitroLeague.getGame() || _msgSender() == owner(),
            "Caller must be owner or game"
        );

        rewardManager.setPositionResults(results_);

        // Update race event state.
        raceEventState = RaceEventState.COMPLETE;

        emit CompleteRaceEvent();
    }

    /// Cancel Race Event.
    function cancelRaceEvent() external override onlyOwner {
        require(
            rewardManager.getRewardState() == 0,
            "Cannot cancel event with unawarded/unclaimed rewards"
        );

        raceEventState = RaceEventState.CANCELLED;
        emit CancelRaceEvent();
    }

    ///////////
    // RACES //
    ///////////

    /** Create a new Race.
     * @param feeToken_ address of token paid to join game.
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
    function createRace(
        address feeToken_,
        string[3] memory raceID_title_uri,
        uint256[6] memory int_settings
    ) external override onlyOwner returns (address) {
        require(
            !nitroLeague.raceIDExists(raceID_title_uri[0]),
            "Race ID exists"
        );
        require(raceEventState == RaceEventState.ACTIVE, "Event is not active");

        IRace race = IRace(
            raceFactory.newRace(
                [address(nitroLeague), feeToken_, rewardFactory],
                raceID_title_uri,
                int_settings
            )
        );

        race.transferOwnership_(_msgSender());

        emit CreateRace(raceID_title_uri[0], address(race));

        races[raceID_title_uri[0]] = race;
        nitroLeague.addRaceID(raceID_title_uri[0]);

        return address(race);
    }

    /////////////
    // REWARDS //
    /////////////
    // See RewardManager.
    // See TokenWithdrawer.

    /// Withdraws ETH from this contract using TokenWithdrawer.
    /// @param amount of ETH in Wei to withdraw.
    function withdrawETH(uint256 amount) external onlyOwner emptyOrClaimed {
        _withdrawETH(amount);
    }

    /// Withdraws ERC20 from this contract using TokenWithdrawer.
    /// @param token as address of ERC20 token.
    /// @param amount of token in Wei to withdraw.
    function withdrawERC20(address token, uint256 amount)
        external
        onlyOwner
        emptyOrClaimed
    {
        _withdrawERC20(token, amount);
    }

    /// Withdraws ERC721 from this contract using TokenWithdrawer.
    /// @param token as address of ERC721 token.
    /// @param tokenID as ID of NFT.
    function withdrawERC721(address token, uint256 tokenID)
        external
        onlyOwner
        emptyOrClaimed
    {
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
    ) external onlyOwner emptyOrClaimed {
        _withdrawERC1155(token, tokenID, amount);
    }
}
