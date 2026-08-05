import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../_db/client.js";
import { passwordResetTokens, users } from "../_db/schema.js";
import { generateToken } from "../_lib/tokens.js";
import { sendPasswordResetEmail, isEmailConfigured } from "../_lib/email.js";
import { assertKeyNotRateLimited, recordKeyEvent } from "../_lib/rateLimit.js";
import { errorResponse, HttpError, json, readJsonBody, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
const bodySchema = z.object({ email: z.string().trim().toLowerCase().email() });
const TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60 * 1000;

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");
  if (!isEmailConfigured()) throw new HttpError(503, "Password reset is not available yet.");

  const body = await readJsonBody(req);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, "Enter a valid email");
  const { email } = parsed.data;

  await assertKeyNotRateLimited(`pwreset:${email}`, MAX_PER_WINDOW, WINDOW_MS);
  await recordKeyEvent(`pwreset:${email}`);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Same response whether the account exists, has no password (Google-only),
  // or the email genuinely doesn't exist — nothing here should let a caller
  // distinguish those cases.
  if (user && user.passwordHash) {
    const { raw, hash } = generateToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + TOKEN_DURATION_MS),
    });

    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${raw}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  return json({ message: "If that email has an account, we've sent a reset link." });
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);