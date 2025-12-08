// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract Rol is AccessControl {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant TASK_MANAGER_ROLE = keccak256("TASK_MANAGER_ROLE");
    bytes32 public constant PROPOSAL_MANAGER_ROLE = keccak256("PROPOSAL_MANAGER_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    //structs
    struct Role {
        uint256 rolID;
        bytes32 role;
        address user;
    }

    //mappings
    mapping(uint256 => Role) public roles;

    //state variables
    uint256 public rolID;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- READ FUNCTIONS ---
    function getRole(uint256 _rolID) external view returns (Role memory) {
        return roles[_rolID];
    }

    function getRoleID() external view returns (uint256) {
        return rolID;
    }

    // --- WRITE FUNCTIONS ---
    function _createUser(address _user) internal virtual {
        require(_user != address(0), "User address cannot be zero");
        require(!hasRole(USER_ROLE, _user), "User already exists");
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the admin");

        _grantRole(USER_ROLE, _user);
    }

    function _createAuditor(address _user) internal virtual {
        require(_user != address(0), "User address cannot be zero");
        require(!hasRole(AUDITOR_ROLE, _user), "User already exists");
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the admin");

        _grantRole(AUDITOR_ROLE, _user);
    }

    function createTaskManager(address _user) external {
        require(_user != address(0), "User address cannot be zero");
        require(!hasRole(TASK_MANAGER_ROLE, _user), "User already exists");
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the admin");

        _grantRole(TASK_MANAGER_ROLE, _user);
    }

    function createProposalManager(address _user) external {
        require(_user != address(0), "User address cannot be zero");
        require(!hasRole(PROPOSAL_MANAGER_ROLE, _user), "User already exists");
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the admin");

        _grantRole(PROPOSAL_MANAGER_ROLE, _user);
    }
}
