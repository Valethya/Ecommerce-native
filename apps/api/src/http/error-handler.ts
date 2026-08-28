import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId =
    typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
  const clientStatus = getClientStatus(error);

  if (clientStatus !== null) {
    res.status(clientStatus).json({
      error: getPublicClientErrorCode(clientStatus, error),
      requestId
    });
    return;
  }

  logUnexpectedError(error, requestId);

  res.status(500).json({
    error: "internal_error",
    requestId
  });
};

function getClientStatus(error: unknown): number | null {
  const record = asRecord(error);
  if (record === null) return null;

  for (const candidate of [record.status, record.statusCode]) {
    if (
      typeof candidate === "number" &&
      Number.isInteger(candidate) &&
      candidate >= 400 &&
      candidate < 500
    ) {
      return candidate;
    }
  }

  return null;
}

function getPublicClientErrorCode(status: number, error: unknown): string {
  const type = asRecord(error)?.type;

  if (status === 400 && type === "entity.parse.failed") {
    return "invalid_json";
  }

  if (status === 413 || type === "entity.too.large") {
    return "payload_too_large";
  }

  return "invalid_request";
}

function logUnexpectedError(error: unknown, requestId: string): void {
  const record = asRecord(error);
  const payload: Record<string, string> = {
    event: "request_failed",
    requestId,
    errorName: sanitizeToken(error instanceof Error ? error.name : "UnknownError") ?? "Error"
  };

  const errorCode = record?.code;
  if (typeof errorCode === "string") {
    const sanitizedCode = sanitizeToken(errorCode);
    if (sanitizedCode !== undefined) payload.errorCode = sanitizedCode;
  }

  console.error(JSON.stringify(payload));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function sanitizeToken(value: string): string | undefined {
  const candidate = value.slice(0, 64);
  return /^[A-Za-z0-9_.:-]+$/.test(candidate) ? candidate : undefined;
}
