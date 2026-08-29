import type { ErrorRequestHandler } from "express";

type KnownClientError = {
  status: 400 | 413;
  code: "invalid_json" | "payload_too_large";
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId =
    typeof res.locals.requestId === "string" ? res.locals.requestId : "unknown";
  const clientError = getKnownClientError(error);

  if (clientError !== null) {
    res.status(clientError.status).json({
      error: clientError.code,
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

function getKnownClientError(error: unknown): KnownClientError | null {
  const type = asRecord(error)?.type;

  if (type === "entity.parse.failed") {
    return { status: 400, code: "invalid_json" };
  }

  if (type === "entity.too.large") {
    return { status: 413, code: "payload_too_large" };
  }

  return null;
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
