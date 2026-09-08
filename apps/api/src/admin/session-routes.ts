import { Router } from "express";
import { parseEncryptionKey, verifyPassword, verifyTotp } from "./crypto.js";
import type { AdminAuthConfig } from "./config.js";
import { evidence } from "./evidence.js";
import { asyncRoute, objectBody, objectIdText, requiredText, sendError } from "./http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "./middleware.js";
import { AdminAccountModel, AdminSessionModel } from "./models.js";
import {
  clearSessionCookies,
  getContext,
  publicAccount,
  publicSession,
  rotateSession,
  setSessionCookies
} from "./session.js";

export function createSessionRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);
  const requireCsrf = createRequireCsrf();
  const encryptionKey = parseEncryptionKey(config.mfaEncryptionKey);

  router.get("/", requireAuth(), asyncRoute(async (_req, res) => {
    const context = getContext(res);
    res.json({
      account: publicAccount(context.account),
      session: publicSession(context.session)
    });
  }));

  router.get("/active", requireAuth(), asyncRoute(async (_req, res) => {
    const context = getContext(res);
    const sessions = await AdminSessionModel.find({
      accountId: context.account._id,
      revokedAt: null
    }).sort({ createdAt: -1 });
    res.json({ sessions: sessions.map(publicSession) });
  }));

  router.post("/logout", requireAuth(), requireCsrf, asyncRoute(async (_req, res) => {
    const context = getContext(res);
    await AdminSessionModel.updateOne(
      { _id: context.session._id, tokenHash: context.sessionTokenHash, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "logout" } }
    );
    clearSessionCookies(res, config.secureCookies);
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "session.revoked"
    });
    res.status(204).end();
  }));

  router.delete("/:sessionId", requireAuth(), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const sessionId = objectIdText(req.params.sessionId);
    if (!sessionId) return sendError(res, 400, "invalid_request");

    const revoked = await AdminSessionModel.findOneAndUpdate(
      { _id: sessionId, accountId: context.account._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: "self_revoked" } },
      { new: true }
    );
    if (!revoked) return sendError(res, 404, "session_not_found");
    if (String(revoked._id) === String(context.session._id)) {
      clearSessionCookies(res, config.secureCookies);
    }
    await evidence({
      actor: context.account,
      sessionId: context.session._id,
      action: "session.revoked",
      targetType: "admin_session",
      targetId: String(revoked._id)
    });
    res.status(204).end();
  }));

  router.post("/reauth", requireAuth(), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const body = objectBody(req.body);
    const password = requiredText(body.password, 1024, false);
    const totp = requiredText(body.totp, 16);
    if (!password || !totp) return sendError(res, 400, "invalid_request");

    const account = await AdminAccountModel.findOne({
      _id: context.account._id,
      status: "active"
    });
    if (
      !account ||
      !(await verifyPassword(password, account.passwordHash)) ||
      !(await verifyTotp(totp, account.mfaSecretCiphertext, encryptionKey))
    ) {
      await evidence({
        actor: context.account,
        sessionId: context.session._id,
        action: "reauth.rejected",
        result: "rejected"
      });
      return sendError(res, 401, "invalid_credentials");
    }

    const rotated = await rotateSession(context);
    if (!rotated) return sendError(res, 409, "session_already_rotated");
    setSessionCookies(res, rotated, config.secureCookies);
    await evidence({
      actor: account,
      sessionId: rotated.session._id,
      action: "reauth.completed"
    });
    res.status(204).end();
  }));

  return router;
}
