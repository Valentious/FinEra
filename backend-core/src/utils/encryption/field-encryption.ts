/**
 * Field-level encryption utility (AES-256-GCM).
 * Use for optional sensitive payload fragments beyond password hashing.
 */
import crypto from "crypto";
import { getConfig } from "../../config/index.js";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getKey(): Buffer {
  const key = getConfig().ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY not configured");
  }
  return Buffer.from(key, "utf8");
}

export function encryptField(plain: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv:tag:ciphertext (base64url segments)
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptField(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Invalid encrypted payload format");
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(ctB64, "base64url");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

