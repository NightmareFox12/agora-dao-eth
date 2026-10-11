import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AgoraDao, AgoraDaoFactory, AgoraTasks } from "../typechain-types";
import { deployFactory } from "./helpers/deployFactory";

const AUDITOR_ROLE = ethers.id("AUDITOR_ROLE");
const TASK_MANAGER_ROLE = ethers.id("TASK_MANAGER_ROLE");

const Status = { Open: 0, Taken: 1, Submitted: 2, Rejected: 3, Disputed: 4, Completed: 5, Cancelled: 6 } as const;

const DAY = 24 * 60 * 60;
const REWARD = ethers.parseEther("1");
const LINK = "https://www.figma.com/file/landing";

describe("AgoraTasks", function () {
  let factory: AgoraDaoFactory;
  let dao: AgoraDao;
  let tasks: AgoraTasks;

  let admin: HardhatEthersSigner; // creator of the DAO
  let manager: HardhatEthersSigner; // task manager
  let auditor: HardhatEthersSigner;
  let worker: HardhatEthersSigner; // member
  let otherMember: HardhatEthersSigner;
  let outsider: HardhatEthersSigner; // not in the DAO

  const createTask = (signer = manager, value = REWARD) =>
    tasks.connect(signer).createTask("Landing page", "Design and build the landing page", { value });

  // creates task 0 and leaves it taken by `worker`
  const takenTask = async () => {
    await createTask();
    await tasks.connect(worker).takeTask(0);
  };

  const submittedTask = async () => {
    await takenTask();
    await tasks.connect(worker).submitWork(0, LINK, "Done, check the prototype");
  };

  const rejectedTask = async () => {
    await submittedTask();
    await tasks.connect(manager).rejectWork(0, "The hero section is missing");
  };

  const disputedTask = async () => {
    await rejectedTask();
    await tasks.connect(worker).disputeRejection(0);
  };

  beforeEach(async () => {
    [, admin, manager, auditor, worker, otherMember, outsider] = await ethers.getSigners();

    factory = await deployFactory();
    await factory.connect(admin).createDao("ETH Force", "A DAO for testing", [0], "");
    const [created] = await factory.getAllDaos();

    dao = (await ethers.getContractAt("AgoraDao", created.daoAddress)) as AgoraDao;
    tasks = (await ethers.getContractAt("AgoraTasks", await dao.tasks())) as AgoraTasks;

    await dao.connect(admin).registerRole(TASK_MANAGER_ROLE, manager.address);
    await dao.connect(admin).registerRole(AUDITOR_ROLE, auditor.address);
    await dao.connect(worker).joinDao();
    await dao.connect(otherMember).joinDao();
  });

  describe("setup", function () {
    it("is created together with the DAO and knows it", async function () {
      expect(await dao.tasks()).to.not.equal(ethers.ZeroAddress);
      expect(await tasks.dao()).to.equal(await dao.getAddress());
    });

    it("gives every DAO its own module", async function () {
      await factory.connect(admin).createDao("Solar Club", "Another DAO", [1], "");
      const [, second] = await factory.getAllDaos();
      const secondDao = await ethers.getContractAt("AgoraDao", second.daoAddress);

      expect(await secondDao.tasks()).to.not.equal(await dao.tasks());
    });

    it("cannot be initialized twice", async function () {
      await expect(tasks.initialize(outsider.address)).to.be.revertedWith("Already initialized");
      await expect(dao.initialize(outsider.address, outsider.address, outsider.address)).to.be.revertedWith(
        "Already initialized",
      );
    });

    it("cannot take over an implementation", async function () {
      const implementation = await (await ethers.getContractFactory("AgoraTasks")).deploy();

      await expect(implementation.initialize(outsider.address)).to.be.revertedWith("Already initialized");
    });

    it("does not accept ETH sent directly", async function () {
      await expect(outsider.sendTransaction({ to: await tasks.getAddress(), value: 1 })).to.be.reverted;
    });
  });

  describe("createTask", function () {
    it("stores the task and holds the reward", async function () {
      await expect(createTask()).to.emit(tasks, "TaskCreated").withArgs(0, manager.address, REWARD);

      const task = await tasks.getTask(0);
      expect(task.creator).to.equal(manager.address);
      expect(task.reward).to.equal(REWARD);
      expect(task.title).to.equal("Landing page");
      expect(task.status).to.equal(Status.Open);
      expect(task.assignee).to.equal(ethers.ZeroAddress);
      expect(task.deadline).to.equal(BigInt(await time.latest()) + BigInt(30 * DAY));

      expect(await tasks.taskCount()).to.equal(1n);
      expect(await ethers.provider.getBalance(await tasks.getAddress())).to.equal(REWARD);
    });

    it("lets the admin create tasks too", async function () {
      await createTask(admin);
      expect((await tasks.getTask(0)).creator).to.equal(admin.address);
    });

    it("rejects members, auditors and outsiders", async function () {
      for (const signer of [worker, auditor, outsider]) {
        await expect(createTask(signer)).to.be.revertedWith("Only task managers or admins can create tasks");
      }
    });

    it("needs a reward", async function () {
      await expect(createTask(manager, 0n)).to.be.revertedWith("The reward must be greater than zero");
    });

    it("validates the title and the description", async function () {
      const create = (title: string, description: string) =>
        tasks.connect(manager).createTask(title, description, { value: REWARD });

      await expect(create("", "description")).to.be.revertedWith("The title must not be empty");
      await expect(create("t".repeat(81), "description")).to.be.revertedWith("The title is too long");
      await expect(create("title", "")).to.be.revertedWith("The description must not be empty");
      await expect(create("title", "d".repeat(501))).to.be.revertedWith("The description is too long");
      await create("t".repeat(80), "d".repeat(500));
    });

    it("lists all the tasks", async function () {
      await createTask();
      await createTask();

      const all = await tasks.getAllTasks();
      expect(all.map(x => Number(x.id))).to.deep.equal([0, 1]);
    });

    it("fails for a task that does not exist", async function () {
      await expect(tasks.getTask(5)).to.be.revertedWith("The task does not exist");
    });
  });

  describe("takeTask", function () {
    beforeEach(async () => {
      await createTask();
    });

    it("lets a member take it and starts the work window", async function () {
      await expect(tasks.connect(worker).takeTask(0))
        .to.emit(tasks, "TaskStatusChanged")
        .withArgs(0, Status.Taken, worker.address);

      const task = await tasks.getTask(0);
      expect(task.assignee).to.equal(worker.address);
      expect(task.status).to.equal(Status.Taken);
      expect(task.deadline).to.equal(BigInt(await time.latest()) + BigInt(30 * DAY));
    });

    it("only lets members take it", async function () {
      for (const signer of [outsider, auditor, admin]) {
        await expect(tasks.connect(signer).takeTask(0)).to.be.revertedWith("Only members can take tasks");
      }
    });

    it("does not let the creator take its own task", async function () {
      await dao.connect(admin).registerRole(TASK_MANAGER_ROLE, otherMember.address);
      await createTask(otherMember);

      await expect(tasks.connect(otherMember).takeTask(1)).to.be.revertedWith("The creator cannot take its own task");
    });

    it("cannot be taken twice", async function () {
      await tasks.connect(worker).takeTask(0);

      await expect(tasks.connect(otherMember).takeTask(0)).to.be.revertedWith("The task is not open");
    });

    it("cannot be taken after the 30 days", async function () {
      await time.increase(30 * DAY + 1);

      await expect(tasks.connect(worker).takeTask(0)).to.be.revertedWith("The task expired");
    });

    it("stops the acceptance countdown once somebody takes it", async function () {
      await tasks.connect(worker).takeTask(0);
      await time.increase(40 * DAY);

      await expect(tasks.connect(outsider).refundExpired(0)).to.be.revertedWith("The task is not open");
      expect((await tasks.getTask(0)).status).to.equal(Status.Taken);
    });
  });

  describe("tasks nobody takes", function () {
    beforeEach(async () => {
      await createTask();
    });

    it("cannot be refunded before the 30 days", async function () {
      await time.increase(29 * DAY);

      await expect(tasks.connect(outsider).refundExpired(0)).to.be.revertedWith("The task has not expired");
    });

    it("are refunded to the creator after the 30 days, whoever asks", async function () {
      await time.increase(30 * DAY + 1);

      const refund = tasks.connect(outsider).refundExpired(0);
      await expect(refund).to.changeEtherBalances([manager, await tasks.getAddress()], [REWARD, -REWARD]);

      const task = await tasks.getTask(0);
      expect(task.status).to.equal(Status.Cancelled);
      expect(task.deadline).to.equal(0n);
    });

    it("are not refunded twice", async function () {
      await time.increase(30 * DAY + 1);
      await tasks.refundExpired(0);

      await expect(tasks.refundExpired(0)).to.be.revertedWith("The task is not open");
    });

    it("can be cancelled by the creator while they are open", async function () {
      await expect(tasks.connect(manager).cancelTask(0)).to.changeEtherBalance(manager, REWARD);

      expect((await tasks.getTask(0)).status).to.equal(Status.Cancelled);
    });

    it("cannot be cancelled by anybody else", async function () {
      await expect(tasks.connect(admin).cancelTask(0)).to.be.revertedWith("Only the creator can cancel the task");
    });

    it("cannot be cancelled once somebody took them", async function () {
      await tasks.connect(worker).takeTask(0);

      await expect(tasks.connect(manager).cancelTask(0)).to.be.revertedWith("Only open tasks can be cancelled");
    });
  });

  describe("submitWork", function () {
    beforeEach(takenTask);

    it("sends the work for review and starts the review window", async function () {
      await expect(tasks.connect(worker).submitWork(0, LINK, "All done"))
        .to.emit(tasks, "TaskStatusChanged")
        .withArgs(0, Status.Submitted, worker.address);

      const task = await tasks.getTask(0);
      expect(task.status).to.equal(Status.Submitted);
      expect(task.submissionURI).to.equal(LINK);
      expect(task.submissionNote).to.equal("All done");
      expect(task.deadline).to.equal(BigInt(await time.latest()) + BigInt(7 * DAY));
    });

    it("only accepts work from the assignee", async function () {
      await expect(tasks.connect(otherMember).submitWork(0, LINK, "")).to.be.revertedWith(
        "Only the assignee can submit work",
      );
      await expect(tasks.connect(manager).submitWork(0, LINK, "")).to.be.revertedWith(
        "Only the assignee can submit work",
      );
    });

    it("needs a link, and keeps texts short", async function () {
      await expect(tasks.connect(worker).submitWork(0, "", "note")).to.be.revertedWith("The link must not be empty");
      await expect(tasks.connect(worker).submitWork(0, "l".repeat(301), "")).to.be.revertedWith("The link is too long");
      await expect(tasks.connect(worker).submitWork(0, LINK, "n".repeat(301))).to.be.revertedWith(
        "The note is too long",
      );
    });

    it("cannot be sent twice", async function () {
      await tasks.connect(worker).submitWork(0, LINK, "");

      await expect(tasks.connect(worker).submitWork(0, LINK, "")).to.be.revertedWith("The task is not in progress");
    });
  });

  describe("approveWork", function () {
    beforeEach(submittedTask);

    it("pays the assignee right away", async function () {
      const approval = tasks.connect(manager).approveWork(0);

      await expect(approval).to.changeEtherBalances([worker, await tasks.getAddress()], [REWARD, -REWARD]);
      await expect(approval).to.emit(tasks, "TaskStatusChanged").withArgs(0, Status.Completed, manager.address);

      expect((await tasks.getTask(0)).status).to.equal(Status.Completed);
    });

    it("cannot be done by anybody but the creator", async function () {
      for (const signer of [admin, auditor, worker]) {
        await expect(tasks.connect(signer).approveWork(0)).to.be.revertedWith("Only the creator can approve the work");
      }
    });

    it("pays only once", async function () {
      await tasks.connect(manager).approveWork(0);

      await expect(tasks.connect(manager).approveWork(0)).to.be.revertedWith("There is no work to approve");
    });

    it("cannot be done before any work is sent", async function () {
      await createTask();

      await expect(tasks.connect(manager).approveWork(1)).to.be.revertedWith("There is no work to approve");
    });
  });

  describe("rejectWork", function () {
    beforeEach(submittedTask);

    it("sends it back to the assignee with the reason", async function () {
      await tasks.connect(manager).rejectWork(0, "The hero section is missing");

      const task = await tasks.getTask(0);
      expect(task.status).to.equal(Status.Rejected);
      expect(task.rejectionReason).to.equal("The hero section is missing");
      expect(task.deadline).to.equal(BigInt(await time.latest()) + BigInt(30 * DAY));
    });

    it("needs a reason, and only the creator can do it", async function () {
      await expect(tasks.connect(manager).rejectWork(0, "")).to.be.revertedWith("The reason must not be empty");
      await expect(tasks.connect(manager).rejectWork(0, "r".repeat(301))).to.be.revertedWith("The reason is too long");
      await expect(tasks.connect(auditor).rejectWork(0, "no")).to.be.revertedWith(
        "Only the creator can reject the work",
      );
    });

    it("cannot be done once the review window is over", async function () {
      await time.increase(7 * DAY + 1);

      await expect(tasks.connect(manager).rejectWork(0, "too late")).to.be.revertedWith("The review window is over");
    });

    it("lets the assignee fix the work and send it again", async function () {
      await tasks.connect(manager).rejectWork(0, "The hero section is missing");
      await tasks.connect(worker).submitWork(0, LINK + "-v2", "Fixed");

      const task = await tasks.getTask(0);
      expect(task.status).to.equal(Status.Submitted);
      expect(task.rejectionReason).to.equal("");

      await expect(tasks.connect(manager).approveWork(0)).to.changeEtherBalance(worker, REWARD);
    });
  });

  describe("when the creator does not answer", function () {
    beforeEach(submittedTask);

    it("cannot claim the payment before the 7 days", async function () {
      await time.increase(6 * DAY);

      await expect(tasks.connect(outsider).claimPayment(0)).to.be.revertedWith("The creator still has time to review");
    });

    it("pays the assignee after the 7 days, whoever asks", async function () {
      await time.increase(7 * DAY + 1);

      await expect(tasks.connect(outsider).claimPayment(0)).to.changeEtherBalances(
        [worker, await tasks.getAddress()],
        [REWARD, -REWARD],
      );
      expect((await tasks.getTask(0)).status).to.equal(Status.Completed);
    });

    it("does not pay twice", async function () {
      await time.increase(7 * DAY + 1);
      await tasks.claimPayment(0);

      await expect(tasks.claimPayment(0)).to.be.revertedWith("There is no work waiting for review");
    });
  });

  describe("disputes", function () {
    it("can only be opened by the assignee, on a rejected task", async function () {
      await submittedTask();
      await expect(tasks.connect(worker).disputeRejection(0)).to.be.revertedWith("There is no rejection to dispute");

      await tasks.connect(manager).rejectWork(0, "Not what I asked");
      await expect(tasks.connect(manager).disputeRejection(0)).to.be.revertedWith("Only the assignee can dispute");

      await tasks.connect(worker).disputeRejection(0);
      expect((await tasks.getTask(0)).status).to.equal(Status.Disputed);
    });

    it("are won by the assignee when the auditor says so", async function () {
      await disputedTask();

      await expect(tasks.connect(auditor).resolveDispute(0, true)).to.changeEtherBalances(
        [worker, await tasks.getAddress()],
        [REWARD, -REWARD],
      );
      expect((await tasks.getTask(0)).status).to.equal(Status.Completed);
    });

    it("are won by the creator when the auditor says so", async function () {
      await disputedTask();

      await expect(tasks.connect(auditor).resolveDispute(0, false)).to.changeEtherBalances(
        [manager, await tasks.getAddress()],
        [REWARD, -REWARD],
      );
      expect((await tasks.getTask(0)).status).to.equal(Status.Cancelled);
    });

    it("can be resolved by the admin too", async function () {
      await disputedTask();

      await expect(tasks.connect(admin).resolveDispute(0, true)).to.changeEtherBalance(worker, REWARD);
    });

    it("cannot be resolved by anybody else", async function () {
      await disputedTask();

      for (const signer of [outsider, otherMember]) {
        await expect(tasks.connect(signer).resolveDispute(0, true)).to.be.revertedWith(
          "Only auditors or admins can resolve disputes",
        );
      }
    });

    it("cannot be resolved by somebody who is part of the task", async function () {
      // the admin creates the task, so the admin cannot be the judge of its own dispute
      await createTask(admin);
      await tasks.connect(worker).takeTask(0);
      await tasks.connect(worker).submitWork(0, LINK, "");
      await tasks.connect(admin).rejectWork(0, "No");
      await tasks.connect(worker).disputeRejection(0);

      await expect(tasks.connect(admin).resolveDispute(0, false)).to.be.revertedWith("You are part of this task");
      await tasks.connect(auditor).resolveDispute(0, false);
    });

    it("cannot be resolved twice", async function () {
      await disputedTask();
      await tasks.connect(auditor).resolveDispute(0, true);

      await expect(tasks.connect(auditor).resolveDispute(0, true)).to.be.revertedWith("The task is not in dispute");
    });
  });

  describe("taking a task back", function () {
    beforeEach(takenTask);

    it("lets the assignee abandon it, and it opens again with a new 30 days", async function () {
      await time.increase(10 * DAY);
      await tasks.connect(worker).abandonTask(0);

      const task = await tasks.getTask(0);
      expect(task.status).to.equal(Status.Open);
      expect(task.assignee).to.equal(ethers.ZeroAddress);
      expect(task.deadline).to.equal(BigInt(await time.latest()) + BigInt(30 * DAY));

      await tasks.connect(otherMember).takeTask(0);
      expect((await tasks.getTask(0)).assignee).to.equal(otherMember.address);
    });

    it("only lets the assignee abandon it", async function () {
      await expect(tasks.connect(otherMember).abandonTask(0)).to.be.revertedWith(
        "Only the assignee can abandon the task",
      );
    });

    it("does not let the creator unassign while the assignee still has time", async function () {
      await time.increase(29 * DAY);

      await expect(tasks.connect(manager).unassignTask(0)).to.be.revertedWith("The assignee still has time");
    });

    it("lets the creator unassign after the 30 days without work", async function () {
      await time.increase(30 * DAY + 1);
      await tasks.connect(manager).unassignTask(0);

      const task = await tasks.getTask(0);
      expect(task.status).to.equal(Status.Open);
      expect(task.assignee).to.equal(ethers.ZeroAddress);
    });

    it("only lets the creator unassign", async function () {
      await time.increase(30 * DAY + 1);

      await expect(tasks.connect(otherMember).unassignTask(0)).to.be.revertedWith(
        "Only the creator can unassign the task",
      );
    });

    it("clears the previous work when the task opens again", async function () {
      await tasks.connect(worker).submitWork(0, LINK, "note");
      await tasks.connect(manager).rejectWork(0, "reason");
      await tasks.connect(worker).abandonTask(0);

      const task = await tasks.getTask(0);
      expect(task.submissionURI).to.equal("");
      expect(task.submissionNote).to.equal("");
      expect(task.rejectionReason).to.equal("");
    });
  });

  describe("finished tasks", function () {
    it("cannot be used again", async function () {
      await submittedTask();
      await tasks.connect(manager).approveWork(0);

      await expect(tasks.connect(otherMember).takeTask(0)).to.be.revertedWith("The task is not open");
      await expect(tasks.connect(manager).cancelTask(0)).to.be.revertedWith("Only open tasks can be cancelled");
      await expect(tasks.connect(worker).submitWork(0, LINK, "")).to.be.revertedWith("The task is not in progress");
    });

    it("never leave ETH behind in the contract", async function () {
      await createTask(); // 0: paid
      await createTask(); // 1: refunded
      await tasks.connect(worker).takeTask(0);
      await tasks.connect(worker).submitWork(0, LINK, "");
      await tasks.connect(manager).approveWork(0);
      await tasks.connect(manager).cancelTask(1);

      expect(await ethers.provider.getBalance(await tasks.getAddress())).to.equal(0n);
    });
  });
});
