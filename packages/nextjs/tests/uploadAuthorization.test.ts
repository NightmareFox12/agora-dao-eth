import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Address, type Hex, verifyMessage } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { DEFAULT_ADMIN_ROLE, TASK_MANAGER_ROLE } from "~~/constants/roles";
import { detectImageType, sha256Hex } from "~~/lib/files";
import { type ChainReader, authorizeUpload } from "~~/lib/server/uploadAuthorization";
import { buildUploadMessage } from "~~/lib/uploadAuth";

const CHAIN_ID = 31337;
const NOW = 1_800_000_000;
const DAO = "0x00000000000000000000000000000000000000d1" as Address;
const OTHER_DAO = "0x00000000000000000000000000000000000000d2" as Address;
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

const manager = privateKeyToAccount(generatePrivateKey());
const admin = privateKeyToAccount(generatePrivateKey());
const member = privateKeyToAccount(generatePrivateKey());
const stranger = privateKeyToAccount(generatePrivateKey());

// A fake blockchain: one DAO, with a manager, an admin and a member. Signatures are verified for real.
const reader = (chainId = CHAIN_ID): ChainReader => ({
  chainId,
  verifyMessage: ({ address, message, signature }) => verifyMessage({ address, message, signature }),
  isDao: async dao => dao.toLowerCase() === DAO.toLowerCase(),
  hasRole: async (dao, role, user) => {
    if (dao.toLowerCase() !== DAO.toLowerCase()) return false;
    if (role === TASK_MANAGER_ROLE) return user === manager.address;
    if (role === DEFAULT_ADMIN_ROLE) return user === admin.address;
    return false;
  },
});

const signedRequest = async (
  account: typeof manager,
  options: {
    action?: "logo" | "task";
    hashes?: string[];
    dao?: string;
    chainId?: number;
    timestamp?: number;
    // what the request claims, when it differs from what was signed
    claimedHashes?: string[];
  } = {},
) => {
  const { action = "task", hashes = [HASH_A], dao = DAO, chainId = CHAIN_ID, timestamp = NOW } = options;
  const message = buildUploadMessage({ action, hashes, dao: action === "task" ? dao : undefined, chainId, timestamp });
  const signature = await account.signMessage({ message });

  return {
    action,
    address: account.address,
    signature,
    timestamp,
    hashes: options.claimedHashes ?? hashes,
    dao: action === "task" ? dao : undefined,
  };
};

describe("logo uploads", () => {
  it("accept any wallet that signs", async () => {
    const request = await signedRequest(stranger, { action: "logo" });
    assert.deepEqual(await authorizeUpload(request, reader(), NOW), { ok: true });
  });

  it("reject a signature made by another wallet", async () => {
    const request = await signedRequest(stranger, { action: "logo" });
    const result = await authorizeUpload({ ...request, address: member.address }, reader(), NOW);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 401);
  });

  it("reject a file list that is not the one that was signed", async () => {
    const request = await signedRequest(stranger, { action: "logo", hashes: [HASH_A], claimedHashes: [HASH_B] });
    const result = await authorizeUpload(request, reader(), NOW);
    assert.equal(result.ok === false && result.status, 401);
  });

  it("do not care about the order of the files", async () => {
    const request = await signedRequest(stranger, {
      action: "logo",
      hashes: [HASH_B, HASH_A],
      claimedHashes: [HASH_A, HASH_B],
    });
    assert.deepEqual(await authorizeUpload(request, reader(), NOW), { ok: true });
  });
});

describe("freshness and network", () => {
  it("reject an old signature", async () => {
    const request = await signedRequest(stranger, { action: "logo", timestamp: NOW - 11 * 60 });
    const result = await authorizeUpload(request, reader(), NOW);
    assert.equal(result.ok === false && result.status, 401);
  });

  it("accept a signature just inside the window", async () => {
    const request = await signedRequest(stranger, { action: "logo", timestamp: NOW - 9 * 60 });
    assert.deepEqual(await authorizeUpload(request, reader(), NOW), { ok: true });
  });

  it("reject a signature from the future", async () => {
    const request = await signedRequest(stranger, { action: "logo", timestamp: NOW + 11 * 60 });
    const result = await authorizeUpload(request, reader(), NOW);
    assert.equal(result.ok === false && result.status, 401);
  });

  it("reject a signature made for another network", async () => {
    const request = await signedRequest(stranger, { action: "logo", chainId: 1 });
    const result = await authorizeUpload(request, reader(CHAIN_ID), NOW);
    assert.equal(result.ok === false && result.status, 401);
  });
});

