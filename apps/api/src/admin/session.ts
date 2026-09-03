import type { Response } from "express";
import { hashOpaqueToken, randomOpaqueToken } from "./crypto.js";
import {
  CSRF_COOKIE,
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_COOKIE,
  type AdminAuthConfig
} from "./config.js";
import { AdminSessionModel } from "./models.js";

export type AdminContext = {
  account: any;
  session: any;
  sessionTokenHash: string;
};

export async function createSession(
  account: any,
  now = new Date()
): Promise<{ session: any; sessionToken: string; csrfToken: string }> {
  const sessionToken = randomOpaqueToken();
  const csrfToken = randomOpaqueToken();
  const session = await AdminSessionModel.create({
    accountId: account._id,
    tokenHash: hashOpaqueToken(sessionToken),
    csrfHash: hashOpaqueToken(csrfToken),
    lastSeenAt: now,
    reauthenticatedAt: now,
    absoluteExpiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS)
  });
  return { session, sessionToken, csrfToken };
}

export async function rotateSession(
  context: AdminContext,
  now = new Date()
): Promise<{ session: any; sessionToken: string; csrfToken: string } | null> {
  const sessionToken = randomOpaqueToken();
  const csrfToken = randomOpaqueToken();
  const session = await AdminSessionModel.findOneAndUpdate(
    { _id: context.session._id, tokenHash: context.sessionTokenHash, revokedAt: null },
    {
      $set: {
        tokenHash: hashOpaqueToken(sessionToken),
        csrfHash: hashOpaqueToken(csrfToken),
        lastSeenAt: now,
        reauthenticatedAt: now
      }
    },
    { new: true }
  );
  return session ? { session, sessionToken, csrfToken } : null;
}

export function setSessionCookies(
  res: Response,
  created: { sessionToken: string; csrfToken: string },
  secure: boolean
): void {
  const common = {
    secure,
    sameSite: "strict" as const,
    path: "/admin",
    maxAge: SESSION_ABSOLUTE_TTL_MS
  };
  res.cookie(SESSION_COOKIE, created.sessionToken, { ...common, httpOnly: true });
  res.cookie(CSRF_COOKIE, created.csrfToken, { ...common, httpOnly: false });
}

export function clearSessionCookies(res: Response, secure: boolean): void {
  const common = { secure, sameSite: "strict" as const, path: "/admin" };
  res.clearCookie(SESSION_COOKIE, { ...common, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...common, httpOnly: false });
}

export function publicSession(session: any): Record<string, unknown> {
  return {
    id: String(session._id),
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    reauthenticatedAt: session.reauthenticatedAt,
    absoluteExpiresAt: session.absoluteExpiresAt
  };
}

export function getContext(res: Response): AdminContext {
  return res.locals.adminContext as AdminContext;
}

export function cookieSecurityForEnv(config: AdminAuthConfig): boolean {
  return config.secureCookies;
}
