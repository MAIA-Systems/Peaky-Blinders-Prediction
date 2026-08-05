import { eq } from "drizzle-orm";
import { db } from "../_db/client.js";
import { users } from "../_db/schema.js";
import { verifyPassword } from "../_lib/password.js";
import { createSession } from "../_lib/session.js";
import { loginSchema } from "../_lib/validation.js";
import { assertNotRateLimited, recordLoginAttempt } from "../_lib/rateLimit.js";
import { errorResponse, getClientIp, HttpError, json, readJsonBody, withErrorHandling } from "../_lib/http.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const body = await readJsonBody(req);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { email, password } = parsed.data;
  const ip = getClientIp(req);

  await assertNotRateLimited(email);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Same generic message whether the email doesn't exist or the password is
  // wrong — never let a login form confirm which accounts exist.
  const invalid = () => new HttpError(401, "Invalid email or password");

  if (!user) {
    await recordLoginAttempt(email, ip, false);
    throw invalid();
  }

  if (!user.passwordHash) {
    // Google-only account. Telling them this (rather than the generic
    // message) is a deliberate UX call — it doesn't expose anything an
    // attacker couldn't already learn from the signup-collision response.
    await recordLoginAttempt(email, ip, false);
    throw new HttpError(400, "This account uses Google Sign-In. Use the “Continue with Google” button instead.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordLoginAttempt(email, ip, false);
    throw invalid();
  }

  await recordLoginAttempt(email, ip, true);
  const cookie = await createSession(req, user.id);

  return json(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
    },
    { headers: { "set-cookie": cookie } },
  );
}

export default withErrorHandling(handler);
