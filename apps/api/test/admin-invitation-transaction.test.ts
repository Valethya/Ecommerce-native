import mongoose from "mongoose";
import { generate } from "otplib";
import request, { type Response } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ensureAdminIndexes } from "../src/admin/indexes.js";
import { AdminAccountModel, AdminInvitationModel } from "../src/admin/models.js";
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

type Owner = {
  agent: ReturnType<typeof request.agent>;
  id: string;
  csrf: string;
};

type ClaimedInvitation = {
  id: string;
  activationToken: string;
  mfaSecret: string;
};

beforeAll(async () => {
  await connectDatabase("mongodb://127.0.0.1:27017/ecommerce_native_f1c_invitation_tx_test?replicaSet=rs0");
  await ensureAdminIndexes();
});

beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
  await ensureAdminIndexes();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe("administrative invitation activation transaction", () => {
  it("commits the account and invitation consumption together and rejects a later retry", async () => {
    const owner = await createOwner();
    const claimed = await createClaimedInvitation(owner, "atomic-success@example.test");
    const totp = await generate({ secret: claimed.mfaSecret });

    const activated = await request(app).post("/admin/auth/invitations/activate")
      .send({ activationToken: claimed.activationToken, totp });
    expect(activated.status).toBe(200);

    const persistedInvitation = await AdminInvitationModel.findById(claimed.id).lean();
    expect(persistedInvitation.usedAt).toBeTruthy();
    const accounts = await AdminAccountModel.find({ sourceInvitationId: claimed.id }).lean();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].status).toBe("active");

    const retry = await request(app).post("/admin/auth/invitations/activate")
      .send({ activationToken: claimed.activationToken, totp });
    expect(retry.status).toBe(400);
    expect(retry.body.error).toBe("activation_invalid");
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: claimed.id })).toBe(1);
  });

  it("rolls back invitation consumption when account creation fails", async () => {
    const owner = await createOwner();
    const claimed = await createClaimedInvitation(owner, "atomic-rollback@example.test");
    const totp = await generate({ secret: claimed.mfaSecret });
    const createSpy = vi.spyOn(AdminAccountModel, "create")
      .mockRejectedValueOnce(new Error("forced account creation failure"));

    let failed: Response;
    try {
      failed = await request(app).post("/admin/auth/invitations/activate")
        .send({ activationToken: claimed.activationToken, totp });
    } finally {
      createSpy.mockRestore();
    }
    expect(failed!.status).toBe(500);

    const rolledBackInvitation = await AdminInvitationModel.findById(claimed.id).lean();
    expect(rolledBackInvitation.usedAt).toBeNull();
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: claimed.id })).toBe(0);

    const retry = await request(app).post("/admin/auth/invitations/activate")
      .send({ activationToken: claimed.activationToken, totp: await generate({ secret: claimed.mfaSecret }) });
    expect(retry.status).toBe(200);
    expect((await AdminInvitationModel.findById(claimed.id).lean()).usedAt).toBeTruthy();
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: claimed.id })).toBe(1);
  });

  it("allows exactly one of two concurrent activation requests to consume the invitation", async () => {
    const owner = await createOwner();
    const claimed = await createClaimedInvitation(owner, "atomic-race@example.test");
    const totp = await generate({ secret: claimed.mfaSecret });

    const responses = await Promise.all([
      request(app).post("/admin/auth/invitations/activate")
        .send({ activationToken: claimed.activationToken, totp }),
      request(app).post("/admin/auth/invitations/activate")
        .send({ activationToken: claimed.activationToken, totp })
    ]);

    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 400)).toHaveLength(1);
    expect(responses.find((response) => response.status === 400)?.body.error).toBe("activation_invalid");
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: claimed.id })).toBe(1);

    const persistedInvitation = await AdminInvitationModel.findById(claimed.id).lean();
    expect(persistedInvitation.usedAt).toBeTruthy();

    const replay = await request(app).post("/admin/auth/invitations/activate")
      .send({ activationToken: claimed.activationToken, totp });
    expect(replay.status).toBe(400);
    expect(await AdminAccountModel.countDocuments({ sourceInvitationId: claimed.id })).toBe(1);
  });
});

async function createOwner(): Promise<Owner> {
  const pending = await request(app).post("/admin/auth/bootstrap/owner")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ name: "Owner", email: "owner@example.test", password: ownerPassword });
  expect(pending.status).toBe(201);

  const agent = request.agent(app);
  const activated = await agent.post("/admin/auth/bootstrap/owner/activate")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({
      accountId: pending.body.accountId,
      totp: await generate({ secret: pending.body.mfa.secret })
    });
  expect(activated.status).toBe(200);

  return {
    agent,
    id: pending.body.accountId as string,
    csrf: cookieValue(activated, "admin_csrf")
  };
}

async function createClaimedInvitation(owner: Owner, email: string): Promise<ClaimedInvitation> {
  const invitation = await owner.agent.post("/admin/identity/invitations")
    .set("x-csrf-token", owner.csrf)
    .send({ name: "Collaborator", email, permissions: ["orders:read"] });
  expect(invitation.status).toBe(201);

  const claim = await request(app).post("/admin/auth/invitations/accept")
    .send({ token: invitation.body.token, password: collaboratorPassword });
  expect(claim.status).toBe(200);

  return {
    id: invitation.body.invitationId as string,
    activationToken: claim.body.activationToken as string,
    mfaSecret: claim.body.mfa.secret as string
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
