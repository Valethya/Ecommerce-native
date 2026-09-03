import mongoose from "mongoose";
import request, { type Response, type SuperAgentTest } from "supertest";
import { generate } from "otplib";
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

type ActivatedActor = {
  agent: SuperAgentTest;
  id: string;
  email: string;
  password: string;
  secret: string;
  recoveryCodes: string[];
  csrf: string;
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

describe("F1-C password and persistence primitives", () => {
  it("enforces the canonical minimum and compromised-password checks without arbitrary composition rules", async () => {
    expect(() => assertPasswordPolicy("short")) .toThrow(/12/);
    expect(() => assertPasswordPolicy("password1234")).toThrow(/compromised/);
    expect(() => assertPasswordPolicy("frase larga con espacios ✓")) .not.toThrow();

    const password = "frase larga con espacios ✓";
    const encoded = await hashPassword(password);
    expect(encoded).not.toContain(password);
    expect(await verifyPassword(password, encoded)).toBe(true);
    expect(await verifyPassword("incorrect password", encoded)).toBe(false);
  });

  it("never persists an administrative password in plaintext", async () => {
    await bootstrapOwnerOnly();
    const account = await AdminAccountModel.findOne({ role: "owner" }).lean();
    expect(account).toBeTruthy();
    expect(account.passwordHash).not.toBe(ownerPassword);
    expect(JSON.stringify(account)).not.toContain(ownerPassword);
  });
});

describe("F1-C owner invariant and mandatory MFA", () => {
  it("creates exactly one owner and rejects a second owner", async () => {
    const first = await bootstrapOwnerOnly();
    expect(first.response.status).toBe(201);

    const second = await request(app)
      .post("/admin/auth/bootstrap/owner")
      .set("x-admin-bootstrap-token", config.bootstrapToken)
      .send({ name: "Second Owner", email: "second@example.test", password: ownerPassword });
    expect(second.status).toBe(409);
    expect(await AdminAccountModel.countDocuments({ role: "owner" })).toBe(1);
  });

  it("physically fences concurrent owner creation", async () => {
    const payloads = [
      { name: "Owner One", email: "one@example.test", password: ownerPassword },
      { name: "Owner Two", email: "two@example.test", password: ownerPassword }
    ];
    const responses = await Promise.all(payloads.map((body) =>
      request(app)
        .post("/admin/auth/bootstrap/owner")
        .set("x-admin-bootstrap-token", config.bootstrapToken)
        .send(body)
    ));
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await AdminAccountModel.countDocuments({ role: "owner" })).toBe(1);
  });

  it("requires a valid TOTP before an owner becomes operational", async () => {
    const pending = await bootstrapOwnerOnly();
    const loginBeforeMfa = await request(app)
      .post("/admin/auth/login/password")
      .send({ email: pending.email, password: ownerPassword });
    expect(loginBeforeMfa.status).toBe(401);
    expect(loginBeforeMfa.body.error).toBe("invalid_credentials");

    const wrong = await request(app)
      .post("/admin/auth/bootstrap/owner/activate")
      .set("x-admin-bootstrap-token", config.bootstrapToken)
      .send({ accountId: pending.id, totp: "000000" });
    expect(wrong.status).toBe(401);

    const actor = await activatePendingOwner(pending);
    expect(actor.recoveryCodes).toHaveLength(10);
    const account = await AdminAccountModel.findById(actor.id).lean();
    expect(account.status).toBe("active");
    expect(account.mfaEnabledAt).toBeTruthy();
    expect(account.mfaSecretCiphertext).not.toContain(actor.secret);
    expect(JSON.stringify(account.recoveryCodes)).not.toContain(actor.recoveryCodes[0]);
  });
});

