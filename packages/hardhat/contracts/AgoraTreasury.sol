// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./shared/IAgoraDao.sol";

/**
 * The treasury of a DAO.
 *
 * Receiving money is easy: anyone can send ETH to this contract and it is deposited.
 * Spending money is strict: it only moves when the DAO's voting module tells it to, after a proposal is
 * approved. There is no owner, no admin button, no emergency withdraw.
 *
 * Every DAO has its own copy of this contract (a clone created by the factory).
 *
 * @title AgoraTreasury
 * @author NightmareFox12
 */
contract AgoraTreasury is ReentrancyGuard {
    IAgoraDao public dao;
    /// @notice The voting module authorized to spend from this treasury.
    address public votes;
    bool private initialized;

    /// @notice Running totals for the dashboard: deposits plus payouts over all time.
    uint256 public totalDeposited;
    uint256 public totalPaid;

    event Deposited(address indexed from, uint256 amount);
    event Paid(address indexed to, uint256 amount, uint256 indexed proposalId);

    /// @dev Locks the implementation: only the clones can be initialized.
    constructor() {
        initialized = true;
    }

    function initialize(address _dao, address _votes) external {
        require(!initialized, "Already initialized");
        require(_dao != address(0) && _votes != address(0), "Invalid address");

        initialized = true;
        dao = IAgoraDao(_dao);
        votes = _votes;
    }

    // --- READ FUNCTIONS ---
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    // --- WRITE FUNCTIONS ---

    /// @notice Receives a donation. The ETH stays in the contract until a proposal spends it.
    receive() external payable {
        require(msg.value > 0, "No ETH sent");
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Called by the voting module when an approved payout proposal is executed.
    function pay(address _to, uint256 _amount, uint256 _proposalId) external nonReentrant {
        require(msg.sender == votes, "Only the votes module can spend");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "The amount must be greater than zero");
        require(address(this).balance >= _amount, "Not enough funds in the treasury");

        totalPaid += _amount;
        emit Paid(_to, _amount, _proposalId);

        Address.sendValue(payable(_to), _amount);
    }
}
