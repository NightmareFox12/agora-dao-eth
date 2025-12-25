// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract Rol is AccessControl {
    bytes32 internal constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 internal constant TASK_MANAGER_ROLE = keccak256("TASK_MANAGER_ROLE");
    bytes32 internal constant PROPOSAL_MANAGER_ROLE = keccak256("PROPOSAL_MANAGER_ROLE");
    bytes32 internal constant USER_ROLE = keccak256("USER_ROLE");

    //mappings
    mapping(bytes32 => address[]) private roleUsers;
    mapping(bytes32 => mapping(address => bool)) private isMemberOfRole;
    mapping(bytes32 => mapping(address => uint256)) private memberPosition;

    //state variables

    //events
    event RoleRegistered(bytes32 indexed role, address indexed user);
    event RoleDeleted(bytes32 indexed role, address indexed user);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- READ FUNCTIONS ---
    function getMemberByRole(bytes32 _role) external view returns (address[] memory) {
        return roleUsers[_role];
    }

    function isRole(bytes32 _role, address _user) external view returns (bool) {
        return hasRole(_role, _user);
    }

    function getAllByRole(bytes32 _role) external view returns (address[] memory) {
        return roleUsers[_role];
    }

    // --- WRITE FUNCTIONS ---
    function registerRole(bytes32 _role, address _user) external {
        require(_user != address(0), "User address cannot be zero");
        require(_user != msg.sender, "Caller cannot assign role to self");

        // --- Verify Permissions ---
        if (_role == AUDITOR_ROLE) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can assign AUDITOR_ROLE");
            require(_role != DEFAULT_ADMIN_ROLE, "Cannot assign DEFAULT_ADMIN_ROLE");
        } else {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(AUDITOR_ROLE, msg.sender),
                "Caller must be Admin or Auditor to assign this role"
            );
        }

        if (hasRole(DEFAULT_ADMIN_ROLE, _user)) {
            require(_role == DEFAULT_ADMIN_ROLE, "Admin cannot assign other roles to self");
        }

        require(!isMemberOfRole[_role][_user], "User is already registered in this role's list");
        require(!hasRole(_role, _user), "User already exists");

        // --- Assign Role ---
        _grantRole(_role, _user);
        isMemberOfRole[_role][_user] = true;

        roleUsers[_role].push(_user);
        uint256 newPosition = roleUsers[_role].length - 1;
        memberPosition[_role][_user] = newPosition;

        emit RoleRegistered(_role, _user);
    }

    // --- WRITE FUNCTIONS ---
    function registerRoleBatch(bytes32 _role, address[] calldata _users) external {
        if (_role == AUDITOR_ROLE) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can assign AUDITOR_ROLE");
            require(_role != DEFAULT_ADMIN_ROLE, "Cannot assign DEFAULT_ADMIN_ROLE");
        } else {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(AUDITOR_ROLE, msg.sender),
                "Caller must be Admin or Auditor to assign this role"
            );
        }

        for (uint256 i = 0; i < _users.length; i++) {
            address currentUser = _users[i];

            require(currentUser != address(0), "User address cannot be zero");
            require(currentUser != msg.sender, "Caller cannot assign role to self");

            require(!isMemberOfRole[_role][currentUser], "User is already registered in this role's list");
            require(!hasRole(_role, currentUser), "User already exists");

            if (hasRole(DEFAULT_ADMIN_ROLE, currentUser)) {
                require(_role == DEFAULT_ADMIN_ROLE, "Admin cannot assign other roles to self");
            }

            _grantRole(_role, currentUser);
            isMemberOfRole[_role][currentUser] = true;

            roleUsers[_role].push(currentUser);
            uint256 newPosition = roleUsers[_role].length - 1;
            memberPosition[_role][currentUser] = newPosition;

            emit RoleRegistered(_role, currentUser);
        }
    }

    function deleteRole(bytes32 _role, address _user) external virtual {
        require(_user != address(0), "User address cannot be zero");
        require(_user != msg.sender, "Caller cannot revoke role from self");

        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can revoke roles");

        require(isMemberOfRole[_role][_user], "User is not registered in this role's list");
        require(hasRole(_role, _user), "User does not have this role");

        // --- Revoke Role ---
        _revokeRole(_role, _user);
        isMemberOfRole[_role][_user] = false;

        uint256 position = memberPosition[_role][_user];
        uint256 lastPosition = roleUsers[_role].length - 1;
        if (position != lastPosition) {
            address lastUser = roleUsers[_role][lastPosition];
            roleUsers[_role][position] = lastUser;
            memberPosition[_role][lastUser] = position;
        }
        roleUsers[_role].pop();
        delete memberPosition[_role][_user];

        emit RoleDeleted(_role, _user);
    }
}
