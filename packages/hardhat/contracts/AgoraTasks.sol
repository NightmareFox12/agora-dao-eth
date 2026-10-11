// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./shared/IAgoraDao.sol";
import "./shared/RoleIds.sol";

/**
 * Tasks of a DAO, with the reward held in escrow by this contract.
 *
 *  Open -> Taken -> Submitted -+-> Completed   the creator approves: the assignee is paid right away
 *                              +-> Rejected    the creator rejects (with a reason): fix it, or dispute it
 *                              |     +-> Disputed -> Completed | Cancelled   an auditor (or admin) decides
 *                              +-> Completed   the creator did not answer in time: the assignee is paid
 *  Open (nobody took it in time) or cancelled by the creator -> Cancelled     the creator is refunded
 *
 * What a task is about (long description, images, acceptance criteria, links) lives in a file outside the chain:
 * the contract only keeps its SHA-256 (`metadataHash`). Whoever reads the file recalculates the hash and compares,
 * so what was agreed cannot be changed afterwards without it being noticed.
 *
 * Every DAO has its own copy of this contract (a clone created by the factory) and asks the DAO who has which role.
 * @title AgoraTasks
 * @author NightmareFox12
 */
contract AgoraTasks is ReentrancyGuard {
    enum Status {
        Open,
        Taken,
        Submitted,
        Rejected,
        Disputed,
        Completed,
        Cancelled
    }

    /**
     * `deadline` depends on the status:
     *  Open: until when somebody can take it. Taken / Rejected: until when the work must be sent.
     *  Submitted: until when the creator can answer. Any other status: 0.
     * `workWindow` is how long (in seconds) the assignee has to send the work; the creator chooses it.
     */
    struct Task {
        uint256 id;
        address creator;
        address assignee;
        uint256 reward;
        string title;
        string summary;
        uint256 categoryId;
        bytes32 metadataHash;
        Status status;
        uint256 createdAt;
        uint256 deadline;
        uint256 workWindow;
        string submissionURI;
        string submissionNote;
        string rejectionReason;
    }

    // Keep in sync with packages/nextjs/lib/schemes/task.scheme.ts and constants/taskCategories.ts
    uint256 public constant MAX_TITLE_LENGTH = 80;
    uint256 public constant MAX_SUMMARY_LENGTH = 160;
    uint256 public constant MAX_LINK_LENGTH = 300;
    uint256 public constant MAX_TEXT_LENGTH = 300;
    // Categories are ids from 0 to CATEGORY_COUNT - 1; their names live in the frontend (constants/taskCategories.ts)
    uint256 public constant CATEGORY_COUNT = 6;

    uint256 public constant ACCEPTANCE_WINDOW = 30 days;
    uint256 public constant MIN_WORK_DAYS = 7;
    uint256 public constant MAX_WORK_DAYS = 30;
    uint256 public constant REVIEW_WINDOW = 7 days;

    IAgoraDao public dao;
    bool private initialized;
    Task[] private tasks;

    event TaskCreated(uint256 indexed id, address indexed creator, uint256 reward);
    event TaskStatusChanged(uint256 indexed id, Status status, address indexed actor);

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
    function taskCount() external view returns (uint256) {
        return tasks.length;
    }

    function getTask(uint256 _id) external view returns (Task memory) {
        return _task(_id);
    }

    function getAllTasks() external view returns (Task[] memory) {
        return tasks;
    }

    // --- WRITE FUNCTIONS ---

    /// @notice Publishes a task. The reward is the ETH sent with the call and stays here until the task ends.
    /// @param _workDays how many days the assignee will have to send the work once they take it
    /// @param _metadataHash SHA-256 of the details file: description, images, acceptance criteria and references
    function createTask(
        string calldata _title,
        string calldata _summary,
        uint256 _categoryId,
        uint256 _workDays,
        bytes32 _metadataHash
    ) external payable returns (uint256 id) {
        require(
            dao.isRole(TASK_MANAGER_ROLE, msg.sender) || dao.isRole(DEFAULT_ADMIN, msg.sender),
            "Only task managers or admins can create tasks"
        );
        require(msg.value > 0, "The reward must be greater than zero");
        require(bytes(_title).length > 0, "The title must not be empty");
        require(bytes(_title).length <= MAX_TITLE_LENGTH, "The title is too long");
        require(bytes(_summary).length > 0, "The summary must not be empty");
        require(bytes(_summary).length <= MAX_SUMMARY_LENGTH, "The summary is too long");
        require(_categoryId < CATEGORY_COUNT, "Invalid category");
        require(_workDays >= MIN_WORK_DAYS && _workDays <= MAX_WORK_DAYS, "Invalid work days");
        require(_metadataHash != bytes32(0), "The details hash must not be empty");

        id = tasks.length;
        Task storage task = tasks.push();
        task.id = id;
        task.creator = msg.sender;
        task.reward = msg.value;
        task.title = _title;
        task.summary = _summary;
        task.categoryId = _categoryId;
        task.metadataHash = _metadataHash;
        task.status = Status.Open;
        task.createdAt = block.timestamp;
        task.deadline = block.timestamp + ACCEPTANCE_WINDOW;
        task.workWindow = _workDays * 1 days;

        emit TaskCreated(id, msg.sender, msg.value);
        emit TaskStatusChanged(id, Status.Open, msg.sender);
    }

    /// @notice A member takes an open task. This stops the acceptance countdown.
    function takeTask(uint256 _id) external {
        Task storage task = _task(_id);

        require(task.status == Status.Open, "The task is not open");
        require(block.timestamp <= task.deadline, "The task expired");
        require(msg.sender != task.creator, "The creator cannot take its own task");
        require(dao.isRole(USER_ROLE, msg.sender), "Only members can take tasks");

        task.assignee = msg.sender;
        task.deadline = block.timestamp + task.workWindow;
        _setStatus(task, Status.Taken);
    }

    /// @notice The assignee gives the task up. It opens again with a new acceptance window.
    function abandonTask(uint256 _id) external {
        Task storage task = _task(_id);

        require(msg.sender == task.assignee, "Only the assignee can abandon the task");
        require(task.status == Status.Taken || task.status == Status.Rejected, "The task cannot be abandoned now");

        _reopen(task);
    }

    /// @notice The creator takes the task from an assignee who did not send the work in time.
    function unassignTask(uint256 _id) external {
        Task storage task = _task(_id);

        require(msg.sender == task.creator, "Only the creator can unassign the task");
        require(task.status == Status.Taken || task.status == Status.Rejected, "The task cannot be unassigned now");
        require(block.timestamp > task.deadline, "The assignee still has time");

        _reopen(task);
    }

    /// @notice The assignee sends the work (a link to Figma, GitHub...) for the creator to review.
    function submitWork(uint256 _id, string calldata _link, string calldata _note) external {
        Task storage task = _task(_id);

        require(msg.sender == task.assignee, "Only the assignee can submit work");
        require(task.status == Status.Taken || task.status == Status.Rejected, "The task is not in progress");
        require(bytes(_link).length > 0, "The link must not be empty");
        require(bytes(_link).length <= MAX_LINK_LENGTH, "The link is too long");
        require(bytes(_note).length <= MAX_TEXT_LENGTH, "The note is too long");

        task.submissionURI = _link;
        task.submissionNote = _note;
        delete task.rejectionReason;
        task.deadline = block.timestamp + REVIEW_WINDOW;
        _setStatus(task, Status.Submitted);
    }

    /// @notice The creator is happy with the work: the assignee is paid.
    function approveWork(uint256 _id) external nonReentrant {
        Task storage task = _task(_id);

        require(msg.sender == task.creator, "Only the creator can approve the work");
        require(task.status == Status.Submitted, "There is no work to approve");

        _pay(task);
    }

    /// @notice The creator asks for changes. The assignee can fix it, give up, or dispute the decision.
    function rejectWork(uint256 _id, string calldata _reason) external {
        Task storage task = _task(_id);

        require(msg.sender == task.creator, "Only the creator can reject the work");
        require(task.status == Status.Submitted, "There is no work to reject");
        require(block.timestamp <= task.deadline, "The review window is over");
        require(bytes(_reason).length > 0, "The reason must not be empty");
        require(bytes(_reason).length <= MAX_TEXT_LENGTH, "The reason is too long");

        task.rejectionReason = _reason;
        task.deadline = block.timestamp + task.workWindow;
        _setStatus(task, Status.Rejected);
    }

    /// @notice The assignee does not agree with the rejection: an auditor or admin will decide.
    function disputeRejection(uint256 _id) external {
        Task storage task = _task(_id);

        require(msg.sender == task.assignee, "Only the assignee can dispute");
        require(task.status == Status.Rejected, "There is no rejection to dispute");

        task.deadline = 0;
        _setStatus(task, Status.Disputed);
    }

    /// @notice An auditor or admin (who is not part of the task) pays the assignee or refunds the creator.
    function resolveDispute(uint256 _id, bool _payAssignee) external nonReentrant {
        Task storage task = _task(_id);

        require(task.status == Status.Disputed, "The task is not in dispute");
        require(
            dao.isRole(AUDITOR_ROLE, msg.sender) || dao.isRole(DEFAULT_ADMIN, msg.sender),
            "Only auditors or admins can resolve disputes"
        );
        require(msg.sender != task.creator && msg.sender != task.assignee, "You are part of this task");

        if (_payAssignee) _pay(task);
        else _refund(task);
    }

    /// @notice The creator did not answer in time: the assignee gets paid. Anybody can trigger it.
    function claimPayment(uint256 _id) external nonReentrant {
        Task storage task = _task(_id);

        require(task.status == Status.Submitted, "There is no work waiting for review");
        require(block.timestamp > task.deadline, "The creator still has time to review");

        _pay(task);
    }

    /// @notice The creator cancels a task nobody has taken yet.
    function cancelTask(uint256 _id) external nonReentrant {
        Task storage task = _task(_id);

        require(msg.sender == task.creator, "Only the creator can cancel the task");
        require(task.status == Status.Open, "Only open tasks can be cancelled");

        _refund(task);
    }

    /// @notice Nobody took the task in time: the creator is refunded. Anybody can trigger it.
    function refundExpired(uint256 _id) external nonReentrant {
        Task storage task = _task(_id);

        require(task.status == Status.Open, "The task is not open");
        require(block.timestamp > task.deadline, "The task has not expired");

        _refund(task);
    }

    // --- INTERNAL ---
    function _task(uint256 _id) private view returns (Task storage) {
        require(_id < tasks.length, "The task does not exist");
        return tasks[_id];
    }

    function _setStatus(Task storage task, Status _status) private {
        task.status = _status;
        emit TaskStatusChanged(task.id, _status, msg.sender);
    }

    function _reopen(Task storage task) private {
        task.assignee = address(0);
        task.deadline = block.timestamp + ACCEPTANCE_WINDOW;
        delete task.submissionURI;
        delete task.submissionNote;
        delete task.rejectionReason;
        _setStatus(task, Status.Open);
    }

    function _pay(Task storage task) private {
        address assignee = task.assignee;
        task.deadline = 0;
        _setStatus(task, Status.Completed);

        Address.sendValue(payable(assignee), task.reward);
    }

    function _refund(Task storage task) private {
        address creator = task.creator;
        task.deadline = 0;
        _setStatus(task, Status.Cancelled);

        Address.sendValue(payable(creator), task.reward);
    }
}
