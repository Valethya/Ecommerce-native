import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadOptionalEnvFile } from "../src/config/env-file.js";

describe("loadOptionalEnvFile", () => {
  it("does not fail when the optional file does not exist", () => {
    expect(() => loadOptionalEnvFile("/definitely/missing/ecommerce-native.env")).not.toThrow();
  });

  it("loads values from a present env file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ecommerce-native-"));
    const path = join(directory, ".env");
    const key = `ECOMMERCE_NATIVE_TEST_${Date.now()}`;

    await writeFile(path, `${key}=loaded\n`, "utf8");
    loadOptionalEnvFile(path);

    expect(process.env[key]).toBe("loaded");
    delete process.env[key];
  });
});
