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
    mapping(bytes32 => mapping(address => uint256)) private memberPosition;

    //events
    event RoleRegistered(bytes32 indexed role, address indexed user, address indexed executor);
    event RoleDeleted(bytes32 indexed role, address indexed user, address indexed executor);

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
        _checkCanAssign(_role);
        _registerRole(_role, _user);
    }

    function registerRoleBatch(bytes32 _role, address[] calldata _users) external {
        _checkCanAssign(_role);

        for (uint256 i = 0; i < _users.length; i++) {
            _registerRole(_role, _users[i]);
        }
    }

    function deleteRole(bytes32 _role, address _user) external virtual {
        require(_user != address(0), "User address cannot be zero");
        require(_user != msg.sender, "Caller cannot revoke role from self");
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can revoke roles");
        require(hasRole(_role, _user), "User does not have this role");

        _revokeRole(_role, _user);

        emit RoleDeleted(_role, _user, msg.sender);
    }

    // --- OpenZeppelin entry points ---
    // They would bypass the permission rules above, so every change goes through registerRole / deleteRole.
    function grantRole(bytes32, address) public pure override {
        revert("Use registerRole to assign roles");
    }

    function revokeRole(bytes32, address) public pure override {
        revert("Use deleteRole to revoke roles");
    }

    function renounceRole(bytes32, address) public pure override {
        revert("Roles cannot be renounced");
    }

    // --- INTERNAL ---
    function _joinDaoUser(address _user) internal {
        require(!hasRole(USER_ROLE, _user), "User already exists");

        _grantRole(USER_ROLE, _user);

        emit RoleRegistered(USER_ROLE, _user, address(0));
    }

    function _registerRole(bytes32 _role, address _user) private {
        require(_user != address(0), "User address cannot be zero");
        require(_user != msg.sender, "Caller cannot assign role to self");

        if (hasRole(DEFAULT_ADMIN_ROLE, _user)) {
            require(_role == DEFAULT_ADMIN_ROLE, "Admin cannot assign other roles to self");
        }

        require(!hasRole(_role, _user), "User already exists");

        _grantRole(_role, _user);

        emit RoleRegistered(_role, _user, msg.sender);
    }

    function _checkCanAssign(bytes32 _role) private view {
        require(_isKnownRole(_role), "Unknown role");

        if (_role == DEFAULT_ADMIN_ROLE) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can assign DEFAULT_ADMIN_ROLE");
        } else if (_role == AUDITOR_ROLE) {
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admin can assign AUDITOR_ROLE");
        } else {
            require(
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(AUDITOR_ROLE, msg.sender),
                "Caller must be Admin or Auditor to assign this role"
            );
        }
    }

    function _isKnownRole(bytes32 _role) private pure returns (bool) {
        return
            _role == DEFAULT_ADMIN_ROLE ||
            _role == AUDITOR_ROLE ||
            _role == TASK_MANAGER_ROLE ||
            _role == PROPOSAL_MANAGER_ROLE ||
            _role == USER_ROLE;
    }

    // Keeps roleUsers in sync no matter how a role is granted or revoked.
    function _grantRole(bytes32 _role, address _account) internal virtual override returns (bool) {
        bool granted = super._grantRole(_role, _account);

        if (granted) {
            memberPosition[_role][_account] = roleUsers[_role].length;
            roleUsers[_role].push(_account);
        }

        return granted;
    }

    function _revokeRole(bytes32 _role, address _account) internal virtual override returns (bool) {
        bool revoked = super._revokeRole(_role, _account);

        if (revoked) {
            uint256 position = memberPosition[_role][_account];
            uint256 lastPosition = roleUsers[_role].length - 1;

            if (position != lastPosition) {
                address lastUser = roleUsers[_role][lastPosition];
                roleUsers[_role][position] = lastUser;
                memberPosition[_role][lastUser] = position;
            }

            roleUsers[_role].pop();
            delete memberPosition[_role][_account];
        }

        return revoked;
    }
}
