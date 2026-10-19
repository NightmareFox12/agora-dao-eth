// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./shared/IAgoraDao.sol";
import "./shared/IAgoraReputation.sol";
import "./shared/RoleIds.sol";

/**
 * Public events a DAO organizes: meetups, workshops, calls... Any member can publish an event and any
 * member can register to attend. The contract only keeps track of who said they will go: there is no
 * payment, no refund and no attendance check-in on-chain (that happens off-chain, at the event itself).
 *
 * The long description and the cover image live in a file off-chain (Supabase Storage, same pattern as
 * tasks): the contract keeps the SHA-256 (`metadataHash`), so the page detects any later alteration.
 * Metadata is optional: an event can also be created with just title, summary, date and location.
 *
 * Every DAO has its own copy of this contract (a clone created by the factory).
 *
 * @title AgoraEvents
 * @author NightmareFox12
 */
contract AgoraEvents {
    enum Status {
        Scheduled,
        Cancelled
    }

    struct Event {
        uint256 id;
        address creator;
        string title;
        string summary;
        /// @dev Unix timestamp (seconds) when the event starts
        uint256 startsAt;
        string location;
        /// @dev 0 means no limit
        uint256 maxAttendees;
        /// @dev SHA-256 of the details file (0x00 means no extended details)
        bytes32 metadataHash;
        Status status;
        uint256 createdAt;
    }

    // Keep in sync with packages/nextjs/lib/schemes/event.scheme.ts
    uint256 public constant MAX_TITLE_LENGTH = 100;
    uint256 public constant MAX_SUMMARY_LENGTH = 300;
    uint256 public constant MAX_LOCATION_LENGTH = 200;
    /// @notice The event must be at least this far in the future when published.
    uint256 public constant MIN_LEAD_TIME = 1 hours;
    /// @notice The event date cannot be further in the future than this.
    uint256 public constant MAX_FUTURE_TIME = 730 days;

    IAgoraDao public dao;
    bool private initialized;
    Event[] private events;

    // event id -> attendee -> true if registered
    mapping(uint256 => mapping(address => bool)) private attending;
    // event id -> position of each attendee in the attendees list (for O(1) cancellation)
    mapping(uint256 => mapping(address => uint256)) private attendeePosition;
    // event id -> ordered list of attendees
    mapping(uint256 => address[]) private attendees;

    event EventCreated(uint256 indexed id, address indexed creator, uint256 startsAt);
    event EventCancelled(uint256 indexed id, address indexed by);
    event AttendeeRegistered(uint256 indexed id, address indexed attendee);
    event AttendeeCancelled(uint256 indexed id, address indexed attendee);

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
    function eventCount() external view returns (uint256) {
        return events.length;
    }

    function getEventById(uint256 _id) external view returns (Event memory) {
        return _event(_id);
    }

    function getAllEvents() external view returns (Event[] memory) {
        return events;
    }

    function getAttendees(uint256 _id) external view returns (address[] memory) {
        require(_id < events.length, "The event does not exist");
        return attendees[_id];
    }

    function attendeeCount(uint256 _id) external view returns (uint256) {
        require(_id < events.length, "The event does not exist");
        return attendees[_id].length;
    }

    function isAttending(uint256 _id, address _user) external view returns (bool) {
        require(_id < events.length, "The event does not exist");
        return attending[_id][_user];
    }

    // --- WRITE FUNCTIONS ---

    /// @notice Publishes an event. Any member of the DAO can create one.
    function createEvent(
        string calldata _title,
        string calldata _summary,
        uint256 _startsAt,
        string calldata _location,
        uint256 _maxAttendees,
        bytes32 _metadataHash
    ) external returns (uint256 id) {
        require(_isMember(msg.sender), "Only members can create events");
        require(bytes(_title).length > 0, "The title must not be empty");
        require(bytes(_title).length <= MAX_TITLE_LENGTH, "The title is too long");
        require(bytes(_summary).length > 0, "The summary must not be empty");
        require(bytes(_summary).length <= MAX_SUMMARY_LENGTH, "The summary is too long");
        require(bytes(_location).length > 0, "The location must not be empty");
        require(bytes(_location).length <= MAX_LOCATION_LENGTH, "The location is too long");
        require(_startsAt > block.timestamp + MIN_LEAD_TIME, "The date must be at least an hour in the future");
        require(_startsAt < block.timestamp + MAX_FUTURE_TIME, "The date is too far in the future");

        id = events.length;
        Event storage e = events.push();
        e.id = id;
        e.creator = msg.sender;
        e.title = _title;
        e.summary = _summary;
        e.startsAt = _startsAt;
        e.location = _location;
        e.maxAttendees = _maxAttendees;
        e.metadataHash = _metadataHash;
        e.status = Status.Scheduled;
        e.createdAt = block.timestamp;

        emit EventCreated(id, msg.sender, _startsAt);

        IAgoraReputation(dao.reputation()).award(msg.sender, 10);
    }

    /// @notice Registers the caller as an attendee. Only members of the DAO can register.
    function register(uint256 _id) external {
        Event storage e = _event(_id);

        require(e.status == Status.Scheduled, "The event is cancelled");
        require(e.startsAt > block.timestamp, "The event already started");
        require(_isMember(msg.sender), "Only members can register");
        require(!attending[_id][msg.sender], "You are already registered");
        require(e.maxAttendees == 0 || attendees[_id].length < e.maxAttendees, "The event is full");

        attending[_id][msg.sender] = true;
        attendeePosition[_id][msg.sender] = attendees[_id].length;
        attendees[_id].push(msg.sender);

        emit AttendeeRegistered(_id, msg.sender);

        IAgoraReputation(dao.reputation()).award(msg.sender, 5);
    }

    /// @notice Cancels the caller's registration. Opens a slot for someone else.
    function cancelRegistration(uint256 _id) external {
        Event storage e = _event(_id);

        require(e.startsAt > block.timestamp, "The event already started");
        require(attending[_id][msg.sender], "You are not registered");

        // swap-and-pop so the list stays packed
        address[] storage list = attendees[_id];
        uint256 position = attendeePosition[_id][msg.sender];
        uint256 lastPosition = list.length - 1;
        if (position != lastPosition) {
            address lastAttendee = list[lastPosition];
            list[position] = lastAttendee;
            attendeePosition[_id][lastAttendee] = position;
        }
        list.pop();

        delete attending[_id][msg.sender];
        delete attendeePosition[_id][msg.sender];

        emit AttendeeCancelled(_id, msg.sender);
    }

    /// @notice Cancels the event. Only the creator or an admin can do it, and only before the start.
    function cancelEvent(uint256 _id) external {
        Event storage e = _event(_id);

        require(e.status == Status.Scheduled, "The event is already cancelled");
        require(e.startsAt > block.timestamp, "The event already started");
        require(
            msg.sender == e.creator || dao.isRole(DEFAULT_ADMIN, msg.sender),
            "Only the creator or an admin can cancel the event"
        );

        e.status = Status.Cancelled;

        emit EventCancelled(_id, msg.sender);
    }

    // --- INTERNAL ---
    function _event(uint256 _id) private view returns (Event storage) {
        require(_id < events.length, "The event does not exist");
        return events[_id];
    }

    function _isMember(address _user) private view returns (bool) {
        return dao.isRole(USER_ROLE, _user) || dao.isRole(DEFAULT_ADMIN, _user);
    }
}
