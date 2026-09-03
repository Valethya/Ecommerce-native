import { generate } from "otplib";
import { describe, expect, it } from "vitest";
import {
  createTotpEnrollment,
  parseEncryptionKey,
  verifyTotp
} from "../src/admin/crypto.js";

describe("administrative TOTP primitives", () => {
  it("generates an authenticator-compatible enrollment and verifies the current token", async () => {
    const key = parseEncryptionKey(Buffer.alloc(32, 9).toString("base64"));
    const enrollment = createTotpEnrollment("owner@example.test", "Ecommerce Native Test", key);

    expect(enrollment.secret).toMatch(/^[A-Z2-7]+$/);
    expect(enrollment.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(enrollment.encryptedSecret).not.toContain(enrollment.secret);

    const token = await generate({ secret: enrollment.secret });
    expect(await verifyTotp(token, enrollment.encryptedSecret, key)).toBe(true);
    expect(await verifyTotp("000000", enrollment.encryptedSecret, key)).toBe(false);
  });
});
