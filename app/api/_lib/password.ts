import bcrypt from "bcryptjs";

// 12 rounds: OWASP's current baseline recommendation for bcrypt — expensive
// enough to resist offline cracking, cheap enough not to matter for one
// login request.
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Constant-time comparison is bcrypt's job internally — never compare hashes with === . */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