describe("F1-C login, recovery codes, opaque sessions and CSRF", () => {
  it("uses a two-step password plus TOTP login and creates only an opaque server-side session", async () => {
    const owner = await createOwner();
    const wrongPassword = await request(app)
      .post("/admin/auth/login/password")
      .send({ email: owner.email, password: "definitely wrong password" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error).toBe("invalid_credentials");

    const passwordStep = await request(app)
      .post("/admin/auth/login/password")
      .send({ email: owner.email, password: owner.password });
    expect(passwordStep.status).toBe(200);
    expect(passwordStep.body.mfaRequired).toBe(true);
    expect(passwordStep.headers["set-cookie"]).toBeUndefined();

    const invalidFactor = await request(app)
      .post("/admin/auth/login/mfa")
      .send({ challengeToken: passwordStep.body.challengeToken, totp: "000000" });
    expect(invalidFactor.status).toBe(401);

    const secondPasswordStep = await request(app)
      .post("/admin/auth/login/password")
      .send({ email: owner.email, password: owner.password });
    const loggedIn = await request(app)
      .post("/admin/auth/login/mfa")
      .send({
        challengeToken: secondPasswordStep.body.challengeToken,
        totp: await generate({ secret: owner.secret })
      });
    expect(loggedIn.status).toBe(200);
    const cookies = cookieLines(loggedIn);
    expect(cookies.some((line) => line.startsWith("admin_session=") && line.includes("HttpOnly") && line.includes("SameSite=Strict"))).toBe(true);
    expect(cookies.some((line) => line.startsWith("admin_csrf=") && line.includes("SameSite=Strict"))).toBe(true);

    const sessionCookie = cookieValue(loggedIn, "admin_session");
    const stored = await AdminSessionModel.findOne({ accountId: owner.id }).sort({ createdAt: -1 }).lean();
    expect(stored.tokenHash).not.toBe(sessionCookie);
    expect(JSON.stringify(stored)).not.toContain(sessionCookie);
  });

  it("consumes a recovery code once and atomically rejects concurrent reuse", async () => {
    const owner = await createOwner();
    const code = owner.recoveryCodes[0]!;
    const challengeA = await passwordChallenge(owner);
    const challengeB = await passwordChallenge(owner);

    const responses = await Promise.all([
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: challengeA, recoveryCode: code }),
      request(app).post("/admin/auth/login/mfa").send({ challengeToken: challengeB, recoveryCode: code })
    ]);
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);

    const persisted = await AdminAccountModel.findById(owner.id).lean();
    const hash = recoveryCodeHash(code);
    const entry = persisted.recoveryCodes.find((candidate: any) => candidate.hash === hash);
    expect(entry?.usedAt).toBeTruthy();

    const challengeC = await passwordChallenge(owner);
    const reused = await request(app)
      .post("/admin/auth/login/mfa")
      .send({ challengeToken: challengeC, recoveryCode: code });
    expect(reused.status).toBe(401);
  });

  it("expires, revokes and cannot reuse sessions; state-changing requests require CSRF", async () => {
    const owner = await createOwner();
    const session = await owner.agent.get("/admin/session");
    expect(session.status).toBe(200);

    const noCsrf = await owner.agent.post("/admin/session/logout");
    expect(noCsrf.status).toBe(403);
    expect(noCsrf.body.error).toBe("csrf_invalid");

    const rawSessionCookie = `admin_session=${sessionCookieFromAgentResponse(session, owner)}`;
    const logout = await owner.agent
      .post("/admin/session/logout")
      .set("x-csrf-token", owner.csrf);
    expect(logout.status).toBe(204);

    const reused = await request(app).get("/admin/session").set("Cookie", rawSessionCookie);
    expect(reused.status).toBe(401);

    const relogged = await login(owner.email, owner.password, owner.secret);
    await AdminSessionModel.updateOne(
      { accountId: owner.id, revokedAt: null },
      { $set: { lastSeenAt: new Date(Date.now() - 13 * 60 * 60 * 1000) } }
    );
    const expired = await relogged.agent.get("/admin/session");
    expect(expired.status).toBe(401);
  });
});

describe("F1-C invitations and collaborator activation", () => {
  it("rejects invalid and expired invitations and has no public admin registration", async () => {
    const owner = await createOwner();
    const missing = await request(app)
      .post("/admin/auth/invitations/accept")
      .send({ token: "not-a-real-token", password: collaboratorPassword });
    expect(missing.status).toBe(400);

    const invitation = await createInvitation(owner, "expired@example.test", []);
    await AdminInvitationModel.updateOne(
      { _id: invitation.id },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );
    const expired = await request(app)
      .post("/admin/auth/invitations/accept")
      .send({ token: invitation.token, password: collaboratorPassword });
    expect(expired.status).toBe(400);

    expect((await request(app).post("/admin/register").send({})).status).toBe(404);
  });

  it("claims an invitation exactly once under concurrency and requires TOTP to activate", async () => {
    const owner = await createOwner();
    const invitation = await createInvitation(owner, "collab@example.test", ["orders:read"]);
    const claims = await Promise.all([
      request(app).post("/admin/auth/invitations/accept").send({ token: invitation.token, password: collaboratorPassword }),
      request(app).post("/admin/auth/invitations/accept").send({ token: invitation.token, password: collaboratorPassword })
    ]);
    expect(claims.filter((response) => response.status === 200)).toHaveLength(1);
    const claim = claims.find((response) => response.status === 200)!;

    const wrong = await request(app)
      .post("/admin/auth/invitations/activate")
      .send({ activationToken: claim.body.activationToken, totp: "000000" });
    expect(wrong.status).toBe(401);

    const activated = await request(app)
      .post("/admin/auth/invitations/activate")
      .send({
        activationToken: claim.body.activationToken,
        totp: await generate({ secret: claim.body.mfa.secret })
      });
    expect(activated.status).toBe(200);
    expect(activated.body.account.role).toBe("collaborator");
    expect(activated.body.account.permissions).toEqual(["orders:read"]);

    const usedAgain = await request(app)
      .post("/admin/auth/invitations/activate")
      .send({
        activationToken: claim.body.activationToken,
        totp: await generate({ secret: claim.body.mfa.secret })
      });
    expect(usedAgain.status).toBe(400);
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: invitation.id })).toBe(1);
  });
});

