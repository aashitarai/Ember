// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Accountability pools (native token). Simplified for local/testing.
contract KizunaPool {
    struct Pool {
        string name;
        uint256 stakeAmount;
        address creator;
        address[] members;
        uint256 startTs;
        uint256 periodDays;
        bool active;
    }

    uint256 public nextPoolId = 1;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(address => uint256)) public lastCheckinDay;

    event PoolCreated(uint256 indexed poolId, string name, uint256 stakeAmount, address indexed creator);
    event Joined(uint256 indexed poolId, address indexed member);
    event CheckedIn(uint256 indexed poolId, address indexed member, uint256 dayIndex);
    event RewardsDistributed(uint256 indexed poolId, bool yieldHitApplied);

    function createPool(string calldata name, uint256 stakeAmount, address[] calldata initialMembers) external returns (uint256) {
        require(stakeAmount > 0, "stake=0");
        uint256 poolId = nextPoolId++;

        Pool storage p = pools[poolId];
        p.name = name;
        p.stakeAmount = stakeAmount;
        p.creator = msg.sender;
        p.startTs = block.timestamp;
        p.periodDays = 30;
        p.active = true;

        _addMember(poolId, msg.sender);
        for (uint256 i = 0; i < initialMembers.length; i++) {
            if (initialMembers[i] != address(0)) _addMember(poolId, initialMembers[i]);
        }

        emit PoolCreated(poolId, name, stakeAmount, msg.sender);
        return poolId;
    }

    function joinPool(uint256 poolId) external payable {
        Pool storage p = pools[poolId];
        require(p.active, "inactive");
        require(!isMember[poolId][msg.sender], "already");
        require(msg.value == p.stakeAmount, "bad_amount");
        _addMember(poolId, msg.sender);
        emit Joined(poolId, msg.sender);
    }

    function checkIn(uint256 poolId) external {
        Pool storage p = pools[poolId];
        require(p.active, "inactive");
        require(isMember[poolId][msg.sender], "not_member");

        uint256 dayIndex = ((block.timestamp - p.startTs) / 1 days) + 1;
        require(lastCheckinDay[poolId][msg.sender] != dayIndex, "already_today");
        lastCheckinDay[poolId][msg.sender] = dayIndex;

        emit CheckedIn(poolId, msg.sender, dayIndex);
    }

    function distributeRewards(uint256 poolId) external {
        Pool storage p = pools[poolId];
        require(p.active, "inactive");
        require(msg.sender == p.creator, "only_creator");

        // Simplified: we only emit whether anyone missed at least one day in the period.
        bool anyMiss = false;
        uint256 endDay = ((block.timestamp - p.startTs) / 1 days) + 1;
        for (uint256 i = 0; i < p.members.length; i++) {
            address m = p.members[i];
            if (lastCheckinDay[poolId][m] + 1 < endDay) {
                anyMiss = true;
                break;
            }
        }

        emit RewardsDistributed(poolId, anyMiss);
    }

    function getMembers(uint256 poolId) external view returns (address[] memory) {
        return pools[poolId].members;
    }

    function _addMember(uint256 poolId, address member) internal {
        if (isMember[poolId][member]) return;
        isMember[poolId][member] = true;
        pools[poolId].members.push(member);
    }
}

