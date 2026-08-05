import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../../_db/client.js";
import { users, wallets } from "../../_db/schema.js";
import { exchangeCodeForTokens, fetchGoogleUserInfo, getGoogleConfig } from "../../_lib/google.js";
import { createSession } from "../../_lib/session.js";
import { getCookie } from "../../_lib/http.js";

import { toNodeHandler } from "../../_lib/adapter.js";
const STATE_COOKIE = "oauth_state";

function redirectToLogin(origin: string, error: string): Response {
  const headers = new Headers({ Location: `${origin}/login?error=${error}` });
  headers.append("Set-Cookie", `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 302, headers });
}

async function usernameFromEmail(localPart: string): Promise<string> {
  const base = localPart.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || "trader";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${randomInt(1000, 9999)}`;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, candidate)).limit(1);
    if (!existing) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const origin = url.origin;
  const config = getGoogleConfig();

  if (!config) return redirectToLogin(origin, "google_not_configured");

  if (url.searchParams.get("error")) return redirectToLogin(origin, "google_denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = getCookie(req, STATE_COOKIE);

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectToLogin(origin, "google_state_mismatch");
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(config, code, redirectUri);
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.email_verified) return redirectToLogin(origin, "google_email_unverified");

    const email = profile.email.toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let userId: string;
    if (existing) {
      userId = existing.id;
      if (existing.googleId !== profile.sub || !existing.emailVerifiedAt) {
        await db
          .update(users)
          .set({ googleId: profile.sub, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() })
          .where(eq(users.id, existing.id));
      }
    } else {
      const localPart = email.split("@")[0] ?? "trader";
      const username = await usernameFromEmail(localPart);
      const [created] = await db
        .insert(users)
        .values({
          name: profile.name || username,
          username,
          email,
          passwordHash: null,
          googleId: profile.sub,
          emailVerifiedAt: new Date(),
          role: "standard",
        })
        .returning({ id: users.id });
      userId = created.id;
      await db.insert(wallets).values({ userId, balanceCents: 0 });
    }

    const sessionCookie = await createSession(req, userId);
    const headers = new Headers({ Location: `${origin}/` });
    headers.append("Set-Cookie", sessionCookie);
    headers.append("Set-Cookie", `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return redirectToLogin(origin, "google_failed");
  }
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = handler;
export default toNodeHandler(fetchHandler);