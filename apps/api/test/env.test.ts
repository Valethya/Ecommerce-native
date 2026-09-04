import { describe, expect, it } from "vitest";
import { isSmokeUiEnabled, loadEnv } from "../src/config/env.js";

const authEnv = {
  ADMIN_BOOTSTRAP_TOKEN: "test-bootstrap-token-that-is-long-enough",
  ADMIN_MFA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64")
};

describe("loadEnv", () => {
  it("parses a valid local configuration", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: "3001",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true",
      SHUTDOWN_TIMEOUT_MS: "5000",
      ...authEnv
    });

    expect(env.PORT).toBe(3001);
    expect(env.ENABLE_SMOKE_UI).toBe(true);
    expect(env.SHUTDOWN_TIMEOUT_MS).toBe(5000);
    expect(env.ADMIN_TOTP_ISSUER).toBe("Ecommerce Native");
  });

  it("uses a bounded shutdown timeout by default", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ...authEnv
    });

    expect(env.SHUTDOWN_TIMEOUT_MS).toBe(10000);
  });

  it("rejects a missing MongoDB URI", () => {
    expect(() => loadEnv({ NODE_ENV: "test", ...authEnv })).toThrow(/MONGODB_URI/);
  });

  it("rejects missing administrative secrets", () => {
    expect(() => loadEnv({
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test"
    })).toThrow(/ADMIN_BOOTSTRAP_TOKEN/);
  });

  it("rejects an invalid MFA encryption key", () => {
    expect(() => loadEnv({
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ADMIN_BOOTSTRAP_TOKEN: authEnv.ADMIN_BOOTSTRAP_TOKEN,
      ADMIN_MFA_ENCRYPTION_KEY: "not-a-32-byte-key"
    })).toThrow(/ADMIN_MFA_ENCRYPTION_KEY/);
  });

  it("never enables the smoke UI in production", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true",
      ...authEnv
    });

    expect(isSmokeUiEnabled(env)).toBe(false);
  });

  it("allows the smoke UI only when explicitly enabled outside production", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true",
      ...authEnv
    });

    expect(isSmokeUiEnabled(env)).toBe(true);
  });
});
