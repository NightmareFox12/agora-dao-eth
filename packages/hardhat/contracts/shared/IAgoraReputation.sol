// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/// @dev Minimal interface the operational modules (tasks, votes, events...) use to award points to a user.
interface IAgoraReputation {
    function award(address _user, uint256 _amount) external;
}
