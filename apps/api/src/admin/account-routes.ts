import { Router } from "express";
import mongoose from "mongoose";
import {
  assertPasswordPolicy,
  hashPassword,
  parseEncryptionKey,
  verifyPassword,
  verifyTotp
} from "./crypto.js";
import type { AdminAuthConfig } from "./config.js";
import { evidence } from "./evidence.js";
import { asyncRoute, objectBody, requiredText, sendError } from "./http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "./middleware.js";
import { AdminAccountModel, AdminSessionModel } from "./models.js";
import { getContext, rotateSession, setSessionCookies } from "./session.js";

class SessionRotationConflict extends Error {}

export function createAccountRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);
  const requireCsrf = createRequireCsrf();
  const encryptionKey = parseEncryptionKey(config.mfaEncryptionKey);

  router.post("/password", requireAuth(), requireCsrf, asyncRoute(async (req, res) => {
    const context = getContext(res);
    const body = objectBody(req.body);
    const currentPassword = requiredText(body.currentPassword, 1024, false);
    const newPassword = requiredText(body.newPassword, 1024, false);
    const totp = requiredText(body.totp, 16);
    if (!currentPassword || !newPassword || !totp) {
      return sendError(res, 400, "invalid_request");
    }

    try {
      assertPasswordPolicy(newPassword);
      const account = await AdminAccountModel.findOne({
        _id: context.account._id,
        status: "active"
      });
      if (
        !account ||
        !(await verifyPassword(currentPassword, account.passwordHash)) ||
        !(await verifyTotp(totp, account.mfaSecretCiphertext, encryptionKey))
      ) {
        return sendError(res, 401, "invalid_credentials");
      }

      const passwordHash = await hashPassword(newPassword);
      const transaction = await mongoose.startSession();
      let rotated: Awaited<ReturnType<typeof rotateSession>> = null;
      try {
        await transaction.withTransaction(async () => {
          const passwordUpdate = await AdminAccountModel.updateOne(
            { _id: account._id, status: "active" },
            { $set: { passwordHash } },
            { session: transaction }
          );
          if (passwordUpdate.matchedCount !== 1) throw new SessionRotationConflict();

          await AdminSessionModel.updateMany(
            {
              accountId: account._id,
              _id: { $ne: context.session._id },
              revokedAt: null
            },
            { $set: { revokedAt: new Date(), revokedReason: "password_changed" } },
            { session: transaction }
          );

          rotated = await rotateSession(context, new Date(), transaction);
          if (!rotated) throw new SessionRotationConflict();
        });
      } finally {
        await transaction.endSession();
      }

      if (!rotated) return sendError(res, 409, "session_already_rotated");
      setSessionCookies(res, rotated, config.secureCookies);
      await evidence({
        actor: account,
        sessionId: rotated.session._id,
        action: "password.changed"
      });
      res.status(204).end();
    } catch (error) {
      if (error instanceof Error && error.name === "PasswordPolicyError") {
        return sendError(res, 400, "password_policy_failed");
      }
      if (error instanceof SessionRotationConflict) {
        return sendError(res, 409, "session_already_rotated");
      }
      throw error;
    }
  }));

  return router;
}