describe("F1-C server-side authorization, recent authentication and suspension", () => {
  it("denies missing permissions and prevents collaborator self-elevation", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);
    expect((await collaborator.agent.get("/admin/identity/accounts")).status).toBe(403);

    const manager = await createCollaborator(owner, ["collaborators:manage"]);
    const selfElevation = await manager.agent
      .put(`/admin/identity/accounts/${manager.id}/permissions`)
      .set("x-csrf-token", manager.csrf)
      .send({ permissions: ["collaborators:manage", "audit:read"] });
    expect(selfElevation.status).toBe(403);
    expect(selfElevation.body.error).toBe("self_permission_change_denied");
  });

  it("requires recent authentication for sensitive identity mutations and rotates the session on reauth", async () => {
    const owner = await createOwner();
    const current = await AdminSessionModel.findOne({ accountId: owner.id, revokedAt: null });
    await AdminSessionModel.updateOne(
      { _id: current._id },
      { $set: { reauthenticatedAt: new Date(Date.now() - 16 * 60 * 1000) } }
    );

    const stale = await owner.agent
      .post("/admin/identity/invitations")
      .set("x-csrf-token", owner.csrf)
      .send({ name: "Person", email: "person@example.test", permissions: [] });
    expect(stale.status).toBe(401);
    expect(stale.body.error).toBe("recent_authentication_required");

    const oldHash = current.tokenHash;
    const reauthenticated = await owner.agent
      .post("/admin/session/reauth")
      .set("x-csrf-token", owner.csrf)
      .send({ password: owner.password, totp: await generate({ secret: owner.secret }) });
    expect(reauthenticated.status).toBe(204);
    owner.csrf = cookieValue(reauthenticated, "admin_csrf");
    const rotated = await AdminSessionModel.findById(current._id).lean();
    expect(rotated.tokenHash).not.toBe(oldHash);

    const allowed = await owner.agent
      .post("/admin/identity/invitations")
      .set("x-csrf-token", owner.csrf)
      .send({ name: "Person", email: "person@example.test", permissions: [] });
    expect(allowed.status).toBe(201);
  });

  it("suspends only collaborators, immediately invalidates existing sessions, and blocks new login", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);

    const suspended = await owner.agent
      .post(`/admin/identity/accounts/${collaborator.id}/suspend`)
      .set("x-csrf-token", owner.csrf);
    expect(suspended.status).toBe(200);
    expect((await collaborator.agent.get("/admin/session")).status).toBe(401);

    const loginAttempt = await request(app)
      .post("/admin/auth/login/password")
      .send({ email: collaborator.email, password: collaborator.password });
    expect(loginAttempt.status).toBe(401);
    expect(loginAttempt.body.error).toBe("invalid_credentials");

    const ownerSuspension = await owner.agent
      .post(`/admin/identity/accounts/${owner.id}/suspend`)
      .set("x-csrf-token", owner.csrf);
    expect(ownerSuspension.status).toBe(403);
    expect((await AdminAccountModel.findById(owner.id).lean()).status).toBe("active");
  });

  it("revokes collaborator sessions immediately when permissions change", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);
    const update = await owner.agent
      .put(`/admin/identity/accounts/${collaborator.id}/permissions`)
      .set("x-csrf-token", owner.csrf)
      .send({ permissions: ["orders:read", "inventory:read"] });
    expect(update.status).toBe(200);
    expect((await collaborator.agent.get("/admin/session")).status).toBe(401);
  });
});

