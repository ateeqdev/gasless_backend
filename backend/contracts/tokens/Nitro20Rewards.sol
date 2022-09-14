// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.4;

import "../lib/ERC20.sol";
import "../lib/MetaOwnable.sol";
import "../lib/Mintable.sol";
import "../lib/MinimalClaimContext.sol";

/// @title Standard ERC20 token.
/// @author NitroLeague.
contract Nitro20Rewards is ERC20, MetaOwnable, Mintable, MinimalClaimContext {
    constructor(
        string memory _name,
        string memory _symbol,
        address _forwarder,
        address minter,
        uint dailyLimit
    ) ERC20(_name, _symbol, _forwarder) Mintable(dailyLimit) {
        setMinter(minter);
        unPauseMint();
    }

    function mint(address _to, uint256 amount) external onlyOwner {
        _mint(_to, amount);
    }

    function mintGame(
        string calldata _context,
        address _to,
        uint256 amount
    ) external onlyMinter mintingAllowed inLimit validClaim(_context, _to) {
        setContext(_context, _to);
        _incrementMintCounter();
        _mint(_to, amount);
    }
}
