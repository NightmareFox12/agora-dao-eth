//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgoraDaoFactory.sol";

interface AgoraDaoFactory {
    function addUserCounter(address _user) external;
}

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @title AgoraDao
 * @author NightmareFox12
 */
contract AgoraDao {
    // State Variables
    address internal fabric;
    address public creator;
    uint256 public daoID;
    uint256 public userCounter;

    string[] internal daoCategories;

    //mappings
    mapping(address => bool) public isUser;

    //events
    event UserJoined(address indexed user, uint256 userID);

    constructor(address _fabric, address _creator) {
        fabric = _fabric;
        creator = _creator;
        userCounter++;
    }

    // --- write functions ---
    function joinDao() external {
        require(!isUser[msg.sender], "User already joined");
        require(msg.sender != creator, "The creator can't join");

        isUser[msg.sender] = true;

        AgoraDaoFactory(fabric).addUserCounter(msg.sender);

        emit UserJoined(msg.sender, userCounter);
        userCounter++;
    }

    // --- read functions ---

    receive() external payable {}
}
