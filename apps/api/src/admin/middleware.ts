import type { Request, Response } from "express";
import { hashOpaqueToken, safeEqualText } from "./crypto.js";
import {
  CSRF_COOKIE,
  RECENT_AUTH_TTL_MS,
  SESSION_COOKIE,
  SESSION_IDLE_TTL_MS,
  type AdminAuthConfig
} from "./config.js";
import { asyncRoute, parseCookies, sendError } from "./http-helpers.js";
import { AdminAccountModel, AdminSessionModel } from "./models.js";
import { hasPermission, type AdminPermission } from "./permissions.js";
import { clearSessionCookies, getContext, type AdminContext } from "./session.js";

export function createRequireAuth(config: AdminAuthConfig) {
  return (permission?: AdminPermission, recent = false) => asyncRoute(async (req, res) => {
    const token = parseCookies(req.headers.cookie ?? "")[SESSION_COOKIE];
    if (!token) return sendError(res, 401, "authentication_required");

    const tokenHash = hashOpaqueToken(token);
    const now = new Date();
    const session = await AdminSessionModel.findOne({
      tokenHash,
      revokedAt: null,
      absoluteExpiresAt: { $gt: now },
      lastSeenAt: { $gt: new Date(now.getTime() - SESSION_IDLE_TTL_MS) }
    });
    if (!session) {
      clearSessionCookies(res, config.secureCookies);
      return sendError(res, 401, "session_invalid");
    }

    const account = await AdminAccountModel.findOne({
      _id: session.accountId,
      status: "active",
      mfaEnabledAt: { $ne: null }
    });
    if (!account) {
      await AdminSessionModel.updateOne(
        { _id: session._id, revokedAt: null },
        { $set: { revokedAt: now, revokedReason: "account_unavailable" } }
      );
      clearSessionCookies(res, config.secureCookies);
      return sendError(res, 401, "session_invalid");
    }

    if (permission && !hasPermission(account.role, account.permissions, permission)) {
      return sendError(res, 403, "forbidden");
    }
    if (recent && session.reauthenticatedAt < new Date(now.getTime() - RECENT_AUTH_TTL_MS)) {
      return sendError(res, 401, "recent_authentication_required");
    }

    await AdminSessionModel.updateOne(
      { _id: session._id, tokenHash, revokedAt: null },
      { $set: { lastSeenAt: now } }
    );
    session.lastSeenAt = now;
    res.locals.adminContext = { account, session, sessionTokenHash: tokenHash } satisfies AdminContext;
  });
}

export function createRequireCsrf() {
  return asyncRoute(async (req: Request, res: Response) => {
    const context = getContext(res);
    const cookies = parseCookies(req.headers.cookie ?? "");
    const cookieToken = cookies[CSRF_COOKIE];
    const headerToken = typeof req.headers["x-csrf-token"] === "string"
      ? req.headers["x-csrf-token"]
      : undefined;

    if (
      !cookieToken ||
      !headerToken ||
      !safeEqualText(cookieToken, headerToken) ||
      hashOpaqueToken(headerToken) !== context.session.csrfHash
    ) {
      return sendError(res, 403, "csrf_invalid");
    }
  });
}
