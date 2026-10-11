// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/// @dev What the modules of a DAO need from it: to know who can do what.
interface IAgoraDao {
    function isRole(bytes32 _role, address _user) external view returns (bool);
}
