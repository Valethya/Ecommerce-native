import { Router } from "express";
import {
  assertPasswordPolicy,
  createTotpEnrollment,
  generateRecoveryCodes,
  hashPassword,
  parseEncryptionKey,
  recoveryCodeHash,
  safeEqualText,
  verifyTotp
} from "./crypto.js";
import { evidence } from "./evidence.js";
import {
  asyncRoute,
  isDuplicateKey,
  normalizeEmail,
  objectBody,
  objectIdText,
  requiredText,
  sendError
} from "./http-helpers.js";
import { AdminAccountModel } from "./models.js";
import { createSession, publicAccount, setSessionCookies } from "./session.js";
import type { AdminAuthConfig } from "./config.js";

export function createBootstrapRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const encryptionKey = parseEncryptionKey(config.mfaEncryptionKey);

  router.post("/owner", asyncRoute(async (req, res) => {
    const supplied = req.headers["x-admin-bootstrap-token"];
    if (typeof supplied !== "string" || !safeEqualText(supplied, config.bootstrapToken)) {
      return sendError(res, 403, "bootstrap_forbidden");
    }

    const body = objectBody(req.body);
    const name = requiredText(body.name, 120);
    const email = normalizeEmail(requiredText(body.email, 320));
    const password = requiredText(body.password, 1024, false);
    if (!name || !email || !password) return sendError(res, 400, "invalid_request");

    try {
      assertPasswordPolicy(password);
      const enrollment = createTotpEnrollment(email, config.totpIssuer, encryptionKey);
      const account = await AdminAccountModel.create({
        email,
        emailNormalized: email,
        name,
        role: "owner",
        ownerKey: "installation-owner",
        status: "pending",
        passwordHash: await hashPassword(password),
        mfaSecretCiphertext: enrollment.encryptedSecret,
        permissions: []
      });
      await evidence({
        actor: account,
        action: "owner.bootstrap_created",
        targetType: "admin_account",
        targetId: String(account._id)
      });
      res.status(201).json({
        accountId: String(account._id),
        email,
        mfa: { secret: enrollment.secret, uri: enrollment.uri }
      });
    } catch (error) {
      if (isDuplicateKey(error)) return sendError(res, 409, "owner_already_exists");
      if (error instanceof Error && error.name === "PasswordPolicyError") {
        return sendError(res, 400, "password_policy_failed");
      }
      throw error;
    }
  }));

  router.post("/owner/activate", asyncRoute(async (req, res) => {
    const supplied = req.headers["x-admin-bootstrap-token"];
    if (typeof supplied !== "string" || !safeEqualText(supplied, config.bootstrapToken)) {
      return sendError(res, 403, "bootstrap_forbidden");
    }

    const body = objectBody(req.body);
    const accountId = objectIdText(body.accountId);
    const totp = requiredText(body.totp, 16);
    if (!accountId || !totp) return sendError(res, 400, "invalid_request");

    const account = await AdminAccountModel.findOne({
      _id: accountId,
      role: "owner",
      status: "pending",
      mfaEnabledAt: null
    });
    if (!account || !(await verifyTotp(totp, account.mfaSecretCiphertext, encryptionKey))) {
      return sendError(res, 401, "mfa_invalid");
    }

    const recoveryCodes = generateRecoveryCodes();
    const activated = await AdminAccountModel.findOneAndUpdate(
      { _id: account._id, role: "owner", status: "pending", mfaEnabledAt: null },
      {
        $set: {
          status: "active",
          mfaEnabledAt: new Date(),
          recoveryCodes: recoveryCodes.map((code) => ({
            hash: recoveryCodeHash(code),
            usedAt: null
          }))
        }
      },
      { new: true }
    );
    if (!activated) return sendError(res, 409, "activation_already_completed");

    const created = await createSession(activated);
    setSessionCookies(res, created, config.secureCookies);
    await evidence({
      actor: activated,
      sessionId: created.session._id,
      action: "mfa.activated",
      targetType: "admin_account",
      targetId: String(activated._id)
    });
    res.json({ account: publicAccount(activated), recoveryCodes });
  }));

  return router;
}
