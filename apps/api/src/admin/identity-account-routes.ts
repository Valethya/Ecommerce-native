import { Router } from "express";
import type { AdminAuthConfig } from "./config.js";
import { hashOpaqueToken, randomOpaqueToken } from "./crypto.js";
import { evidence } from "./evidence.js";
import { asyncRoute, objectBody, objectIdText, sendError } from "./http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "./middleware.js";
import { AdminAccountModel, AdminMfaResetModel, AdminSessionModel } from "./models.js";
import { hasPermission, normalizePermissions, type AdminPermission } from "./permissions.js";
import { getContext, publicAccount } from "./session.js";

const MFA_RESET_TTL_MS = 60 * 60 * 1000;

export function createIdentityAccountRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);
  const requireCsrf = createRequireCsrf();

  router.get("/", requireAuth("collaborators:manage"), asyncRoute(async (_req, res) => {
    const accounts = await AdminAccountModel.find({}).sort({ role: 1, createdAt: 1 });
    res.json({ accounts: accounts.map(publicAccount) });
  }));

  router.put("/:accountId/permissions", requireAuth("collaborators:manage", true), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const accountId = objectIdText(req.params.accountId);
    const body = objectBody(req.body);
    const requested = Array.isArray(body.permissions) &&
      body.permissions.every((entry) => typeof entry === "string")
      ? body.permissions as string[]
      : null;
    if (!accountId || !requested) return sendError(res, 400, "invalid_request");
    if (String(context.account._id) === accountId) {
      return sendError(res, 403, "self_permission_change_denied");
    }

    let permissions: AdminPermission[];
    try {
      permissions = normalizePermissions(requested);
    } catch {
      return sendError(res, 400, "invalid_permissions");
    }
    if (
      context.account.role !== "owner" &&
      !permissions.every((permission) =>
        hasPermission(context.account.role, context.account.permissions, permission)
      )
    ) {
      return sendError(res, 403, "permission_escalation_denied");
    }

    const target = await AdminAccountModel.findOneAndUpdate(
      { _id: accountId, role: "collaborator", status: { $ne: "suspended" } },
      { $set: { permissions } },
      { new: true }
    );
    if (!target) return sendError(res, 404, "collaborator_not_found");

    await AdminSessionModel.updateMany(
      { accountId: target._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "permissions_changed" } }
    );
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "permissions.changed",
      targetType: "admin_account",
      targetId: String(target._id),
      metadata: { permissions }
    });
    res.json({ account: publicAccount(target) });
  }));

  router.post("/:accountId/suspend", requireAuth("collaborators:manage", true), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const accountId = objectIdText(req.params.accountId);
    if (!accountId) return sendError(res, 400, "invalid_request");
    if (String(context.account._id) === accountId) {
      return sendError(res, 403, "self_suspension_denied");
    }

    const target = await AdminAccountModel.findOneAndUpdate(
      { _id: accountId, role: "collaborator", status: { $ne: "suspended" } },
      {
        $set: {
          status: "suspended",
          suspendedAt: new Date(),
          suspendedBy: context.account._id
        }
      },
      { new: true }
    );
    if (!target) return sendError(res, 404, "collaborator_not_found");

    await AdminSessionModel.updateMany(
      { accountId: target._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "account_suspended" } }
    );
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "account.suspended",
      targetType: "admin_account",
      targetId: String(target._id)
    });
    res.json({ account: publicAccount(target) });
  }));

  router.post("/:accountId/revoke-sessions", requireAuth("collaborators:manage", true), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const accountId = objectIdText(req.params.accountId);
    if (!accountId) return sendError(res, 400, "invalid_request");

    const target = await AdminAccountModel.findOne({ _id: accountId, role: "collaborator" });
    if (!target) return sendError(res, 404, "collaborator_not_found");
    await AdminSessionModel.updateMany(
      { accountId: target._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "manager_revoked" } }
    );
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "sessions.revoked",
      targetType: "admin_account",
      targetId: String(target._id)
    });
    res.status(204).end();
  }));

  router.post("/:accountId/mfa-reset", requireAuth("collaborators:manage", true), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const accountId = objectIdText(req.params.accountId);
    if (!accountId) return sendError(res, 400, "invalid_request");

    const target = await AdminAccountModel.findOneAndUpdate(
      { _id: accountId, role: "collaborator", status: "active" },
      { $set: { mfaEnabledAt: null, recoveryCodes: [] } },
      { new: true }
    );
    if (!target) return sendError(res, 404, "collaborator_not_found");

    const now = new Date();
    await AdminSessionModel.updateMany(
      { accountId: target._id, revokedAt: null },
      { $set: { revokedAt: now, revokedReason: "mfa_reset" } }
    );
    await AdminMfaResetModel.deleteMany({ accountId: target._id, usedAt: null });
    const token = randomOpaqueToken();
    const reset = await AdminMfaResetModel.create({
      accountId: target._id,
      createdBy: context.account._id,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(now.getTime() + MFA_RESET_TTL_MS)
    });
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "mfa.reset_started",
      targetType: "admin_account",
      targetId: String(target._id)
    });
    res.status(201).json({ resetId: String(reset._id), token, expiresAt: reset.expiresAt });
  }));

  return router;
}