describe("F1-C MFA reset and secret hygiene", () => {
  it("resets collaborator MFA through a one-use activation flow and revokes old access", async () => {
    const owner = await createOwner();
    const collaborator = await createCollaborator(owner, ["orders:read"]);
    const reset = await owner.agent
      .post(`/admin/identity/accounts/${collaborator.id}/mfa-reset`)
      .set("x-csrf-token", owner.csrf);
    expect(reset.status).toBe(201);
    expect((await collaborator.agent.get("/admin/session")).status).toBe(401);

    const oldLogin = await request(app)
      .post("/admin/auth/login/password")
      .send({ email: collaborator.email, password: collaborator.password });
    expect(oldLogin.status).toBe(401);

    const accepted = await request(app)
      .post("/admin/auth/mfa-reset/accept")
      .send({ token: reset.body.token });
    expect(accepted.status).toBe(200);
    const activated = await request(app)
      .post("/admin/auth/mfa-reset/activate")
      .send({
        activationToken: accepted.body.activationToken,
        totp: await generate({ secret: accepted.body.mfa.secret })
      });
    expect(activated.status).toBe(200);
    expect(activated.body.recoveryCodes).toHaveLength(10);

    const replay = await request(app)
      .post("/admin/auth/mfa-reset/activate")
      .send({
        activationToken: accepted.body.activationToken,
        totp: await generate({ secret: accepted.body.mfa.secret })
      });
    expect(replay.status).toBe(400);
  });

  it("does not expose password hashes, MFA ciphertext, recovery hashes or reusable session identifiers in general responses", async () => {
    const owner = await createOwner();
    const response = await owner.agent.get("/admin/session");
    expect(response.status).toBe(200);
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("mfaSecretCiphertext");
    expect(serialized).not.toContain("recoveryCodes");
    expect(serialized).not.toContain("tokenHash");
    expect(serialized).not.toContain(owner.password);
    expect(serialized).not.toContain(owner.secret);
    expect(serialized).not.toContain(owner.recoveryCodes[0]!);
  });
});

async function bootstrapOwnerOnly() {
  const response = await request(app)
    .post("/admin/auth/bootstrap/owner")
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

async function activatePendingOwner(pending: Awaited<ReturnType<typeof bootstrapOwnerOnly>>): Promise<ActivatedActor> {
  const agent = request.agent(app);
  const response = await agent
    .post("/admin/auth/bootstrap/owner/activate")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ accountId: pending.id, totp: await generate({ secret: pending.secret }) });
  expect(response.status).toBe(200);
  return {
    agent,
    id: pending.id,
    email: pending.email,
    password: pending.password,
    secret: pending.secret,
    recoveryCodes: response.body.recoveryCodes as string[],
    csrf: cookieValue(response, "admin_csrf")
  };
}

async function createOwner(): Promise<ActivatedActor> {
  return activatePendingOwner(await bootstrapOwnerOnly());
}

async function passwordChallenge(actor: Pick<ActivatedActor, "email" | "password">): Promise<string> {
  const response = await request(app)
    .post("/admin/auth/login/password")
    .send({ email: actor.email, password: actor.password });
  expect(response.status).toBe(200);
  return response.body.challengeToken as string;
}

async function login(email: string, password: string, secret: string): Promise<ActivatedActor> {
  const agent = request.agent(app);
  const passwordStep = await agent.post("/admin/auth/login/password").send({ email, password });
  expect(passwordStep.status).toBe(200);
  const response = await agent.post("/admin/auth/login/mfa").send({
    challengeToken: passwordStep.body.challengeToken,
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
    csrf: cookieValue(response, "admin_csrf")
  };
}

async function createInvitation(owner: ActivatedActor, email: string, permissions: string[]) {
  const response = await owner.agent
    .post("/admin/identity/invitations")
    .set("x-csrf-token", owner.csrf)
    .send({ name: "Collaborator", email, permissions });
  expect(response.status).toBe(201);
  return { id: response.body.invitationId as string, token: response.body.token as string };
}

async function createCollaborator(owner: ActivatedActor, permissions: string[]): Promise<ActivatedActor> {
  const email = `collaborator-${Math.random().toString(16).slice(2)}@example.test`;
  const invitation = await createInvitation(owner, email, permissions);
  const claim = await request(app)
    .post("/admin/auth/invitations/accept")
    .send({ token: invitation.token, password: collaboratorPassword });
  expect(claim.status).toBe(200);
  const agent = request.agent(app);
  const activated = await agent
    .post("/admin/auth/invitations/activate")
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
    csrf: cookieValue(activated, "admin_csrf")
  };
}

function cookieLines(response: Response): string[] {
  const value = response.headers["set-cookie"];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function cookieValue(response: Response, name: string): string {
  const line = cookieLines(response).find((candidate) => candidate.startsWith(`${name}=`));
  if (!line) throw new Error(`Missing ${name} cookie`);
  return decodeURIComponent(line.slice(name.length + 1).split(";", 1)[0]!);
}

function sessionCookieFromAgentResponse(response: Response, actor: ActivatedActor): string {
  const direct = cookieLines(response).find((line) => line.startsWith("admin_session="));
  if (direct) return decodeURIComponent(direct.slice("admin_session=".length).split(";", 1)[0]!);
  const stored = (actor.agent as unknown as { jar?: { getCookie?: Function } }).jar;
  const cookie = stored?.getCookie?.("admin_session", { path: "/admin" });
  if (cookie?.value) return cookie.value as string;
  throw new Error("Unable to recover retained session cookie for replay test");
}