describe("task uploads", () => {
  it("accept a task manager of the DAO", async () => {
    assert.deepEqual(await authorizeUpload(await signedRequest(manager), reader(), NOW), { ok: true });
  });

  it("accept an admin of the DAO", async () => {
    assert.deepEqual(await authorizeUpload(await signedRequest(admin), reader(), NOW), { ok: true });
  });

  it("accept the DAO address in any letter case", async () => {
    const request = await signedRequest(manager);
    assert.deepEqual(await authorizeUpload({ ...request, dao: DAO.toUpperCase().replace("0X", "0x") }, reader(), NOW), {
      ok: true,
    });
  });

  it("reject a plain member and a stranger", async () => {
    for (const account of [member, stranger]) {
      const result = await authorizeUpload(await signedRequest(account), reader(), NOW);
      assert.equal(result.ok === false && result.status, 403);
    }
  });

  it("reject an address that is not a DAO of the factory, even if it says the signer has the role", async () => {
    const request = await signedRequest(manager, { dao: OTHER_DAO });
    const result = await authorizeUpload(request, reader(), NOW);
    assert.equal(result.ok === false && result.status, 403);
  });

  it("reject a request without a DAO", async () => {
    const request = await signedRequest(manager);
    const result = await authorizeUpload({ ...request, dao: undefined }, reader(), NOW);
    assert.equal(result.ok === false && result.status, 400);
  });

  it("reject a signature that was made for a different DAO", async () => {
    const request = await signedRequest(manager, { dao: OTHER_DAO });
    const result = await authorizeUpload({ ...request, dao: DAO }, reader(), NOW);
    assert.equal(result.ok === false && result.status, 401);
  });
});

describe("malformed requests", () => {
  it("reject hashes that are not SHA-256", async () => {
    for (const hashes of [["xyz"], ["A".repeat(64)], ["a".repeat(63)], []]) {
      const request = await signedRequest(stranger, { action: "logo", hashes: [HASH_A], claimedHashes: hashes });
      const result = await authorizeUpload(request, reader(), NOW);
      assert.equal(result.ok === false && result.status, 400, JSON.stringify(hashes));
    }
  });

  it("reject too many files at once", async () => {
    const hashes = Array.from({ length: 9 }, (_, i) => i.toString(16).repeat(64).slice(0, 64));
    const request = await signedRequest(stranger, { action: "logo", hashes });
    const result = await authorizeUpload(request, reader(), NOW);
    assert.equal(result.ok === false && result.status, 400);
  });

  it("reject garbage in place of the signature or the address", async () => {
    const request = await signedRequest(stranger, { action: "logo" });
    assert.equal((await authorizeUpload({ ...request, signature: "hello" }, reader(), NOW)).ok, false);
    assert.equal((await authorizeUpload({ ...request, signature: "0x1234" as Hex }, reader(), NOW)).ok, false);
    assert.equal((await authorizeUpload({ ...request, address: "nope" }, reader(), NOW)).ok, false);
    assert.equal((await authorizeUpload({ ...request, timestamp: Number.NaN }, reader(), NOW)).ok, false);
  });
});

describe("file helpers", () => {
  it("hashes like SHA-256", async () => {
    const hash = await sha256Hex(new TextEncoder().encode("abc"));
    assert.equal(hash, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("recognizes PNG and JPG by their content, not by their name", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
    assert.equal(detectImageType(png), "png");
    assert.equal(detectImageType(jpg), "jpg");
  });

  it("rejects everything else: SVG, scripts, empty and truncated files", () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    assert.equal(detectImageType(svg), undefined);
    assert.equal(detectImageType(html), undefined);
    assert.equal(detectImageType(new Uint8Array([])), undefined);
    assert.equal(detectImageType(new Uint8Array([0x89, 0x50, 0x4e])), undefined);
  });
});
