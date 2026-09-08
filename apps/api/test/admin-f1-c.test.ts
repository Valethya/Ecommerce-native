import mongoose from "mongoose";
import { generate } from "otplib";
import request, { type Response } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  assertPasswordPolicy,
  hashPassword,
  recoveryCodeHash,
  verifyPassword
} from "../src/admin/crypto.js";
import { ensureAdminIndexes } from "../src/admin/indexes.js";
import {
  AdminAccountModel,
  AdminInvitationModel,
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
let collaboratorSequence = 0;

type TestAgent = ReturnType<typeof request.agent>;
type Actor = {
  agent: TestAgent;
  id: string;
  email: string;
  password: string;
  secret: string;
  recoveryCodes: string[];
  csrf: string;
  sessionToken: string;
};

beforeAll(async () => {
  await connectDatabase("mongodb://127.0.0.1:27017/ecommerce_native_f1c_test");
  await ensureAdminIndexes();
});

beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
  await ensureAdminIndexes();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe("password credentials", () => {
  it("enforces 12 characters and rejects known compromised values without arbitrary composition rules", async () => {
    expect(() => assertPasswordPolicy("short")).toThrow(/12/);
    expect(() => assertPasswordPolicy("password1234")).toThrow(/compromised/);
    expect(() => assertPasswordPolicy("frase larga con espacios ✓")).not.toThrow();
    const value = "frase larga con espacios ✓";
    const encoded = await hashPassword(value);
    expect(encoded).not.toContain(value);
    expect(await verifyPassword(value, encoded)).toBe(true);
    expect(await verifyPassword("incorrect password", encoded)).toBe(false);
  });

  it("never persists plaintext passwords", async () => {
    await bootstrapOwner();
    const account = await AdminAccountModel.findOne({ role: "owner" }).lean();
    expect(account.passwordHash).not.toBe(ownerPassword);
    expect(JSON.stringify(account)).not.toContain(ownerPassword);
  });
});

describe("single owner and mandatory MFA", () => {
  it("creates one owner and rejects a second", async () => {
    expect((await bootstrapOwner()).response.status).toBe(201);
    const second = await request(app)
      .post("/admin/auth/bootstrap/owner")
      .set("x-admin-bootstrap-token", config.bootstrapToken)
      .send({ name: "Second", email: "second@example.test", password: ownerPassword });
    expect(second.status).toBe(409);
    expect(await AdminAccountModel.countDocuments({ role: "owner" })).toBe(1);
  });

  it("fences concurrent owner creation at the database boundary", async () => {
    const responses = await Promise.all([
      request(app).post("/admin/auth/bootstrap/owner")
        .set("x-admin-bootstrap-token", config.bootstrapToken)
        .send({ name: "One", email: "one@example.test", password: ownerPassword }),
      request(app).post("/admin/auth/bootstrap/owner")
        .set("x-admin-bootstrap-token", config.bootstrapToken)
        .send({ name: "Two", email: "two@example.test", password: ownerPassword })
    ]);
    expect(responses.map((value) => value.status).sort()).toEqual([201, 409]);
    expect(await AdminAccountModel.countDocuments({ role: "owner" })).toBe(1);
  });

  it("keeps a password-only owner non-operational and activates only after valid TOTP", async () => {
    const pending = await bootstrapOwner();
    const login = await request(app).post("/admin/auth/login/password")
      .send({ email: pending.email, password: pending.password });
    expect(login.status).toBe(401);
    expect(login.body.error).toBe("invalid_credentials");

    const wrong = await request(app).post("/admin/auth/bootstrap/owner/activate")
      .set("x-admin-bootstrap-token", config.bootstrapToken)
      .send({ accountId: pending.id, totp: "000000" });
    expect(wrong.status).toBe(401);

    const owner = await activateOwner(pending);
    expect(owner.recoveryCodes).toHaveLength(10);
    const persisted = await AdminAccountModel.findById(owner.id).lean();
    expect(persisted.status).toBe("active");
    expect(persisted.mfaEnabledAt).toBeTruthy();
    expect(persisted.mfaSecretCiphertext).not.toContain(owner.secret);
    expect(JSON.stringify(persisted.recoveryCodes)).not.toContain(owner.recoveryCodes[0]);
  });
});

describe("login, recovery, sessions and CSRF", () => {
  it("requires password plus MFA and stores only a hash of the opaque session identifier", async () => {
    const owner = await createOwner();
    const wrong = await request(app).post("/admin/auth/login/password")
      .send({ email: owner.email, password: "definitely wrong password" });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error).toBe("invalid_credentials");

    const challenge = await passwordChallenge(owner);
    const invalid = await request(app).post("/admin/auth/login/mfa")
      .send({ challengeToken: challenge, totp: "000000" });
    expect(invalid.status).toBe(401);

    const logged = await login(owner.email, owner.password, owner.secret);
    const stored = await AdminSessionModel.findOne({
      accountId: owner.id,
      revokedAt: null,
      tokenHash: { $ne: recoveryCodeHash(owner.sessionToken) }
    }).sort({ createdAt: -1 }).lean();
    expect(logged.sessionToken.length).toBeGreaterThan(30);
    const loggedStored = await AdminSessionModel.findOne({ accountId: owner.id, revokedAt: null })
      .sort({ createdAt: -1 }).lean();
    expect(loggedStored.tokenHash).not.toBe(logged.sessionToken);
    expect(JSON.stringify(loggedStored)).not.toContain(logged.sessionToken);
    expect(stored).toBeTruthy();
  });

  it("consumes a recovery code once under concurrent reuse", async () => {
    const owner = await createOwner();
    const code = owner.recoveryCodes[0]!;
    const [a, b] = await Promise.all([passwordChallenge(owner), passwordChallenge(owner)]);
    const results = await Promise.all([
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: a, recoveryCode: code }),
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: b, recoveryCode: code })
    ]);
    expect(results.filter((result) => result.status === 200)).toHaveLength(1);
    const account = await AdminAccountModel.findById(owner.id).lean();
    const entry = account.recoveryCodes.find((item: any) => item.hash === recoveryCodeHash(code));
    expect(entry.usedAt).toBeTruthy();

    const replay = await request(app).post("/admin/auth/login/mfa")
      .send({ challengeToken: await passwordChallenge(owner), recoveryCode: code });
    expect(replay.status).toBe(401);
  });

  it("requires CSRF, revokes on logout, rejects reuse and enforces idle expiry", async () => {
    const owner = await createOwner();
    expect((await owner.agent.get("/admin/session")).status).toBe(200);
    expect((await owner.agent.post("/admin/session/logout")).status).toBe(403);

    const logout = await owner.agent.post("/admin/session/logout")
      .set("x-csrf-token", owner.csrf);
    expect(logout.status).toBe(204);
    const reused = await request(app).get("/admin/session")
      .set("Cookie", `admin_session=${owner.sessionToken}`);
    expect(reused.status).toBe(401);

    const relogged = await login(owner.email, owner.password, owner.secret);
    await AdminSessionModel.updateOne(
      { tokenHash: { $exists: true }, accountId: owner.id, revokedAt: null },
      { $set: { lastSeenAt: new Date(Date.now() - 13 * 60 * 60 * 1000) } }
    );
    expect((await relogged.agent.get("/admin/session")).status).toBe(401);
  });
});

