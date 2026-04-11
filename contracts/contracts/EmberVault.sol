// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

/// @notice Native-token staking vault for local/dev + testnet.
/// This is intentionally simple for judge testing: stake/withdraw + tier/streak/apys.
contract EmberVault {
    struct User {
        uint256 balance;
        uint256 streakStart;
        uint256 streakDays;
        uint256 cooldownUntil;
        string pfpCid;
    }

    mapping(address => User) private users;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 yieldPaid, bool streakBroken);
    event Checkpoint(address indexed user, uint256 streakDays, uint8 tier);
    event PFPLinked(address indexed user, string ipfsCid);

    receive() external payable {
        stake();
    }

    function stake() public payable {
        require(msg.value > 0, "amount=0");

        User storage u = users[msg.sender];
        if (u.balance == 0) {
            u.streakStart = block.timestamp;
            u.streakDays = 0;
            u.cooldownUntil = 0;
        }

        u.balance += msg.value;
        console.log("stake", msg.sender, msg.value);
        emit Staked(msg.sender, msg.value);
    }

    function checkpoint() public {
        User storage u = users[msg.sender];
        if (u.balance == 0) return;

        if (block.timestamp < u.cooldownUntil) {
            u.streakStart = block.timestamp;
            u.streakDays = 0;
            emit Checkpoint(msg.sender, u.streakDays, getTier(msg.sender));
            return;
        }

        uint256 daysSince = (block.timestamp - u.streakStart) / 1 days;
        if (daysSince != u.streakDays) {
            u.streakDays = daysSince;
        }

        emit Checkpoint(msg.sender, u.streakDays, getTier(msg.sender));
    }

    /// @notice Withdraw principal anytime. If you withdraw before completing the next day, streak breaks and yield is 0.
    /// For dev simplicity, ANY withdraw breaks current streak and triggers 7-day cooldown before tier progression.
    function withdraw(uint256 amountWei) external {
        User storage u = users[msg.sender];
        require(amountWei > 0, "amount=0");
        require(u.balance >= amountWei, "insufficient");

        u.balance -= amountWei;

        // Flex-withdraw: break streak, 0 yield, add cooldown.
        bool streakBroken = true;
        uint256 yieldPaid = 0;
        u.cooldownUntil = block.timestamp + 7 days;
        u.streakStart = block.timestamp;
        u.streakDays = 0;

        (bool ok, ) = msg.sender.call{value: amountWei + yieldPaid}("");
        require(ok, "transfer failed");

        emit Withdrawn(msg.sender, amountWei, yieldPaid, streakBroken);
    }

    function linkPFP(string calldata cid) external {
        users[msg.sender].pfpCid = cid;
        emit PFPLinked(msg.sender, cid);
    }

    function getPFP(address user) external view returns (string memory) {
        return users[user].pfpCid;
    }

    function getBalance(address user) external view returns (uint256) {
        return users[user].balance;
    }

    function getStreakDays(address user) public view returns (uint256) {
        User storage u = users[user];
        return u.streakDays;
    }

    function getTier(address user) public view returns (uint8) {
        uint256 d = users[user].streakDays;
        if (d >= 180) return 3;
        if (d >= 90) return 2;
        if (d >= 30) return 1;
        return 0;
    }

    function getAPY(address user) external view returns (uint256) {
        uint8 tier = getTier(user);
        if (tier == 3) return 1000; // 10.00% in bps
        if (tier == 2) return 750;  // 7.50%
        if (tier == 1) return 600;  // 6.00%
        return 500;                 // 5.00%
    }
}

