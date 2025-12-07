//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
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
contract AgoraDao is Ownable {
    // State Variables
    address public fabric;
    uint256 public daoID;
    uint256 public userCounter;

    string[] internal daoCategories;

    //mappings
    mapping(address => bool) public isUser;

    //events
    event UserJoined(address indexed user, uint256 userID);

    constructor(address _fabric, address _creator) Ownable(_creator) {
        fabric = _fabric;
        userCounter++;
    }

    // --- write functions ---
    function joinDao() external {
        require(!isUser[msg.sender], "User already joined");
        require(msg.sender != owner(), "The owner can't join");

        isUser[msg.sender] = true;

        IAgoraDaoFactory(fabric).addUserCounter(msg.sender);

        // (bool success, ) = fabric.call(abi.encodeWithSignature("addUserCounter(address)", msg.sender));

        // if (!success) {
        //     revert("Failed to call addUserCounter");
        // }

        emit UserJoined(msg.sender, userCounter);
        userCounter++;
    }

    // --- read functions ---

    receive() external payable {}
}
