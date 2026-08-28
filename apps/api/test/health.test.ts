import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("health endpoints", () => {
  const app = createApp();

  it("reports process liveness without requiring database readiness", async () => {
    const response = await request(app).get("/health/live");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toBeTypeOf("string");
  });

  it("reports not ready while MongoDB is disconnected", async () => {
    const response = await request(app).get("/health/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "not_ready",
      database: "disconnected"
    });
  });

  it("returns a stable JSON 404 shape", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("not_found");
    expect(response.body.requestId).toBeTypeOf("string");
  });

  it("does not expose the smoke UI unless it is explicitly enabled", async () => {
    const response = await request(app).get("/__smoke/");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("not_found");
  });
});
