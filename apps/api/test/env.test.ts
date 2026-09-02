import { describe, expect, it } from "vitest";
import { isSmokeUiEnabled, loadEnv } from "../src/config/env.js";

describe("loadEnv", () => {
  it("parses a valid local configuration", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: "3001",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true",
      SHUTDOWN_TIMEOUT_MS: "5000"
    });

    expect(env.PORT).toBe(3001);
    expect(env.ENABLE_SMOKE_UI).toBe(true);
    expect(env.SHUTDOWN_TIMEOUT_MS).toBe(5000);
  });

  it("uses a bounded shutdown timeout by default", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test"
    });

    expect(env.SHUTDOWN_TIMEOUT_MS).toBe(10000);
  });

  it("rejects a missing MongoDB URI", () => {
    expect(() => loadEnv({ NODE_ENV: "test" })).toThrow(/MONGODB_URI/);
  });

  it("never enables the smoke UI in production", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true"
    });

    expect(isSmokeUiEnabled(env)).toBe(false);
  });

  it("allows the smoke UI only when explicitly enabled outside production", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true"
    });

    expect(isSmokeUiEnabled(env)).toBe(true);
  });
});
