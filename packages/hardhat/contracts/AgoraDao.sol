//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @title AgoraDao
 * @author NightmareFox12
 */

//TODO: pensar a futuro si voy a poner roles
contract AgoraDao {
    // State Variables
    address internal fabric;
    address internal creator;
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
        //TODO: verificar si la dao es privada para pedir el codigo

        isUser[msg.sender] = true;
        emit UserJoined(msg.sender, userCounter);
        userCounter++;
    }

    // --- read functions ---

    receive() external payable {}
}
