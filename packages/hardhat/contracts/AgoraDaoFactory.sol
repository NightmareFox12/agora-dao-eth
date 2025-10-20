//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./AgoraDao.sol";
import "./AgoraDaoFactory/Validation.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @title AgoraDaoFabric
 * @author NightmareFox12
 */
contract AgoraDaoFactory is Ownable, Validation {
    //structs
    struct Dao {
        uint256 daoID;
        address creator;
        address daoAddress;
        string name;
        string description;
        string category;
        string imageURI;
        // bool isPublic;
        uint256 creationTimestamp;
    }

    // State Variables
    uint256 public userCounter;
    string[] internal daoCategories;
    Dao[] public allDaos;

    //mappings
    mapping(address => Dao[]) public daosByUser;
    mapping(address => bool) internal users;
    mapping(address => bool) internal isAgoraDao;

    //events
    event DaoCreated(uint256 indexed daoID, address indexed creator, string indexed name);

    constructor(address initialOwner) Ownable(initialOwner) {
        daoCategories.push("SERVICE");
        daoCategories.push("GOVERNANCE");
        daoCategories.push("SOCIAL IMPACT");
        daoCategories.push("ENERGY");
    }

    //TODO: hacer un mapping de daos para verificar desde el padre y asi saber que llama solo un hijo canonico

    // --- write functions ---
    function createDao(
        string memory _name,
        string memory _description,
        uint256 _categoryID,
        string memory _imageURI // bool _isPublic
    ) external {
        //Validation
        _createDao(_name, _description, _categoryID, daoCategories);

        //create dao
        AgoraDao createdDaoContract = new AgoraDao(address(this), msg.sender);

        Dao memory newDao = Dao(
            allDaos.length,
            msg.sender,
            address(createdDaoContract),
            _name,
            _description,
            daoCategories[_categoryID],
            _imageURI,
            // _isPublic,
            block.timestamp
        );

        //store dao
        daosByUser[msg.sender].push(newDao);
        allDaos.push(newDao);
        isAgoraDao[address(createdDaoContract)] = true;

        //emit event
        emit DaoCreated(allDaos.length, msg.sender, _name);

        addUserCounter(msg.sender);
    }

    function addDaoCategory(string memory newCategory) external onlyOwner {
        require(bytes(newCategory).length > 0, "Category name must not be empty.");

        // Check for duplicates
        for (uint i = 0; i < daoCategories.length; i++) {
            if (keccak256(bytes(daoCategories[i])) == keccak256(bytes(newCategory))) {
                revert("Category already exists. Duplicate entries are not allowed.");
            }
        }

        daoCategories.push(newCategory);
    }

    function addUserCounter(address _newUser) public {
        if (!users[_newUser]) {
            users[_newUser] = true;
            userCounter++;
        }
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // --- read functions ---
    function getAllDaoCategories() external view returns (string[] memory) {
        return daoCategories;
    }

    function getAllDaos() external view returns (Dao[] memory) {
        Dao[] memory _allDaos = new Dao[](allDaos.length);
        for (uint256 i = 0; i < allDaos.length; i++) {
            _allDaos[i] = allDaos[i];
        }
        return _allDaos;
    }

    // function getPublicDaos() external view returns (Dao[] memory) {
    //     uint256 count;
    //     for (uint256 i = 0; i < allDaos.length; i++) {
    //         if (allDaos[i].isPublic) {
    //             count++;
    //         }
    //     }

    //     Dao[] memory publicDaos = new Dao[](count);
    //     uint256 index;

    //     for (uint256 i = 0; i < allDaos.length; i++) {
    //         if (allDaos[i].isPublic) {
    //             publicDaos[index] = allDaos[i];
    //             index++;
    //         }
    //     }

    //     return publicDaos;
    // }

    function getTotalDaoCount() external view returns (uint256) {
        return allDaos.length;
    }

    receive() external payable {}
}
