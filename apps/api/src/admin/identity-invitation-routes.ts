import { Router } from "express";
import type { AdminAuthConfig } from "./config.js";
import { randomOpaqueToken, hashOpaqueToken } from "./crypto.js";
import { evidence } from "./evidence.js";
import { asyncRoute, normalizeEmail, objectBody, requiredText, sendError } from "./http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "./middleware.js";
import { AdminAccountModel, AdminInvitationModel } from "./models.js";
import { hasPermission, normalizePermissions, type AdminPermission } from "./permissions.js";
import { getContext } from "./session.js";
import { invitationExpiresAt } from "./invitation-routes.js";

export function createIdentityInvitationRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);
  const requireCsrf = createRequireCsrf();

  router.post("/", requireAuth("collaborators:manage", true), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const body = objectBody(req.body);
    const name = requiredText(body.name, 120);
    const email = normalizeEmail(requiredText(body.email, 320));
    const requested = Array.isArray(body.permissions) &&
      body.permissions.every((entry) => typeof entry === "string")
      ? body.permissions as string[]
      : null;
    if (!name || !email || !requested) return sendError(res, 400, "invalid_request");

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
    if (await AdminAccountModel.exists({ emailNormalized: email })) {
      return sendError(res, 409, "account_exists");
    }

    const token = randomOpaqueToken();
    const invitation = await AdminInvitationModel.create({
      email,
      emailNormalized: email,
      name,
      permissions,
      tokenHash: hashOpaqueToken(token),
      createdBy: context.account._id,
      expiresAt: invitationExpiresAt()
    });
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "invitation.created",
      targetType: "admin_invitation",
      targetId: String(invitation._id)
    });
    res.status(201).json({
      invitationId: String(invitation._id),
      token,
      expiresAt: invitation.expiresAt
    });
  }));

  return router;
}
