import { Router } from "express";
import type { AdminAuthConfig } from "./config.js";
import {
  createTotpEnrollment,
  generateRecoveryCodes,
  hashOpaqueToken,
  parseEncryptionKey,
  randomOpaqueToken,
  recoveryCodeHash,
  verifyTotp
} from "./crypto.js";
import { evidence } from "./evidence.js";
import { asyncRoute, objectBody, requiredText, sendError } from "./http-helpers.js";
import { AdminAccountModel, AdminMfaResetModel } from "./models.js";

export function createMfaResetRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const encryptionKey = parseEncryptionKey(config.mfaEncryptionKey);

  router.post("/accept", asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const token = requiredText(body.token, 512, false);
    if (!token) return sendError(res, 400, "invalid_request");

    const now = new Date();
    const reset = await AdminMfaResetModel.findOne({
      tokenHash: hashOpaqueToken(token),
      claimedAt: null,
      usedAt: null,
      expiresAt: { $gt: now }
    });
    if (!reset) return sendError(res, 400, "mfa_reset_invalid");

    const account = await AdminAccountModel.findOne({
      _id: reset.accountId,
      role: "collaborator",
      status: "active",
      mfaEnabledAt: null
    });
    if (!account) return sendError(res, 400, "mfa_reset_invalid");

    const enrollment = createTotpEnrollment(account.emailNormalized, config.totpIssuer, encryptionKey);
    const activationToken = randomOpaqueToken();
    const claimed = await AdminMfaResetModel.findOneAndUpdate(
      { _id: reset._id, claimedAt: null, usedAt: null, expiresAt: { $gt: now } },
      {
        $set: {
          claimedAt: now,
          mfaSecretCiphertext: enrollment.encryptedSecret,
          activationTokenHash: hashOpaqueToken(activationToken)
        }
      },
      { new: true }
    );
    if (!claimed) return sendError(res, 409, "mfa_reset_already_claimed");

    res.json({
      activationToken,
      mfa: { secret: enrollment.secret, uri: enrollment.uri }
    });
  }));

  router.post("/activate", asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const activationToken = requiredText(body.activationToken, 512, false);
    const totp = requiredText(body.totp, 16);
    if (!activationToken || !totp) return sendError(res, 400, "invalid_request");

    const now = new Date();
    const reset = await AdminMfaResetModel.findOne({
      activationTokenHash: hashOpaqueToken(activationToken),
      usedAt: null,
      expiresAt: { $gt: now }
    });
    if (!reset?.mfaSecretCiphertext) return sendError(res, 400, "mfa_reset_invalid");
    if (!(await verifyTotp(totp, reset.mfaSecretCiphertext, encryptionKey))) {
      return sendError(res, 401, "mfa_invalid");
    }

    const recoveryCodes = generateRecoveryCodes();
    const account = await AdminAccountModel.findOneAndUpdate(
      {
        _id: reset.accountId,
        role: "collaborator",
        status: "active",
        mfaEnabledAt: null
      },
      {
        $set: {
          mfaSecretCiphertext: reset.mfaSecretCiphertext,
          mfaEnabledAt: now,
          recoveryCodes: recoveryCodes.map((code) => ({
            hash: recoveryCodeHash(code),
            usedAt: null
          }))
        }
      },
      { new: true }
    );
    if (!account) return sendError(res, 409, "mfa_reset_already_completed");

    const consumed = await AdminMfaResetModel.findOneAndUpdate(
      { _id: reset._id, usedAt: null },
      { $set: { usedAt: now } },
      { new: true }
    );
    if (!consumed) return sendError(res, 409, "mfa_reset_already_completed");

    await evidence({
      actor: account,
      action: "mfa.reset_completed",
      targetType: "admin_account",
      targetId: String(account._id)
    });
    res.json({ recoveryCodes });
  }));

  return router;
}
