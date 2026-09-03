import { Router } from "express";
import {
  hashOpaqueToken,
  parseEncryptionKey,
  randomOpaqueToken,
  recoveryCodeHash,
  verifyPassword,
  verifyTotp
} from "./crypto.js";
import { LOGIN_CHALLENGE_TTL_MS, type AdminAuthConfig } from "./config.js";
import { evidence } from "./evidence.js";
import {
  asyncRoute,
  normalizeEmail,
  objectBody,
  optionalText,
  requiredText,
  sendError
} from "./http-helpers.js";
import {
  AdminAccountModel,
  AdminLoginChallengeModel,
  AdminLoginThrottleModel
} from "./models.js";
import { createSession, publicAccount, setSessionCookies } from "./session.js";
import { createHash } from "node:crypto";

const DUMMY_PASSWORD_HASH = "scrypt$32768$8$1$5Y6tpax6DJtKNKzjY4RkCg==$qvpUhNtZ+WM6E9qMSw10IqqozRmSvkP5B6R8GGs1MLsUN88jLN+MmjzW1qJS1+b5bk/SCxzJYS7bacwh7EbpRw==";
const THROTTLE_TTL_MS = 24 * 60 * 60 * 1000;

export function createLoginRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const encryptionKey = parseEncryptionKey(config.mfaEncryptionKey);

  router.post("/password", asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const email = normalizeEmail(requiredText(body.email, 320));
    const password = requiredText(body.password, 1024, false);
    if (!email || !password) return sendError(res, 400, "invalid_request");

    const keyHash = createHash("sha256").update(email).digest("base64url");
    const throttle = await AdminLoginThrottleModel.findOne({ keyHash });
    const now = new Date();
    if (throttle?.blockedUntil && throttle.blockedUntil > now) {
      await evidence({ action: "login.password_rejected", result: "rejected" });
      return sendError(res, 429, "authentication_temporarily_limited");
    }

    const account = await AdminAccountModel.findOne({ emailNormalized: email });
    const passwordValid = await verifyPassword(password, account?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!account || !passwordValid || account.status !== "active" || !account.mfaEnabledAt) {
      await recordLoginFailure(keyHash, throttle?.failures ?? 0);
      await evidence({
        actor: account ?? undefined,
        action: "login.password_rejected",
        result: "rejected"
      });
      return sendError(res, 401, "invalid_credentials");
    }

    await AdminLoginThrottleModel.deleteOne({ keyHash });
    const challengeToken = randomOpaqueToken();
    await AdminLoginChallengeModel.create({
      accountId: account._id,
      tokenHash: hashOpaqueToken(challengeToken),
      expiresAt: new Date(now.getTime() + LOGIN_CHALLENGE_TTL_MS)
    });
    await evidence({ actor: account, action: "login.password_verified" });
    res.json({ challengeToken, mfaRequired: true });
  }));

  router.post("/mfa", asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const challengeToken = requiredText(body.challengeToken, 512, false);
    const totp = optionalText(body.totp, 16);
    const recoveryCode = optionalText(body.recoveryCode, 128, false);
    if (!challengeToken || (!totp && !recoveryCode) || (totp && recoveryCode)) {
      return sendError(res, 400, "invalid_request");
    }

    const now = new Date();
    const challenge = await AdminLoginChallengeModel.findOne({
      tokenHash: hashOpaqueToken(challengeToken),
      usedAt: null,
      expiresAt: { $gt: now }
    });
    if (!challenge) return sendError(res, 401, "login_challenge_invalid");

    const account = await AdminAccountModel.findOne({
      _id: challenge.accountId,
      status: "active",
      mfaEnabledAt: { $ne: null }
    });
    if (!account) return sendError(res, 401, "invalid_credentials");

    let factorValid = false;
    let recoveryHash: string | null = null;
    if (totp) factorValid = await verifyTotp(totp, account.mfaSecretCiphertext, encryptionKey);
    if (recoveryCode) {
      recoveryHash = recoveryCodeHash(recoveryCode);
      factorValid = account.recoveryCodes.some(
        (entry: any) => entry.hash === recoveryHash && entry.usedAt === null
      );
    }
    if (!factorValid) {
      await evidence({ actor: account, action: "login.mfa_rejected", result: "rejected" });
      return sendError(res, 401, "mfa_invalid");
    }

    const consumedChallenge = await AdminLoginChallengeModel.findOneAndUpdate(
      { _id: challenge._id, usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
      { new: true }
    );
    if (!consumedChallenge) return sendError(res, 409, "login_challenge_already_used");

    if (recoveryHash) {
      const consumedRecovery = await AdminAccountModel.findOneAndUpdate(
        {
          _id: account._id,
          status: "active",
          recoveryCodes: { $elemMatch: { hash: recoveryHash, usedAt: null } }
        },
        { $set: { "recoveryCodes.$.usedAt": now } },
        { new: true }
      );
      if (!consumedRecovery) return sendError(res, 409, "recovery_code_already_used");
      await evidence({
        actor: account,
        action: "recovery_code.used",
        targetType: "admin_account",
        targetId: String(account._id)
      });
    }

    const created = await createSession(account, now);
    setSessionCookies(res, created, config.secureCookies);
    await evidence({
      actor: account,
      sessionId: created.session._id,
      action: "login.completed"
    });
    res.json({ account: publicAccount(account) });
  }));

  return router;
}

async function recordLoginFailure(keyHash: string, previousFailures: number): Promise<void> {
  const failures = previousFailures + 1;
  const delaySeconds = failures < 5
    ? 0
    : Math.min(15 * 60, 2 ** Math.min(failures - 5, 10));
  const now = new Date();
  await AdminLoginThrottleModel.findOneAndUpdate(
    { keyHash },
    {
      $set: {
        failures,
        blockedUntil: delaySeconds > 0
          ? new Date(now.getTime() + delaySeconds * 1000)
          : null,
        expiresAt: new Date(now.getTime() + THROTTLE_TTL_MS)
      }
    },
    { upsert: true }
  );
}
