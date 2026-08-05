import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../_db/client";
import { passwordResetTokens, sessions, users } from "../_db/schema";
import { hashToken } from "../_lib/tokens";
import { hashPassword } from "../_lib/password";
import { createSession } from "../_lib/session";
import { errorResponse, HttpError, json, readJsonBody, withErrorHandling } from "../_lib/http";

const bodySchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8).max(200) });

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const body = await readJsonBody(req);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
  const { token, newPassword } = parsed.data;

  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    throw new HttpError(400, "This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(newPassword);

  await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
  // A password reset is a strong signal to kill every other session — if the
  // reset was needed because of a compromise, this logs the attacker out too.
  await db.delete(sessions).where(eq(sessions.userId, row.userId));

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  const cookie = await createSession(req, row.userId);

  return json(
    { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt, emailVerifiedAt: user.emailVerifiedAt },
    { headers: { "set-cookie": cookie } },
  );
}

export default withErrorHandling(handler);
