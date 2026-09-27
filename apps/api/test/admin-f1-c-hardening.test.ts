import mongoose from "mongoose";
import { generate } from "otplib";
import request, { type Response } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { hashOpaqueToken, recoveryCodeHash, verifyPassword } from "../src/admin/crypto.js";
import { ensureAdminIndexes } from "../src/admin/indexes.js";
import {
  AdminAccountModel,
  AdminLoginChallengeModel,
  AdminLoginThrottleModel,
  AdminSessionModel
} from "../src/admin/models.js";
import { connectDatabase, disconnectDatabase } from "../src/db/mongoose.js";

const config = {
  bootstrapToken: "test-bootstrap-token-that-is-long-enough",
  mfaEncryptionKey: Buffer.alloc(32, 7).toString("base64"),
  totpIssuer: "Ecommerce Native Test",
  secureCookies: false
};
const app = createApp({ adminAuth: config });
const ownerPassword = "owner password 123";
const collaboratorPassword = "collaborator password 123";
let sequence = 0;

type Actor = {
  agent: ReturnType<typeof request.agent>;
  id: string;
  email: string;
  password: string;
  secret: string;
  recoveryCodes: string[];
  csrf: string;
  sessionToken: string;
};

beforeAll(async () => {
  await connectDatabase("mongodb://127.0.0.1:27017/ecommerce_native_f1c_hardening_test?replicaSet=rs0");
  await ensureAdminIndexes();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await mongoose.connection.db!.dropDatabase();
  await ensureAdminIndexes();
});

afterAll(async () => {
  vi.restoreAllMocks();
  await disconnectDatabase();
});

describe("owner-only identity authority", () => {
  it("denies owner-reserved mutations to a collaborator with collaborators:manage", async () => {
    const owner = await createOwner();
    const target = await createCollaborator(owner, ["orders:read"]);
    const manager = await createCollaborator(owner, ["collaborators:manage"]);

    const attempts = await Promise.all([
      manager.agent.put(`/admin/identity/accounts/${target.id}/permissions`)
        .set("x-csrf-token", manager.csrf)
        .send({ permissions: ["orders:read", "inventory:read"] }),
      manager.agent.post(`/admin/identity/accounts/${target.id}/suspend`)
        .set("x-csrf-token", manager.csrf),
      manager.agent.post(`/admin/identity/accounts/${target.id}/revoke-sessions`)
        .set("x-csrf-token", manager.csrf),
      manager.agent.post(`/admin/identity/accounts/${target.id}/mfa-reset`)
        .set("x-csrf-token", manager.csrf)
    ]);

    for (const response of attempts) {
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("owner_required");
    }
    expect((await target.agent.get("/admin/session")).status).toBe(200);
  });

  it("keeps CSRF and recent reauthentication enforced for owner mutations", async () => {
    const owner = await createOwner();
    const target = await createCollaborator(owner, ["orders:read"]);

    expect((await owner.agent.post(`/admin/identity/accounts/${target.id}/suspend`)).status).toBe(403);

    const ownerSession = await AdminSessionModel.findOne({ accountId: owner.id, revokedAt: null });
    await AdminSessionModel.updateOne(
      { _id: ownerSession._id },
      { $set: { reauthenticatedAt: new Date(Date.now() - 16 * 60 * 1000) } }
    );
    const stale = await owner.agent.put(`/admin/identity/accounts/${target.id}/permissions`)
      .set("x-csrf-token", owner.csrf)
      .send({ permissions: ["orders:read", "inventory:read"] });
    expect(stale.status).toBe(401);
    expect(stale.body.error).toBe("recent_authentication_required");
  });
});

