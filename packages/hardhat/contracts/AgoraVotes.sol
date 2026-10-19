// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./shared/IAgoraDao.sol";
import "./shared/IAgoraReputation.sol";
import "./shared/RoleIds.sol";

interface IAgoraTreasury {
    function pay(address _to, uint256 _amount, uint256 _proposalId) external;
}

/**
 * Proposals the members of a DAO vote on.
 *
 *  Active (voting is open) -+-> Approved          more For than Against votes, and quorum reached
 *                           +-> Rejected          more Against than For, or a tie, and quorum reached
 *                           +-> QuorumNotReached  not enough people voted
 *
 * A proposal can be plain text (just registers the decision) or carry an action: today, "pay X ETH to Y from the
 * treasury". When a payout proposal is approved, anyone can call `execute` and the treasury sends the ETH; the
 * proposal moves to Executed. Plain text proposals stay Approved: there is nothing to execute.
 *
 * The result is set when anyone calls `finalize` after the voting deadline.
 *
 * Every DAO has its own copy of this contract (a clone created by the factory) and asks the DAO who has which
 * role.
 *
 * @title AgoraVotes
 * @author NightmareFox12
 */
contract AgoraVotes {
    enum Status {
        Active,
        Approved,
        Rejected,
        QuorumNotReached,
        Executed
    }

    /// @dev Vote options. Order matches OpenZeppelin Governor so tooling that uses it feels familiar.
    enum Choice {
        Against,
        For,
        Abstain
    }

    enum ActionKind {
        None,
        PayETH
    }

    struct Action {
        ActionKind kind;
        /// @dev Recipient of the payment (unused when kind == None)
        address target;
        /// @dev Amount in wei (unused when kind == None)
        uint256 value;
    }

    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        Status status;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        // Snapshot of userCounter when the proposal was created. Used as the denominator for the quorum, so
        // joining the DAO during voting does not raise the bar.
        uint256 totalMembersAtCreation;
        /// @dev Action to execute if the proposal is approved. `kind == None` for text proposals.
        Action action;
    }

    // Keep in sync with packages/nextjs/lib/schemes/vote.scheme.ts
    uint256 public constant MAX_TITLE_LENGTH = 100;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 2000;
    uint256 public constant MIN_VOTING_DAYS = 3;
    uint256 public constant MAX_VOTING_DAYS = 14;

    /// @notice Percentage of members (at proposal creation) that must take part for the result to count.
    uint256 public constant QUORUM_PERCENT = 20;

    IAgoraDao public dao;
    bool private initialized;
    Proposal[] private proposals;

    // proposal id -> voter -> true if they voted
    mapping(uint256 => mapping(address => bool)) private voted;
    // proposal id -> voter -> their choice (only meaningful if voted)
    mapping(uint256 => mapping(address => Choice)) private chosen;

    event ProposalCreated(uint256 indexed id, address indexed creator, uint256 votingDeadline);
    event VoteCast(uint256 indexed id, address indexed voter, Choice choice);
    event ProposalStatusChanged(uint256 indexed id, Status status);

    /// @dev Locks the implementation: only the clones can be initialized.
    constructor() {
        initialized = true;
    }

    function initialize(address _dao) external {
        require(!initialized, "Already initialized");
        require(_dao != address(0), "Invalid DAO");

        initialized = true;
        dao = IAgoraDao(_dao);
    }

    // --- READ FUNCTIONS ---
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 _id) external view returns (Proposal memory) {
        return _proposal(_id);
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }

    /// @notice Returns whether `_voter` has cast a vote on `_id`, and which choice they picked.
    function getVote(uint256 _id, address _voter) external view returns (bool hasVoted, Choice choice) {
        require(_id < proposals.length, "The proposal does not exist");
        return (voted[_id][_voter], chosen[_id][_voter]);
    }

    // --- WRITE FUNCTIONS ---

    /// @notice Opens a plain text proposal for voting. Nothing is executed on-chain if it is approved.
    function createProposal(
        string calldata _title,
        string calldata _description,
        uint256 _votingDays
    ) external returns (uint256 id) {
        return _createProposal(_title, _description, _votingDays, Action(ActionKind.None, address(0), 0));
    }

    /// @notice Opens a proposal that, if approved, sends ETH from the treasury to `_recipient`.
    function createPayoutProposal(
        string calldata _title,
        string calldata _description,
        uint256 _votingDays,
        address _recipient,
        uint256 _amount
    ) external returns (uint256 id) {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "The amount must be greater than zero");
        return _createProposal(_title, _description, _votingDays, Action(ActionKind.PayETH, _recipient, _amount));
    }

    /// @notice Casts the vote of the caller. Each member can vote once per proposal.
    function castVote(uint256 _id, Choice _choice) external {
        Proposal storage p = _proposal(_id);

        require(p.status == Status.Active, "The proposal is not active");
        require(block.timestamp <= p.votingDeadline, "Voting has ended");
        require(dao.isRole(USER_ROLE, msg.sender) || dao.isRole(DEFAULT_ADMIN, msg.sender), "Only members can vote");
        require(!voted[_id][msg.sender], "You already voted");

        voted[_id][msg.sender] = true;
        chosen[_id][msg.sender] = _choice;

        if (_choice == Choice.For) p.forVotes++;
        else if (_choice == Choice.Against) p.againstVotes++;
        else p.abstainVotes++;

        emit VoteCast(_id, msg.sender, _choice);

        IAgoraReputation(dao.reputation()).award(msg.sender, 5);
    }

    /// @notice Closes the proposal and sets its result. Anyone can call it once voting has ended.
    function finalize(uint256 _id) external {
        Proposal storage p = _proposal(_id);

        require(p.status == Status.Active, "The proposal is not active");
        require(block.timestamp > p.votingDeadline, "Voting is still open");

        uint256 participation = p.forVotes + p.againstVotes + p.abstainVotes;

        // participation * 100 avoids rounding issues at low member counts
        if (participation * 100 < p.totalMembersAtCreation * QUORUM_PERCENT) {
            p.status = Status.QuorumNotReached;
        } else if (p.forVotes > p.againstVotes) {
            p.status = Status.Approved;
        } else {
            p.status = Status.Rejected;
        }

        emit ProposalStatusChanged(_id, p.status);
    }

    /// @notice Runs the action of an approved payout proposal. Anyone can call it.
    function execute(uint256 _id) external {
        Proposal storage p = _proposal(_id);

        require(p.status == Status.Approved, "The proposal is not approved");
        require(p.action.kind != ActionKind.None, "The proposal has no action");

        p.status = Status.Executed;
        emit ProposalStatusChanged(_id, Status.Executed);

        if (p.action.kind == ActionKind.PayETH) {
            IAgoraTreasury(dao.treasury()).pay(p.action.target, p.action.value, _id);
        }
    }

    // --- INTERNAL ---
    function _createProposal(
        string calldata _title,
        string calldata _description,
        uint256 _votingDays,
        Action memory _action
    ) private returns (uint256 id) {
        require(
            dao.isRole(PROPOSAL_MANAGER_ROLE, msg.sender) || dao.isRole(DEFAULT_ADMIN, msg.sender),
            "Only proposal managers or admins can create proposals"
        );
        require(bytes(_title).length > 0, "The title must not be empty");
        require(bytes(_title).length <= MAX_TITLE_LENGTH, "The title is too long");
        require(bytes(_description).length > 0, "The description must not be empty");
        require(bytes(_description).length <= MAX_DESCRIPTION_LENGTH, "The description is too long");
        require(_votingDays >= MIN_VOTING_DAYS && _votingDays <= MAX_VOTING_DAYS, "Invalid voting days");

        id = proposals.length;
        Proposal storage p = proposals.push();
        p.id = id;
        p.creator = msg.sender;
        p.title = _title;
        p.description = _description;
        p.status = Status.Active;
        p.createdAt = block.timestamp;
        p.votingDeadline = block.timestamp + _votingDays * 1 days;
        p.totalMembersAtCreation = dao.userCounter();
        p.action = _action;

        emit ProposalCreated(id, msg.sender, p.votingDeadline);
        emit ProposalStatusChanged(id, Status.Active);
    }

    function _proposal(uint256 _id) private view returns (Proposal storage) {
        require(_id < proposals.length, "The proposal does not exist");
        return proposals[_id];
    }
}
