//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./AgoraDao.sol";
import "./AgoraTasks.sol";
import "./AgoraDaoFactory/Validation.sol";

/**
 * Creates the DAOs. Every DAO is a minimal proxy (clone) of one AgoraDao implementation, and so is each of
 * its modules, which are created together with it. The code of the DAO and the modules is not part of this
 * contract, so it stays small however many modules there are.
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
        uint256[] categoryIDs;
        string imageURI;
        // bool isPublic;
        uint256 creationTimestamp;
    }

    // Implementations that every DAO (and its modules) clones
    address public immutable daoImplementation;
    address public immutable tasksImplementation;

    // State Variables
    uint256 public userCounter;
    uint256 public daoCounter;
    string[] internal daoCategories;
    Dao[] public allDaos;

    //mappings
    mapping(address => Dao[]) public daosByUser;
    mapping(address => bool) internal isUser;
    mapping(address => bool) internal isDao;
    mapping(bytes32 => bool) internal usedNames;

    //events
    event DaoCreated(uint256 indexed daoID, address indexed creator, string indexed name);

    constructor(address initialOwner, address _daoImplementation, address _tasksImplementation) Ownable(initialOwner) {
        require(_daoImplementation != address(0) && _tasksImplementation != address(0), "Invalid implementation");
        daoImplementation = _daoImplementation;
        tasksImplementation = _tasksImplementation;

        daoCategories.push("SERVICE");
        daoCategories.push("GOVERNANCE");
        daoCategories.push("SOCIAL IMPACT");
        daoCategories.push("ENERGY");
    }

    // --- write functions ---
    function createDao(
        string memory _name,
        string memory _description,
        uint256[] memory _categoryIDs,
        string memory _imageURI // bool _isPublic
    ) external {
        //Validation
        _createDao(_name, _description, _categoryIDs, daoCategories);

        bytes32 nameKey = _nameKey(_name);
        require(!usedNames[nameKey], "A DAO with this name already exists");
        usedNames[nameKey] = true;

        //create the dao and its modules, all at once
        address daoAddress = Clones.clone(daoImplementation);
        address tasksAddress = Clones.clone(tasksImplementation);

        AgoraDao(payable(daoAddress)).initialize(address(this), msg.sender, tasksAddress);
        AgoraTasks(tasksAddress).initialize(daoAddress);

        Dao memory newDao = Dao(
            daoCounter,
            msg.sender,
            daoAddress,
            _name,
            _description,
            _categoryIDs,
            _imageURI,
            // _isPublic,
            block.timestamp
        );

        //store dao
        daosByUser[msg.sender].push(newDao);
        allDaos.push(newDao);
        isDao[daoAddress] = true;
        daoCounter++;

        //add user counter
        _addUser(msg.sender);

        //emit event
        emit DaoCreated(daoCounter, msg.sender, _name);
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

    /// @dev Called by the DAOs created by this factory when somebody joins them.
    function addUserCounter(address _newUser) external {
        require(isDao[msg.sender], "Only DAOs created by this factory");
        _addUser(_newUser);
    }

    function _addUser(address _newUser) internal {
        if (!isUser[_newUser] && _newUser != address(0) && _newUser != address(this)) {
            isUser[_newUser] = true;
            userCounter++;
        }
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // --- read functions ---
    function isDaoNameAvailable(string memory _name) external view returns (bool) {
        return !usedNames[_nameKey(_name)];
    }

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