describe("progressive authentication throttling", () => {
  it("does not lose password failures under concurrency and activates blocking", async () => {
    const owner = await createOwner();
    const failures = await Promise.all(
      Array.from({ length: 4 }, () => request(app).post("/admin/auth/login/password")
        .send({ email: owner.email, password: "wrong password value" }))
    );
    expect(failures.every((response) => response.status === 401)).toBe(true);

    const concurrentThrottle = await AdminLoginThrottleModel.findOne({}).lean();
    expect(concurrentThrottle.failures).toBe(4);

    const thresholdFailure = await request(app).post("/admin/auth/login/password")
      .send({ email: owner.email, password: "wrong password value" });
    expect(thresholdFailure.status).toBe(401);

    const throttle = await AdminLoginThrottleModel.findOne({}).lean();
    expect(throttle.failures).toBe(5);
    expect(throttle.blockedUntil).toBeTruthy();

    const blocked = await request(app).post("/admin/auth/login/password")
      .send({ email: owner.email, password: owner.password });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("authentication_temporarily_limited");
  });

  it("progressively limits MFA failures and exhausts the challenge", async () => {
    const owner = await createOwner();
    const token = await passwordChallenge(owner);
    const tokenHash = hashOpaqueToken(token);

    const first = await request(app).post("/admin/auth/login/mfa")
      .send({ challengeToken: token, totp: "000000" });
    expect(first.status).toBe(401);

    const immediatelyBlocked = await request(app).post("/admin/auth/login/mfa")
      .send({ challengeToken: token, totp: await generate({ secret: owner.secret }) });
    expect(immediatelyBlocked.status).toBe(429);

    for (let expectedFailures = 2; expectedFailures <= 5; expectedFailures += 1) {
      await AdminLoginChallengeModel.updateOne({ tokenHash }, { $set: { blockedUntil: null } });
      const response = await request(app).post("/admin/auth/login/mfa")
        .send({ challengeToken: token, totp: "000000" });
      if (expectedFailures < 5) expect(response.status).toBe(401);
      else expect(response.status).toBe(429);
    }

    const exhausted = await AdminLoginChallengeModel.findOne({ tokenHash }).lean();
    expect(exhausted.failures).toBe(5);
    expect(exhausted.usedAt).toBeTruthy();

    const replay = await request(app).post("/admin/auth/login/mfa")
      .send({ challengeToken: token, totp: await generate({ secret: owner.secret }) });
    expect(replay.status).toBe(401);
    expect(replay.body.error).toBe("login_challenge_invalid");
  });

  it("allows exactly one successful MFA authentication for one challenge", async () => {
    const owner = await createOwner();
    const token = await passwordChallenge(owner);
    const totp = await generate({ secret: owner.secret });
    const results = await Promise.all([
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: token, totp }),
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: token, totp })
    ]);
    expect(results.filter((response) => response.status === 200)).toHaveLength(1);
  });

  it("keeps recovery codes single-use under concurrent challenges", async () => {
    const owner = await createOwner();
    const code = owner.recoveryCodes[0]!;
    const a = await passwordChallenge(owner);
    const b = await passwordChallenge(owner);
    const results = await Promise.all([
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: a, recoveryCode: code }),
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: b, recoveryCode: code })
    ]);
    expect(results.filter((response) => response.status === 200)).toHaveLength(1);
    const account = await AdminAccountModel.findById(owner.id).lean();
    const entry = account.recoveryCodes.find((item: any) => item.hash === recoveryCodeHash(code));
    expect(entry.usedAt).toBeTruthy();
  });
});

describe("atomic password change", () => {
  it("updates password, revokes other sessions and rotates the current session atomically", async () => {
    const owner = await createOwner();
    const other = await login(owner.email, owner.password, owner.secret);
    const oldCurrentToken = owner.sessionToken;
    const newPassword = "owner replacement password 456";

    const changed = await owner.agent.post("/admin/account/password")
      .set("x-csrf-token", owner.csrf)
      .send({
        currentPassword: owner.password,
        newPassword,
        totp: await generate({ secret: owner.secret })
      });
    expect(changed.status).toBe(204);
    owner.csrf = cookieValue(changed, "admin_csrf");
    owner.sessionToken = cookieValue(changed, "admin_session");

    const account = await AdminAccountModel.findById(owner.id).lean();
    expect(await verifyPassword(newPassword, account.passwordHash)).toBe(true);
    expect((await other.agent.get("/admin/session")).status).toBe(401);
    expect((await request(app).get("/admin/session").set("Cookie", `admin_session=${oldCurrentToken}`)).status).toBe(401);
    expect((await owner.agent.get("/admin/session")).status).toBe(200);
    expect(await AdminSessionModel.countDocuments({ accountId: owner.id, revokedAt: null })).toBe(1);
  });

  it("rolls back password and session changes when a transactional session revocation fails", async () => {
    const owner = await createOwner();
    const other = await login(owner.email, owner.password, owner.secret);
    const original = await AdminAccountModel.findById(owner.id).lean();
    const originalSessions = await AdminSessionModel.find({ accountId: owner.id }).sort({ _id: 1 }).lean();
    const realUpdateMany = AdminSessionModel.updateMany.bind(AdminSessionModel);
    vi.spyOn(AdminSessionModel, "updateMany").mockImplementationOnce(async (...args: any[]) => {
      await realUpdateMany(...args);
      throw new Error("induced transactional failure");
    });

    const changed = await owner.agent.post("/admin/account/password")
      .set("x-csrf-token", owner.csrf)
      .send({
        currentPassword: owner.password,
        newPassword: "owner rollback password 789",
        totp: await generate({ secret: owner.secret })
      });
    expect(changed.status).toBe(500);
    vi.restoreAllMocks();

    const after = await AdminAccountModel.findById(owner.id).lean();
    const sessionsAfter = await AdminSessionModel.find({ accountId: owner.id }).sort({ _id: 1 }).lean();
    expect(after.passwordHash).toBe(original.passwordHash);
    expect(sessionsAfter.map((session: any) => ({ tokenHash: session.tokenHash, revokedAt: session.revokedAt })))
      .toEqual(originalSessions.map((session: any) => ({ tokenHash: session.tokenHash, revokedAt: session.revokedAt })));
    expect((await owner.agent.get("/admin/session")).status).toBe(200);
    expect((await other.agent.get("/admin/session")).status).toBe(200);
  });

  it("does not create two valid successor sessions under concurrent retries", async () => {
    const owner = await createOwner();
    const newPassword = "owner concurrent password 987";
    const totp = await generate({ secret: owner.secret });
    const mutate = () => request(app).post("/admin/account/password")
      .set("Cookie", `admin_session=${owner.sessionToken}; admin_csrf=${owner.csrf}`)
      .set("x-csrf-token", owner.csrf)
      .send({ currentPassword: owner.password, newPassword, totp });

    const results = await Promise.all([mutate(), mutate()]);
    expect(results.filter((response) => response.status === 204)).toHaveLength(1);
    expect(results.filter((response) => [401, 409].includes(response.status))).toHaveLength(1);
    expect(await AdminSessionModel.countDocuments({ accountId: owner.id, revokedAt: null })).toBe(1);
  });
});

