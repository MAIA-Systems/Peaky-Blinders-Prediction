import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../_db/client";
import { sessions, users } from "../_db/schema";
import { buildCookie, getClientIp, getCookie } from "./http";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "standard" | "admin";
  createdAt: Date;
  emailVerifiedAt: Date | null;
}

function hashToken(rawToken: string): string {
  // SHA-256 of the raw token. The raw token lives only in the client's
  // httpOnly cookie; the DB only ever stores/compares its hash, so a DB
  // leak alone can't be replayed as a valid session.
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Creates a session row + returns the Set-Cookie header value to send back. */
export async function createSession(req: Request, userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
    ip: getClientIp(req),
  });

  return buildCookie(req, SESSION_COOKIE, rawToken, SESSION_DURATION_MS / 1000);
}

export function clearSessionCookie(req: Request): string {
  return buildCookie(req, SESSION_COOKIE, "", 0);
}

/** Reads the session cookie (if any) and resolves it to the logged-in user, or null. */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const rawToken = getCookie(req, SESSION_COOKIE);
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return row ?? null;
}

export async function destroySession(req: Request): Promise<void> {
  const rawToken = getCookie(req, SESSION_COOKIE);
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
