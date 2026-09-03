import { Router } from "express";
import {
  assertPasswordPolicy,
  createTotpEnrollment,
  generateRecoveryCodes,
  hashOpaqueToken,
  hashPassword,
  parseEncryptionKey,
  randomOpaqueToken,
  recoveryCodeHash,
  verifyTotp
} from "./crypto.js";
import { INVITATION_TTL_MS, type AdminAuthConfig } from "./config.js";
import { evidence } from "./evidence.js";
import {
  asyncRoute,
  isDuplicateKey,
  objectBody,
  requiredText,
  sendError
} from "./http-helpers.js";
import { AdminAccountModel, AdminInvitationModel } from "./models.js";
import { createSession, publicAccount, setSessionCookies } from "./session.js";

export function createInvitationActivationRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const encryptionKey = parseEncryptionKey(config.mfaEncryptionKey);

  router.post("/accept", asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const token = requiredText(body.token, 512, false);
    const password = requiredText(body.password, 1024, false);
    if (!token || !password) return sendError(res, 400, "invalid_request");

    try {
      assertPasswordPolicy(password);
      const now = new Date();
      const invitation = await AdminInvitationModel.findOne({ tokenHash: hashOpaqueToken(token) });
      if (
        !invitation || invitation.expiresAt <= now || invitation.revokedAt ||
        invitation.claimedAt || invitation.usedAt
      ) {
        await evidence({ action: "invitation.accept_rejected", result: "rejected" });
        return sendError(res, 400, "invitation_invalid");
      }

      const enrollment = createTotpEnrollment(
        invitation.emailNormalized,
        config.totpIssuer,
        encryptionKey
      );
      const activationToken = randomOpaqueToken();
      const claimed = await AdminInvitationModel.findOneAndUpdate(
        {
          _id: invitation._id,
          claimedAt: null,
          usedAt: null,
          revokedAt: null,
          expiresAt: { $gt: now }
        },
        {
          $set: {
            claimedAt: now,
            passwordHash: await hashPassword(password),
            mfaSecretCiphertext: enrollment.encryptedSecret,
            activationTokenHash: hashOpaqueToken(activationToken)
          }
        },
        { new: true }
      );
      if (!claimed) return sendError(res, 409, "invitation_already_claimed");

      await evidence({
        action: "invitation.claimed",
        targetType: "admin_invitation",
        targetId: String(claimed._id)
      });
      res.json({
        activationToken,
        expiresAt: claimed.expiresAt,
        mfa: { secret: enrollment.secret, uri: enrollment.uri }
      });
    } catch (error) {
      if (error instanceof Error && error.name === "PasswordPolicyError") {
        return sendError(res, 400, "password_policy_failed");
      }
      throw error;
    }
  }));

  router.post("/activate", asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const activationToken = requiredText(body.activationToken, 512, false);
    const totp = requiredText(body.totp, 16);
    if (!activationToken || !totp) return sendError(res, 400, "invalid_request");

    const now = new Date();
    const invitation = await AdminInvitationModel.findOne({
      activationTokenHash: hashOpaqueToken(activationToken),
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: now }
    });
    if (!invitation || !invitation.passwordHash || !invitation.mfaSecretCiphertext) {
      return sendError(res, 400, "activation_invalid");
    }
    if (!(await verifyTotp(totp, invitation.mfaSecretCiphertext, encryptionKey))) {
      await evidence({
        action: "mfa.activation_failed",
        targetType: "admin_invitation",
        targetId: String(invitation._id),
        result: "rejected"
      });
      return sendError(res, 401, "mfa_invalid");
    }

    const recoveryCodes = generateRecoveryCodes();
    try {
      const account = await AdminAccountModel.create({
        email: invitation.email,
        emailNormalized: invitation.emailNormalized,
        name: invitation.name,
        role: "collaborator",
        ownerKey: null,
        status: "active",
        passwordHash: invitation.passwordHash,
        mfaSecretCiphertext: invitation.mfaSecretCiphertext,
        mfaEnabledAt: now,
        recoveryCodes: recoveryCodes.map((code) => ({
          hash: recoveryCodeHash(code),
          usedAt: null
        })),
        permissions: invitation.permissions,
        sourceInvitationId: invitation._id
      });
      await AdminInvitationModel.updateOne(
        { _id: invitation._id, usedAt: null },
        { $set: { usedAt: now } }
      );
      const created = await createSession(account, now);
      setSessionCookies(res, created, config.secureCookies);
      await evidence({
        actor: account,
        sessionId: created.session._id,
        action: "invitation.consumed",
        targetType: "admin_invitation",
        targetId: String(invitation._id)
      });
      res.json({ account: publicAccount(account), recoveryCodes });
    } catch (error) {
      if (isDuplicateKey(error)) return sendError(res, 409, "activation_already_completed");
      throw error;
    }
  }));

  return router;
}

export function invitationExpiresAt(now = Date.now()): Date {
  return new Date(now + INVITATION_TTL_MS);
}