describe("invitations and activation", () => {
  it("rejects invalid/expired tokens and exposes no public admin registration", async () => {
    const owner = await createOwner();
    expect((await request(app).post("/admin/auth/invitations/accept")
      .send({ token: "invalid", password: collaboratorPassword })).status).toBe(400);

    const invitation = await invite(owner, "expired@example.test", []);
    await AdminInvitationModel.updateOne(
      { _id: invitation.id },
      { $set: { expiresAt: new Date(Date.now() - 1) } }
    );
    expect((await request(app).post("/admin/auth/invitations/accept")
      .send({ token: invitation.token, password: collaboratorPassword })).status).toBe(400);
    expect((await request(app).post("/admin/register").send({})).status).toBe(404);
  });

  it("claims an invitation once under concurrency and consumes it only after valid TOTP", async () => {
    const owner = await createOwner();
    const invitation = await invite(owner, "collab@example.test", ["orders:read"]);
    const claims = await Promise.all([
      request(app).post("/admin/auth/invitations/accept")
        .send({ token: invitation.token, password: collaboratorPassword }),
      request(app).post("/admin/auth/invitations/accept")
        .send({ token: invitation.token, password: collaboratorPassword })
    ]);
    expect(claims.filter((value) => value.status === 200)).toHaveLength(1);
    const claim = claims.find((value) => value.status === 200)!;
    expect((await request(app).post("/admin/auth/invitations/activate")
      .send({ activationToken: claim.body.activationToken, totp: "000000" })).status).toBe(401);

    const activated = await request(app).post("/admin/auth/invitations/activate")
      .send({
        activationToken: claim.body.activationToken,
        totp: await generate({ secret: claim.body.mfa.secret })
      });
    expect(activated.status).toBe(200);
    expect(activated.body.account.role).toBe("collaborator");
    expect(activated.body.account.permissions).toEqual(["orders:read"]);
    expect((await request(app).post("/admin/auth/invitations/activate")
      .send({ activationToken: claim.body.activationToken, totp: await generate({ secret: claim.body.mfa.secret }) })).status).toBe(400);
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: invitation.id })).toBe(1);
  });
});

