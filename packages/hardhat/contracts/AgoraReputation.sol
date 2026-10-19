// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./shared/IAgoraDao.sol";

interface IAgoraRewards {
    function mint(address _to, uint8 _level) external;
}

/**
 * Tracks how much each member has contributed to the DAO, as points. Points come automatically from the other
 * modules (completing a task, voting, publishing or attending an event) and translate into a level. Reaching a
 * new level mints a soulbound NFT in the rewards module.
 *
 * Levels are decided by thresholds (points needed for each): `[100, 300, 600, 1000, 1500, 2500]`. A user with
 * fewer than 100 points is level 0. The max level is the length of the thresholds array (6 in this version).
 *
 * Every DAO has its own copy of this contract (a clone created by the factory). Points cannot be spent, moved
 * or transferred; they are a public record of contribution.
 *
 * @title AgoraReputation
 * @author NightmareFox12
 */
contract AgoraReputation {
    IAgoraDao public dao;
    bool private initialized;

    uint256[] public levelThresholds;

    mapping(address => uint256) public points;

    event PointsAwarded(address indexed user, uint256 amount, uint256 totalAfter, address indexed source);
    event LevelReached(address indexed user, uint8 level);

    /// @dev Locks the implementation: only the clones can be initialized.
    constructor() {
        initialized = true;
    }

    function initialize(address _dao) external {
        require(!initialized, "Already initialized");
        require(_dao != address(0), "Invalid DAO");

        initialized = true;
        dao = IAgoraDao(_dao);

        // Thresholds: how many points you need to reach each level. 6 levels in this version.
        levelThresholds = [uint256(100), 300, 600, 1000, 1500, 2500];
    }

    // --- READ FUNCTIONS ---

    /// @notice How many levels there are in this DAO.
    function maxLevel() external view returns (uint8) {
        return uint8(levelThresholds.length);
    }

    /// @notice Current level of `_user`. Returns 0 when the user has not reached level 1.
    function levelOf(address _user) public view returns (uint8) {
        uint256 p = points[_user];
        uint256 count = levelThresholds.length;

        for (uint8 i = 0; i < count; i++) {
            if (p < levelThresholds[i]) return i;
        }
        return uint8(count);
    }

    /// @notice Points needed to reach the next level, from the user's current points. 0 when already at max level.
    function pointsToNextLevel(address _user) external view returns (uint256) {
        uint8 level = levelOf(_user);
        if (level >= levelThresholds.length) return 0;
        return levelThresholds[level] - points[_user];
    }

    /// @notice Threshold of a given level (level 1 = levelThresholds[0], etc.). Reverts for invalid levels.
    function thresholdOf(uint8 _level) external view returns (uint256) {
        require(_level >= 1 && _level <= levelThresholds.length, "Invalid level");
        return levelThresholds[_level - 1];
    }

    // --- WRITE FUNCTIONS ---

    /// @notice Called by the operational modules of the DAO when a member does something that counts.
    function award(address _user, uint256 _amount) external {
        require(_isAuthorizedModule(msg.sender), "Only DAO modules can award points");
        require(_user != address(0), "Invalid user");
        require(_amount > 0, "The amount must be greater than zero");

        uint8 oldLevel = levelOf(_user);
        points[_user] += _amount;

        emit PointsAwarded(_user, _amount, points[_user], msg.sender);

        uint8 newLevel = levelOf(_user);
        if (newLevel > oldLevel) {
            address rewardsAddress = dao.rewards();
            for (uint8 level = oldLevel + 1; level <= newLevel; level++) {
                IAgoraRewards(rewardsAddress).mint(_user, level);
                emit LevelReached(_user, level);
            }
        }
    }

    // --- INTERNAL ---

    /// @dev Any of the operational modules of the DAO can award points. The addresses come live from the DAO.
    function _isAuthorizedModule(address _caller) private view returns (bool) {
        return
            _caller == dao.tasks() ||
            _caller == dao.votes() ||
            _caller == dao.publicEvents() ||
            _caller == dao.treasury();
    }
}
