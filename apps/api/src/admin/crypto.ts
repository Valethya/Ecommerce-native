import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions
} from "node:crypto";
import { generateSecret, generateURI, verify } from "otplib";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_DERIVED_BYTES = 64;
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

const KNOWN_COMPROMISED_PASSWORDS = new Set(
  [
    "123456789012",
    "1234567890ab",
    "password1234",
    "password12345",
    "qwerty123456",
    "letmein123456",
    "admin12345678",
    "welcome123456",
    "iloveyou12345",
    "changeme1234"
  ].map((value) => value.toLocaleLowerCase("en-US"))
);

export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordPolicyError";
  }
}

export function assertPasswordPolicy(password: string): void {
  if (Array.from(password).length < PASSWORD_MIN_LENGTH) {
    throw new PasswordPolicyError("Administrative passwords require at least 12 characters");
  }

  if (KNOWN_COMPROMISED_PASSWORDS.has(password.toLocaleLowerCase("en-US"))) {
    throw new PasswordPolicyError("Administrative password is known to be compromised");
  }
}

async function deriveScrypt(
  password: string,
  salt: Buffer,
  length: number,
  options: ScryptOptions
): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, length, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  const salt = randomBytes(16);
  const derived = await deriveScrypt(password, salt, PASSWORD_DERIVED_BYTES, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64"),
    derived.toString("base64")
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltText = parts[4];
  const expectedText = parts[5];
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || !saltText || !expectedText) {
    return false;
  }

  try {
    const expected = Buffer.from(expectedText, "base64");
    const actual = await deriveScrypt(password, Buffer.from(saltText, "base64"), expected.length, {
      N: n,
      r,
      p,
      maxmem: SCRYPT_MAXMEM
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function randomOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(10).toString("hex").toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15, 20)}`;
  });
}

export function recoveryCodeHash(code: string): string {
  return hashOpaqueToken(code.replaceAll("-", "").trim().toUpperCase());
}

export function parseEncryptionKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) throw new Error("ADMIN_MFA_ENCRYPTION_KEY must decode to exactly 32 bytes");
  return key;
}

export function encryptSecret(secret: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(encoded: string, key: Buffer): string {
  const [version, ivText, tagText, ciphertextText] = encoded.split(".");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText) throw new Error("Invalid encrypted MFA secret");

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function createTotpEnrollment(email: string, issuer: string, key: Buffer): {
  secret: string;
  encryptedSecret: string;
  uri: string;
} {
  const secret = generateSecret();
  return {
    secret,
    encryptedSecret: encryptSecret(secret, key),
    uri: generateURI({ issuer, label: email, secret })
  };
}

export async function verifyTotp(token: string, encryptedSecret: string, key: Buffer): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const result = await verify({ secret: decryptSecret(encryptedSecret, key), token });
    return result.valid;
  } catch {
    return false;
  }
}

export function safeEqualText(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
