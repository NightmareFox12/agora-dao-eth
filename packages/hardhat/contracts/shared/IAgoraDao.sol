// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/// @dev What the modules of a DAO need from it: who has which role, how many members it has and the
/// addresses of the other modules they talk to.
interface IAgoraDao {
    function isRole(bytes32 _role, address _user) external view returns (bool);

    /// @notice How many members the DAO has (the creator plus everyone who joined).
    function userCounter() external view returns (uint256);

    function tasks() external view returns (address);
    function votes() external view returns (address);
    function treasury() external view returns (address);
    function publicEvents() external view returns (address);
    function reputation() external view returns (address);
    function rewards() external view returns (address);
}
