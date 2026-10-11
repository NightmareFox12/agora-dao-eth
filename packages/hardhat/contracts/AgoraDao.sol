//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./AgoraDao/Rol.sol";

interface IAgoraDaoFactory {
    function addUserCounter(address _user) external;
}

/**
 * One DAO: its members, roles and the addresses of its modules.
 * The factory deploys it as a minimal proxy (clone) of a single implementation, so it is set up with
 * `initialize` instead of a constructor.
 * @title AgoraDao
 * @author NightmareFox12
 */
contract AgoraDao is Rol {
    // State Variables
    address public fabric;
    uint256 public daoID;
    uint256 public userCounter;
    string[] internal daoCategories;
    bool private initialized;

    // Modules (each one is its own contract, created together with the DAO)
    address public tasks;

    //events
    event UserJoined(address indexed user, uint256 userID);

    /// @dev Locks the implementation: only the clones can be initialized.
    constructor() {
        initialized = true;
    }

    function initialize(address _fabric, address _creator, address _tasks) external {
        require(!initialized, "Already initialized");
        initialized = true;

        fabric = _fabric;
        tasks = _tasks;
        _grantRole(DEFAULT_ADMIN_ROLE, _creator);

        userCounter++;
    }

    // --- WRITE FUNCTIONS ---
    function joinDao() external {
        require(!hasRole(USER_ROLE, msg.sender), "User already joined");
        require(!hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "The owner can't join");

        IAgoraDaoFactory(fabric).addUserCounter(msg.sender);
        emit UserJoined(msg.sender, userCounter);

        _joinDaoUser(msg.sender);
        userCounter++;
    }

    // --- READ FUNCTIUONS ---

    receive() external payable {}
}
