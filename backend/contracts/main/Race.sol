// SPDX-License-Identifier: Unlicensed

pragma solidity >=0.8.15 <0.9.0;

// Interfaces.
import "../interfaces/INitroLeague.sol";
import "../interfaces/IRace.sol";
import "../interfaces/IRewardManager.sol";
import "../interfaces/IRewardFactory.sol";

// Utils.
import "../utils/TokenWithdrawer.sol";
// OpenZeppelin.
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Nitro League Race.
/// @dev When creating a new Race, call:
/// @dev    constructor(), then setRaceSettings(), then startRace().
/// @author Nitro League.
contract Race is IRace, Context, Ownable, ReentrancyGuard, TokenWithdrawer {
    ////////////
    // ACCESS //
    ////////////
    // See Ownable.

    /// Source of all RaceEvent's and Race's.
    INitroLeague public nitroLeague;
    /// Reward Manager contract
    IRewardManager public rewardManager;
    /// Authorized to end race and set results.
    address public game;

    //////////////
    // METADATA //
    //////////////

    /// Unique string ID.
    string public raceID;
    /// String title of the race.
    string public title;
    /// Unique location of off-chain metadata.
    string public uri;
    /// information about participating players, their selected cars and components etc
    string public participants_info_uri;
    /// UNIX time after which startRace() can be called.
    uint256 public raceStartTime;

    //////////
    // GAME //
    //////////

    /// UNSCHEDULED once contract is deployed.
    /// SCHEDULED once setRaceSettings() is called.
    /// ACTIVE once startRace() is called.
    /// COMPLETE once endRace() is called.
    /// CANCELLED once cancelRace() is called.
    enum RaceState {
        UNSCHEDULED,
        SCHEDULED,
        ACTIVE,
        COMPLETE,
        CANCELLED
    }
    RaceState public raceState;

    /// ADMIN where only the admin can addPlayers().
    /// OPEN where anyone can joinRace().
    enum RaceAccess {
        ADMIN,
        OPEN
    }
    RaceAccess public raceAccess;

    /// List of joined players.
    address[] public players;
    /// List of players who have reclaimed fee from canceled race.
    mapping(address => bool) public reclaimed;
    /// Minimum number of players needed to startRace().
    uint256 public minPlayers;
    /// Maximum number of players able to participate in Race.
    uint256 public maxPlayers;
    /// Emitted on addPlayers() and joinRace().
    event AddPlayer(address indexed player, uint256 indexed numPlayers);

    /// Emitted on Race deployment.
    event ScheduleRace();

    /// Emitted when ERC20.transfer is failed.
    event TransferFailed();
    /// Emitted on startRace().
    event StartRace();
    /// Emitted on endRace().
    event EndRace();
    /// Emitted on cancelRace().
    event CancelRace();

    //////////
    // FEES //
    //////////

    /// Receives feeAmount worth of feeToken during endRace().
    address public treasuryWallet;
    /// Token paid by joining players.
    IERC20 public feeToken;
    /// Amount of feeToken paid by joining players.
    uint256 public feeAmount;

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

    /////////////////
    // CREATE RACE //
    /////////////////

    /** Race Constructor.
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
    constructor(
        address[3] memory addrs,
        string[3] memory raceID_title_uri,
        uint256[6] memory int_settings
    ) {
        nitroLeague = INitroLeague(addrs[0]);
        game = nitroLeague.getGame();
        transferOwnership(_msgSender());

        raceID = raceID_title_uri[0];
        title = raceID_title_uri[1];
        uri = raceID_title_uri[2];
        require(block.timestamp < int_settings[0], "Set future start time");
        raceStartTime = int_settings[0];

        raceAccess = RaceAccess(int_settings[1]);

        minPlayers = int_settings[2];
        maxPlayers = int_settings[3];

        treasuryWallet = nitroLeague.getTreasuryWallet();
        feeToken = IERC20(addrs[1]);
        feeAmount = int_settings[4];

        address rewardManager_ = IRewardFactory(addrs[2]).newRewardManager(
            1,
            address(this)
        );
        rewardManager = IRewardManager(rewardManager_);
        rewardManager.setWinningPositions(int_settings[5]);

        raceState = RaceState.SCHEDULED;

        emit ScheduleRace();
    }

    //////////////
    // METADATA //
    //////////////

    /// Set metadata URI.
    /// @param uri_ as string.
    function setURI(string calldata uri_) external override onlyOwner {
        uri = uri_;
    }

    function transferOwnership_(address newOwner) external {
        transferOwnership(newOwner);
    }

    /// Set participants URI.
    /// @param participants_info_uri_ as string.
    function setParticipantsURI(string calldata participants_info_uri_)
        external
        override
        onlyOwner
    {
        require(_msgSender() == game, "Caller is not game");
        participants_info_uri = participants_info_uri_;
    }

    //////////
    // GAME //
    //////////

    /// Start race.
    function startRace() external override onlyOwner {
        require(block.timestamp > raceStartTime, "Not yet start time");
        require(players.length >= minPlayers, "Not enough players");
        require(raceState == RaceState.SCHEDULED, "Race not scheduled");
        require(
            keccak256(abi.encode(participants_info_uri)) !=
                keccak256(abi.encode("")),
            "participants_info_uri not set"
        );
        require(_msgSender() == game, "Caller is not game");

        raceState = RaceState.ACTIVE;
        emit StartRace();
    }

    /// Submit results to end race, then transfer fees to treasury wallet.
    /// @dev First position in array (index 0)
    ///        maps to winner of race
    ///        which is stored in positionResults[1].
    /// @param results_ as address array of players.
    function endRace(address payable[] memory results_) external override {
        // Check caller is authorized to end Race.
        require(_msgSender() == game, "Caller is not game");

        require(raceState == RaceState.ACTIVE, "Race is not active");

        for (uint i = 0; i < results_.length; i++) {
            require(isExistingPlayer(results_[i]), "Non-player winner");
        }

        rewardManager.setPositionResults(results_);

        // Update race state.
        raceState = RaceState.COMPLETE;
        // Update reward state.
        // If all rewards are off-chain.

        if (raceAccess == RaceAccess.OPEN && feeAmount > 0) {
            uint256 feeBalance = feeAmount * players.length;
            if (feeToken.balanceOf(address(this)) >= feeBalance) {
                bool transfered = feeToken.transfer(treasuryWallet, feeBalance);
                if (!transfered) emit TransferFailed();
            }
        }

        emit EndRace();
    }

    /// Cancel Race.
    function cancelRace() external override onlyOwner {
        require(rewardManager.getRewardState() == 0, "Rewards not empty");

        raceState = RaceState.CANCELLED;
        emit CancelRace();
    }

    /////////////
    // PLAYERS //
    /////////////

    /// Add player(s) to the race.
    /// @param players_ as address array.
    function addPlayers(address payable[] memory players_)
        external
        override
        onlyOwner
    {
        require(raceAccess == RaceAccess.ADMIN, "Not admin access");
        require(
            players.length + players_.length <= maxPlayers,
            "Too many players"
        );
        // require(rewardState == RewardState.UNAWARDED, "Rewards not unawarded");
        uint playersNum = 0;
        for (uint256 i = 0; i < players_.length; i++) {
            if (!isExistingPlayer(players_[i])) {
                players.push(players_[i]);
                continue;
            }
            playersNum++;
            emit AddPlayer(players_[i], playersNum);
        }
    }

    function isExistingPlayer(address player_) internal view returns (bool) {
        for (uint i = 0; i < players.length; i++)
            if (players[i] == player_) return true;
        return false;
    }

    /// Join a race as a player.
    function joinRace() external override {
        require(raceAccess == RaceAccess.OPEN, "Not open access");
        require(players.length < maxPlayers, "Too many players");
        require(!isExistingPlayer(_msgSender()), "Duplicate player");
        // require(rewardState == RewardState.UNAWARDED, "Rewards not unawarded");

        if (feeAmount > 0) {
            require(
                feeToken.allowance(_msgSender(), address(this)) >= feeAmount &&
                    feeToken.balanceOf(_msgSender()) >= feeAmount,
                "Insufficient allowance"
            );

            bool transfered = feeToken.transferFrom(
                _msgSender(),
                address(this),
                feeAmount
            );
            if (!transfered) emit TransferFailed();
        }

        players.push(_msgSender());
        emit AddPlayer(_msgSender(), players.length);
    }

    //////////
    // FEES //
    //////////

    /// Allow a player to reclaim their fee from a cancelled race.
    function reclaimFee() external override nonReentrant {
        require(raceState == RaceState.CANCELLED, "Race not cancelled");
        require(raceAccess == RaceAccess.OPEN, "No fees set");
        require(!reclaimed[_msgSender()], "Already reclaimed");

        uint256 playersLength = players.length;
        for (uint256 i = 0; i < playersLength; i++) {
            if (players[i] == _msgSender()) {
                bool transfered = feeToken.transfer(_msgSender(), feeAmount);
                if (transfered) {
                    reclaimed[_msgSender()] = true;
                } else {
                    emit TransferFailed();
                }
                break;
            }
        }
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

    /// As winner, claim rewards for the won position.
    function claimRewards() external {
        rewardManager.claimRewards(_msgSender());
    }

    /// Get a reward's description.
    /// @param rewardID_ as string ID of reward.
    /// @return string of reward description.
    function getRewardDescription(uint256 rewardID_)
        external
        view
        returns (string memory)
    {
        return rewardManager.getRewardDescription(rewardID_);
    }

    function getRewardState() external view returns (uint8) {
        return rewardManager.getRewardState();
    }
}