async function createOwner(): Promise<Actor> {
  const bootstrap = await request(app).post("/admin/auth/bootstrap/owner")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ name: "Owner", email: "owner@example.test", password: ownerPassword });
  expect(bootstrap.status).toBe(201);
  const agent = request.agent(app);
  const activated = await agent.post("/admin/auth/bootstrap/owner/activate")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ accountId: bootstrap.body.accountId, totp: await generate({ secret: bootstrap.body.mfa.secret }) });
  expect(activated.status).toBe(200);
  return {
    agent,
    id: bootstrap.body.accountId,
    email: "owner@example.test",
    password: ownerPassword,
    secret: bootstrap.body.mfa.secret,
    recoveryCodes: activated.body.recoveryCodes,
    csrf: cookieValue(activated, "admin_csrf"),
    sessionToken: cookieValue(activated, "admin_session")
  };
}

async function passwordChallenge(actor: Pick<Actor, "email" | "password">): Promise<string> {
  const response = await request(app).post("/admin/auth/login/password")
    .send({ email: actor.email, password: actor.password });
  expect(response.status).toBe(200);
  return response.body.challengeToken;
}

async function login(email: string, password: string, secret: string): Promise<Actor> {
  const agent = request.agent(app);
  const challenge = await agent.post("/admin/auth/login/password").send({ email, password });
  expect(challenge.status).toBe(200);
  const authenticated = await agent.post("/admin/auth/login/mfa").send({
    challengeToken: challenge.body.challengeToken,
    totp: await generate({ secret })
  });
  expect(authenticated.status).toBe(200);
  return {
    agent,
    id: authenticated.body.account.id,
    email,
    password,
    secret,
    recoveryCodes: [],
    csrf: cookieValue(authenticated, "admin_csrf"),
    sessionToken: cookieValue(authenticated, "admin_session")
  };
}

async function createCollaborator(owner: Actor, permissions: string[]): Promise<Actor> {
  sequence += 1;
  const email = `hardening-collaborator-${sequence}@example.test`;
  const invited = await owner.agent.post("/admin/identity/invitations")
    .set("x-csrf-token", owner.csrf)
    .send({ name: "Collaborator", email, permissions });
  expect(invited.status).toBe(201);
  const claim = await request(app).post("/admin/auth/invitations/accept")
    .send({ token: invited.body.token, password: collaboratorPassword });
  expect(claim.status).toBe(200);
  const activated = await request(app).post("/admin/auth/invitations/activate").send({
    activationToken: claim.body.activationToken,
    totp: await generate({ secret: claim.body.mfa.secret })
  });
  expect(activated.status).toBe(200);
  const authenticated = await login(email, collaboratorPassword, claim.body.mfa.secret);
  return {
    ...authenticated,
    recoveryCodes: activated.body.recoveryCodes
  };
}

function cookieLines(response: Response): string[] {
  const value = response.headers["set-cookie"];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function cookieValue(response: Response, name: string): string {
  const line = cookieLines(response).find((value) => value.startsWith(`${name}=`));
  if (!line) throw new Error(`Missing ${name} cookie`);
  return decodeURIComponent(line.slice(name.length + 1).split(";", 1)[0]!);
}
