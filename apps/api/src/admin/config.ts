export const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
export const LOGIN_CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const SESSION_IDLE_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RECENT_AUTH_TTL_MS = 15 * 60 * 1000;
export const SESSION_COOKIE = "admin_session";
export const CSRF_COOKIE = "admin_csrf";

export interface AdminAuthConfig {
  bootstrapToken: string;
  mfaEncryptionKey: string;
  totpIssuer: string;
  secureCookies: boolean;
}
