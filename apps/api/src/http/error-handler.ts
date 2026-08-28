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

  console.error(
    JSON.stringify({
      event: "request_failed",
      requestId,
      errorKind: getSafeErrorKind(error)
    })
  );

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

function getSafeErrorKind(error: unknown): string {
  if (error instanceof TypeError) return "TypeError";
  if (error instanceof ReferenceError) return "ReferenceError";
  if (error instanceof SyntaxError) return "SyntaxError";
  if (error instanceof RangeError) return "RangeError";
  if (error instanceof Error) return "Error";
  return "UnknownError";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}
