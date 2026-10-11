// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Role ids shared by the DAO and its modules (tasks, votes...). DEFAULT_ADMIN_ROLE is 0x00, as in OpenZeppelin.
// They must match packages/nextjs/constants/roles.ts.
bytes32 constant DEFAULT_ADMIN = 0x00;
bytes32 constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
bytes32 constant TASK_MANAGER_ROLE = keccak256("TASK_MANAGER_ROLE");
bytes32 constant PROPOSAL_MANAGER_ROLE = keccak256("PROPOSAL_MANAGER_ROLE");
bytes32 constant USER_ROLE = keccak256("USER_ROLE");