describe("authorization, recent authentication and suspension", () => {
  it("denies absent permissions and prevents collaborator self-elevation", async () => {
    const owner = await createOwner();
    const reader = await createCollaborator(owner, ["orders:read"]);
    expect((await reader.agent.get("/admin/identity/accounts")).status).toBe(403);

    const manager = await createCollaborator(owner, ["collaborators:manage"]);
    const self = await manager.agent.put(`/admin/identity/accounts/${manager.id}/permissions`)
      .set("x-csrf-token", manager.csrf)
      .send({ permissions: ["collaborators:manage", "audit:read"] });
    expect(self.status).toBe(403);
    expect(self.body.error).toBe("self_permission_change_denied");
  });

  it("requires recent authentication and rotates session material on successful reauth", async () => {
    const owner = await createOwner();
    const session = await AdminSessionModel.findOne({ accountId: owner.id, revokedAt: null });
    await AdminSessionModel.updateOne(
      { _id: session._id },
      { $set: { reauthenticatedAt: new Date(Date.now() - 16 * 60 * 1000) } }
    );
    const stale = await owner.agent.post("/admin/identity/invitations")
      .set("x-csrf-token", owner.csrf)
      .send({ name: "Person", email: "person@example.test", permissions: [] });
    expect(stale.status).toBe(401);
    expect(stale.body.error).toBe("recent_authentication_required");

    const oldTokenHash = session.tokenHash;
    const reauth = await owner.agent.post("/admin/session/reauth")
      .set("x-csrf-token", owner.csrf)
      .send({ password: owner.password, totp: await generate({ secret: owner.secret }) });
    expect(reauth.status).toBe(204);
    owner.csrf = cookieValue(reauth, "admin_csrf");
    owner.sessionToken = cookieValue(reauth, "admin_session");
    expect((await AdminSessionModel.findById(session._id).lean()).tokenHash).not.toBe(oldTokenHash);

    const allowed = await owner.agent.post("/admin/identity/invitations")
      .set("x-csrf-token", owner.csrf)
      .send({ name: "Person", email: "person@example.test", permissions: [] });
    expect(allowed.status).toBe(201);
  });

  it("cannot suspend the owner; suspending a collaborator immediately kills access and login", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);
    const suspended = await owner.agent.post(`/admin/identity/accounts/${collaborator.id}/suspend`)
      .set("x-csrf-token", owner.csrf);
    expect(suspended.status).toBe(200);
    expect((await collaborator.agent.get("/admin/session")).status).toBe(401);
    const login = await request(app).post("/admin/auth/login/password")
      .send({ email: collaborator.email, password: collaborator.password });
    expect(login.status).toBe(401);

    const ownerAttempt = await owner.agent.post(`/admin/identity/accounts/${owner.id}/suspend`)
      .set("x-csrf-token", owner.csrf);
    expect(ownerAttempt.status).toBe(403);
    expect((await AdminAccountModel.findById(owner.id).lean()).status).toBe("active");
  });

  it("invalidates collaborator sessions when permissions change", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);
    const changed = await owner.agent.put(`/admin/identity/accounts/${collaborator.id}/permissions`)
      .set("x-csrf-token", owner.csrf)
      .send({ permissions: ["orders:read", "inventory:read"] });
    expect(changed.status).toBe(200);
    expect((await collaborator.agent.get("/admin/session")).status).toBe(401);
  });
});

