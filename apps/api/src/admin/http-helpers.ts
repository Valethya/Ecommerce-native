import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncRoute(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };
}

export function sendError(res: Response, status: number, error: string): void {
  const requestId = typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
  res.status(status).json({ error, requestId });
}

export function objectBody(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function requiredText(value: unknown, max: number, trim = true): string | null {
  if (typeof value !== "string") return null;
  const text = trim ? value.trim() : value;
  return text.length > 0 && text.length <= max ? text : null;
}

export function optionalText(value: unknown, max: number, trim = true): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredText(value, max, trim);
}

export function normalizeEmail(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLocaleLowerCase("en-US");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export function objectIdText(value: unknown): string | null {
  return typeof value === "string" && Types.ObjectId.isValid(value) ? value : null;
}

export function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

export function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error &&
    (error as { code?: unknown }).code === 11000;
}
