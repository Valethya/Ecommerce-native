import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { errorHandler } from "../src/http/error-handler.js";
import { requestId } from "../src/http/request-id.js";

describe("HTTP error boundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await request(createApp())
      .post("/anything")
      .set("content-type", "application/json")
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid_json");
    expect(response.body.requestId).toBeTypeOf("string");
  });

  it("returns 413 for an oversized JSON payload", async () => {
    const response = await request(createApp())
      .post("/anything")
      .send({ value: "x".repeat(300 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body.error).toBe("payload_too_large");
    expect(response.body.requestId).toBeTypeOf("string");
  });

  it("does not expose or log sensitive details from unexpected errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = express();

    app.use(requestId);
    app.get("/explode", () => {
      const error = Object.assign(new Error("password=hunter2"), {
        code: "E_TEST",
        secret: "hunter2"
      });
      throw error;
    });
    app.use(errorHandler);

    const response = await request(app).get("/explode");
    const responseText = JSON.stringify(response.body);
    const loggedText = errorSpy.mock.calls.flat().map(String).join(" ");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("internal_error");
    expect(response.body.requestId).toBeTypeOf("string");
    expect(responseText).not.toContain("hunter2");
    expect(responseText).not.toContain("password");
    expect(responseText).not.toContain("stack");
    expect(loggedText).not.toContain("hunter2");
    expect(loggedText).not.toContain("password");
    expect(loggedText).toContain("request_failed");
    expect(loggedText).toContain("E_TEST");
  });
});
