import { randomBytes, createHash } from "node:crypto";

/** Same pattern as session tokens: random raw value, only its SHA-256 hash
 * ever touches the database, so a DB leak alone can't be replayed. */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