describe("MFA reset and response hygiene", () => {
  it("revokes old collaborator MFA access and activates a fresh TOTP factor once", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);
    const reset = await owner.agent.post(`/admin/identity/accounts/${collaborator.id}/mfa-reset`)
      .set("x-csrf-token", owner.csrf);
    expect(reset.status).toBe(201);
    expect((await collaborator.agent.get("/admin/session")).status).toBe(401);
    expect((await request(app).post("/admin/auth/login/password")
      .send({ email: collaborator.email, password: collaborator.password })).status).toBe(401);

    const accepted = await request(app).post("/admin/auth/mfa-reset/accept")
      .send({ token: reset.body.token });
    expect(accepted.status).toBe(200);
    const activated = await request(app).post("/admin/auth/mfa-reset/activate")
      .send({
        activationToken: accepted.body.activationToken,
        totp: await generate({ secret: accepted.body.mfa.secret })
      });
    expect(activated.status).toBe(200);
    expect(activated.body.recoveryCodes).toHaveLength(10);
    expect((await request(app).post("/admin/auth/mfa-reset/activate")
      .send({ activationToken: accepted.body.activationToken, totp: await generate({ secret: accepted.body.mfa.secret }) })).status).toBe(400);
  });

  it("keeps reusable secrets out of general session responses", async () => {
    const owner = await createOwner();
    const response = await owner.agent.get("/admin/session");
    const text = JSON.stringify(response.body);
    for (const forbidden of [
      "passwordHash",
      "mfaSecretCiphertext",
      "recoveryCodes",
      "tokenHash",
      owner.password,
      owner.secret,
      owner.recoveryCodes[0]!
    ]) expect(text).not.toContain(forbidden);
  });
});

async function bootstrapOwner() {
  const response = await request(app).post("/admin/auth/bootstrap/owner")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ name: "Owner", email: "owner@example.test", password: ownerPassword });
  return {
    response,
    id: response.body.accountId as string,
    email: "owner@example.test",
    password: ownerPassword,
    secret: response.body.mfa?.secret as string
  };
}

async function activateOwner(pending: Awaited<ReturnType<typeof bootstrapOwner>>): Promise<Actor> {
  const agent = request.agent(app);
  const response = await agent.post("/admin/auth/bootstrap/owner/activate")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ accountId: pending.id, totp: await generate({ secret: pending.secret }) });
  expect(response.status).toBe(200);
  return {
    agent,
    id: pending.id,
    email: pending.email,
    password: pending.password,
    secret: pending.secret,
    recoveryCodes: response.body.recoveryCodes,
    csrf: cookieValue(response, "admin_csrf"),
    sessionToken: cookieValue(response, "admin_session")
  };
}

async function createOwner(): Promise<Actor> {
  return activateOwner(await bootstrapOwner());
}

async function passwordChallenge(actor: Pick<Actor, "email" | "password">): Promise<string> {
  const response = await request(app).post("/admin/auth/login/password")
    .send({ email: actor.email, password: actor.password });
  expect(response.status).toBe(200);
  return response.body.challengeToken as string;
}

async function login(email: string, password: string, secret: string): Promise<Actor> {
  const agent = request.agent(app);
  const challenge = await agent.post("/admin/auth/login/password").send({ email, password });
  expect(challenge.status).toBe(200);
  const response = await agent.post("/admin/auth/login/mfa").send({
    challengeToken: challenge.body.challengeToken,
    totp: await generate({ secret })
  });
  expect(response.status).toBe(200);
  return {
    agent,
    id: response.body.account.id,
    email,
    password,
    secret,
    recoveryCodes: [],
    csrf: cookieValue(response, "admin_csrf"),
    sessionToken: cookieValue(response, "admin_session")
  };
}

async function invite(owner: Actor, email: string, permissions: string[]) {
  const response = await owner.agent.post("/admin/identity/invitations")
    .set("x-csrf-token", owner.csrf)
    .send({ name: "Collaborator", email, permissions });
  expect(response.status).toBe(201);
  return { id: response.body.invitationId as string, token: response.body.token as string };
}

async function createCollaborator(owner: Actor, permissions: string[]): Promise<Actor> {
  collaboratorSequence += 1;
  const email = `collaborator-${collaboratorSequence}@example.test`;
  const invitation = await invite(owner, email, permissions);
  const claim = await request(app).post("/admin/auth/invitations/accept")
    .send({ token: invitation.token, password: collaboratorPassword });
  expect(claim.status).toBe(200);
  const agent = request.agent(app);
  const activated = await agent.post("/admin/auth/invitations/activate")
    .send({
      activationToken: claim.body.activationToken,
      totp: await generate({ secret: claim.body.mfa.secret })
    });
  expect(activated.status).toBe(200);
  return {
    agent,
    id: activated.body.account.id,
    email,
    password: collaboratorPassword,
    secret: claim.body.mfa.secret,
    recoveryCodes: activated.body.recoveryCodes,
    csrf: cookieValue(activated, "admin_csrf"),
    sessionToken: cookieValue(activated, "admin_session")
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
