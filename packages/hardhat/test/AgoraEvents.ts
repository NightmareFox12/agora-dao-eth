import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AgoraDao, AgoraDaoFactory, AgoraEvents } from "../typechain-types";
import { deployFactory } from "./helpers/deployFactory";

const Status = { Scheduled: 0, Cancelled: 1 } as const;

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const TITLE = "Meetup de noviembre";
const SUMMARY = "Charlamos del futuro de la DAO delante de una cerveza.";
const LOCATION = "Café de la Esquina, calle Ejemplo 5";
const METADATA = ethers.sha256(ethers.toUtf8Bytes("event details"));

describe("AgoraEvents", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let events: AgoraEvents;

  let admin: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let carol: HardhatEthersSigner;
  let dave: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  // creates an event starting one week from now and returns `(startsAt, tx)`
  const createEvent = async (
    signer: HardhatEthersSigner = alice,
    overrides: {
      startsAt?: number;
      maxAttendees?: number;
      title?: string;
      summary?: string;
      location?: string;
      metadata?: string;
    } = {},
  ) => {
    const startsAt = overrides.startsAt ?? (await time.latest()) + 7 * DAY;
    return events
      .connect(signer)
      .createEvent(
        overrides.title ?? TITLE,
        overrides.summary ?? SUMMARY,
        startsAt,
        overrides.location ?? LOCATION,
        overrides.maxAttendees ?? 0,
        overrides.metadata ?? METADATA,
      );
  };

  beforeEach(async () => {
    [, admin, alice, bob, carol, dave, outsider] = await ethers.getSigners();

    factory = await deployFactory();
    await factory.connect(admin).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();

    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;
    events = (await ethers.getContractAt("AgoraEvents", await dao.publicEvents())) as AgoraEvents;

    for (const member of [alice, bob, carol, dave]) await dao.connect(member).joinDao();
  });

  describe("setup", function () {
    it("is created together with the DAO and knows it", async function () {
      expect(await dao.publicEvents()).to.not.equal(ethers.ZeroAddress);
      expect(await events.dao()).to.equal(await dao.getAddress());
    });

    it("gives every DAO its own module", async function () {
      await factory.connect(admin).createDao("Solar Club", "Another DAO", [1], "");
      const [, second] = await factory.getAllDaos();
      const secondDao = await ethers.getContractAt("AgoraDao", second.daoAddress);

      expect(await secondDao.publicEvents()).to.not.equal(await dao.publicEvents());
    });

    it("cannot be initialized twice", async function () {
      await expect(events.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("cannot take over an implementation", async function () {
      const implementation = await (await ethers.getContractFactory("AgoraEvents")).deploy();
      await expect(implementation.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("keeps the limits the frontend form expects", async function () {
      expect(await events.MAX_TITLE_LENGTH()).to.equal(100n);
      expect(await events.MAX_SUMMARY_LENGTH()).to.equal(300n);
      expect(await events.MAX_LOCATION_LENGTH()).to.equal(200n);
      expect(await events.MIN_LEAD_TIME()).to.equal(BigInt(HOUR));
      expect(await events.MAX_FUTURE_TIME()).to.equal(BigInt(730 * DAY));
    });
  });

  describe("createEvent", function () {
    it("stores the event with the values given", async function () {
      const startsAt = (await time.latest()) + 7 * DAY;
      await expect(createEvent(alice, { startsAt }))
        .to.emit(events, "EventCreated")
        .withArgs(0, alice.address, startsAt);

      const event = await events.getEventById(0);
      expect(event.creator).to.equal(alice.address);
      expect(event.title).to.equal(TITLE);
      expect(event.summary).to.equal(SUMMARY);
      expect(event.startsAt).to.equal(startsAt);
      expect(event.location).to.equal(LOCATION);
      expect(event.maxAttendees).to.equal(0n);
      expect(event.metadataHash).to.equal(METADATA);
      expect(event.status).to.equal(Status.Scheduled);

      expect(await events.eventCount()).to.equal(1n);
    });

    it("lets the admin create events too", async function () {
      await createEvent(admin);
      expect((await events.getEventById(0)).creator).to.equal(admin.address);
    });

    it("rejects outsiders", async function () {
      await expect(createEvent(outsider)).to.be.revertedWith("Only members can create events");
    });

    it("validates the texts and the date", async function () {
      await expect(createEvent(alice, { title: "" })).to.be.revertedWith("The title must not be empty");
      await expect(createEvent(alice, { title: "t".repeat(101) })).to.be.revertedWith("The title is too long");
      await expect(createEvent(alice, { summary: "" })).to.be.revertedWith("The summary must not be empty");
      await expect(createEvent(alice, { summary: "s".repeat(301) })).to.be.revertedWith("The summary is too long");
      await expect(createEvent(alice, { location: "" })).to.be.revertedWith("The location must not be empty");
      await expect(createEvent(alice, { location: "l".repeat(201) })).to.be.revertedWith("The location is too long");

      // date rules
      const now = await time.latest();
      await expect(createEvent(alice, { startsAt: now + 30 * 60 })).to.be.revertedWith(
        "The date must be at least an hour in the future",
      );
      await expect(createEvent(alice, { startsAt: now + 731 * DAY })).to.be.revertedWith(
        "The date is too far in the future",
      );
    });

    it("accepts the metadata hash being empty (an event with no extended details)", async function () {
      await createEvent(alice, { metadata: ethers.ZeroHash });
      expect((await events.getEventById(0)).metadataHash).to.equal(ethers.ZeroHash);
    });

    it("lists every event in order", async function () {
      await createEvent(alice);
      await createEvent(admin);

      const all = await events.getAllEvents();
      expect(all.map(x => Number(x.id))).to.deep.equal([0, 1]);
    });

    it("fails for an event that does not exist", async function () {
      await expect(events.getEventById(5)).to.be.revertedWith("The event does not exist");
      await expect(events.getAttendees(5)).to.be.revertedWith("The event does not exist");
      await expect(events.attendeeCount(5)).to.be.revertedWith("The event does not exist");
      await expect(events.isAttending(5, alice.address)).to.be.revertedWith("The event does not exist");
    });
  });

  describe("register", function () {
    beforeEach(async () => {
      await createEvent(alice);
    });

    it("adds a member to the list and emits an event", async function () {
      await expect(events.connect(bob).register(0)).to.emit(events, "AttendeeRegistered").withArgs(0, bob.address);

      expect(await events.isAttending(0, bob.address)).to.equal(true);
      expect(await events.attendeeCount(0)).to.equal(1n);
      expect([...(await events.getAttendees(0))]).to.deep.equal([bob.address]);
    });

    it("lets the admin register too, and the event creator", async function () {
      await events.connect(admin).register(0);
      await events.connect(alice).register(0);

      expect([...(await events.getAttendees(0))]).to.deep.equal([admin.address, alice.address]);
    });

    it("rejects outsiders", async function () {
      await expect(events.connect(outsider).register(0)).to.be.revertedWith("Only members can register");
    });

    it("rejects a second registration", async function () {
      await events.connect(bob).register(0);
      await expect(events.connect(bob).register(0)).to.be.revertedWith("You are already registered");
    });

    it("rejects registering to a cancelled event", async function () {
      await events.connect(alice).cancelEvent(0);
      await expect(events.connect(bob).register(0)).to.be.revertedWith("The event is cancelled");
    });

    it("rejects registering after the event started", async function () {
      await time.increase(8 * DAY);
      await expect(events.connect(bob).register(0)).to.be.revertedWith("The event already started");
    });

    it("respects the capacity limit", async function () {
      await createEvent(alice, { maxAttendees: 2 });
      await events.connect(bob).register(1);
      await events.connect(carol).register(1);
      await expect(events.connect(dave).register(1)).to.be.revertedWith("The event is full");
    });

    it("treats a capacity of 0 as no limit", async function () {
      for (const member of [bob, carol, dave, admin]) await events.connect(member).register(0);
      expect(await events.attendeeCount(0)).to.equal(4n);
    });
  });

  describe("cancelRegistration", function () {
    beforeEach(async () => {
      await createEvent(alice);
      for (const member of [bob, carol, dave]) await events.connect(member).register(0);
    });

    it("removes the attendee and opens a slot", async function () {
      await expect(events.connect(carol).cancelRegistration(0))
        .to.emit(events, "AttendeeCancelled")
        .withArgs(0, carol.address);

      expect(await events.isAttending(0, carol.address)).to.equal(false);
      expect(await events.attendeeCount(0)).to.equal(2n);
      // swap-and-pop: dave took carol's spot
      expect([...(await events.getAttendees(0))]).to.deep.equal([bob.address, dave.address]);
    });

    it("lets the person register again after cancelling", async function () {
      await events.connect(carol).cancelRegistration(0);
      await events.connect(carol).register(0);
      expect(await events.isAttending(0, carol.address)).to.equal(true);
    });

    it("frees a slot in a full event", async function () {
      await createEvent(alice, { maxAttendees: 1 });
      await events.connect(bob).register(1);
      await expect(events.connect(carol).register(1)).to.be.revertedWith("The event is full");

      await events.connect(bob).cancelRegistration(1);
      await events.connect(carol).register(1);
      expect(await events.isAttending(1, carol.address)).to.equal(true);
    });

    it("rejects somebody who is not registered", async function () {
      await expect(events.connect(admin).cancelRegistration(0)).to.be.revertedWith("You are not registered");
    });

    it("rejects cancelling after the event started", async function () {
      await time.increase(8 * DAY);
      await expect(events.connect(bob).cancelRegistration(0)).to.be.revertedWith("The event already started");
    });

    it("works on the first and the last positions", async function () {
      await events.connect(bob).cancelRegistration(0);
      // dave took bob's place
      expect([...(await events.getAttendees(0))]).to.deep.equal([dave.address, carol.address]);

      await events.connect(carol).cancelRegistration(0);
      expect([...(await events.getAttendees(0))]).to.deep.equal([dave.address]);

      await events.connect(dave).cancelRegistration(0);
      expect([...(await events.getAttendees(0))]).to.deep.equal([]);
    });
  });

  describe("cancelEvent", function () {
    beforeEach(async () => {
      await createEvent(alice);
    });

    it("lets the creator cancel", async function () {
      await expect(events.connect(alice).cancelEvent(0)).to.emit(events, "EventCancelled").withArgs(0, alice.address);

      expect((await events.getEventById(0)).status).to.equal(Status.Cancelled);
    });

    it("lets an admin cancel somebody else's event", async function () {
      await events.connect(admin).cancelEvent(0);
      expect((await events.getEventById(0)).status).to.equal(Status.Cancelled);
    });

    it("rejects anybody else", async function () {
      for (const signer of [bob, carol, outsider]) {
        await expect(events.connect(signer).cancelEvent(0)).to.be.revertedWith(
          "Only the creator or an admin can cancel the event",
        );
      }
    });

    it("rejects cancelling twice", async function () {
      await events.connect(alice).cancelEvent(0);
      await expect(events.connect(alice).cancelEvent(0)).to.be.revertedWith("The event is already cancelled");
    });

    it("rejects cancelling after the event started", async function () {
      await time.increase(8 * DAY);
      await expect(events.connect(alice).cancelEvent(0)).to.be.revertedWith("The event already started");
    });

    it("keeps the list of attendees (so they know it was cancelled)", async function () {
      await events.connect(bob).register(0);
      await events.connect(alice).cancelEvent(0);

      expect(await events.isAttending(0, bob.address)).to.equal(true);
      expect([...(await events.getAttendees(0))]).to.deep.equal([bob.address]);
    });
  });
});
