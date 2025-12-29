//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./AgoraDao/Rol.sol";
import "./AgoraDaoFactory.sol";

interface IAgoraDaoFactory {
    function addUserCounter(address _user) external;
}

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @title AgoraDao
 * @author NightmareFox12
 */
contract AgoraDao is Rol {
    // State Variables
    address public fabric;
    uint256 public daoID;
    uint256 public userCounter;
    string[] internal daoCategories;

    //events
    event UserJoined(address indexed user, uint256 userID);

    constructor(address _fabric, address _creator) {
        fabric = _fabric;
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
