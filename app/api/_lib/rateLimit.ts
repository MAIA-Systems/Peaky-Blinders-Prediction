import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../_db/client.js";
import { loginAttempts, rateLimitEvents } from "../_db/schema.js";
import { HttpError } from "./http.js";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Throws 429 if this email has racked up too many failed logins recently.
 * Deliberately keyed on email (not IP) so an attacker can't dodge the limit
 * by rotating IPs against a known account — the tradeoff is it can't stop a
 * distributed attempt to enumerate many emails, which the generic "invalid
 * email or password" error message (see login.ts) already discourages.
 */
export async function assertNotRateLimited(email: string): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), eq(loginAttempts.succeeded, false), gte(loginAttempts.createdAt, since)));

  if (count >= MAX_FAILED_ATTEMPTS) {
    throw new HttpError(429, "Too many failed attempts. Try again in a few minutes.");
  }
}

export async function recordLoginAttempt(email: string, ip: string | null, succeeded: boolean): Promise<void> {
  await db.insert(loginAttempts).values({ email, ip, succeeded });
}

/**
 * Generic throttle for things that aren't login (password-reset requests,
 * verification-email resends): at most `max` calls per `windowMs` for a
 * given key, e.g. `pwreset:ben@example.com`.
 */
export async function assertKeyNotRateLimited(key: string, max: number, windowMs: number): Promise<void> {
  const since = new Date(Date.now() - windowMs);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.key, key), gte(rateLimitEvents.createdAt, since)));

  if (count >= max) {
    throw new HttpError(429, "Too many requests. Try again in a few minutes.");
  }
}

export async function recordKeyEvent(key: string): Promise<void> {
  await db.insert(rateLimitEvents).values({ key });
}
