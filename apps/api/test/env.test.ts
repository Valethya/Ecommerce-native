import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

describe("loadEnv", () => {
  it("parses a valid local configuration", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: "3001",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test",
      ENABLE_SMOKE_UI: "true"
    });

    expect(env.PORT).toBe(3001);
    expect(env.ENABLE_SMOKE_UI).toBe(true);
  });

  it("rejects a missing MongoDB URI", () => {
    expect(() => loadEnv({ NODE_ENV: "test" })).toThrow(
      /MONGODB_URI/
    );
  });
});
