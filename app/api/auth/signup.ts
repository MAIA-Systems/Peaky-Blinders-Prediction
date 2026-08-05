import { db } from "../_db/client";
import { users, wallets } from "../_db/schema";
import { hashPassword } from "../_lib/password";
import { createSession } from "../_lib/session";
import { signupSchema } from "../_lib/validation";
import { errorResponse, HttpError, json, readJsonBody, withErrorHandling } from "../_lib/http";
import { isUniqueViolation, pgConstraintName } from "../_lib/dbErrors";
import { issueAndSendVerificationEmail } from "../_lib/verification";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const body = await readJsonBody(req);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { name, username, email, password } = parsed.data;

  const passwordHash = await hashPassword(password);

  let userId: string;
  let createdAt: Date;
  try {
    const [user] = await db
      .insert(users)
      .values({ name, username, email, passwordHash, role: "standard" })
      .returning({ id: users.id, createdAt: users.createdAt });
    userId = user.id;
    createdAt = user.createdAt;
    await db.insert(wallets).values({ userId, balanceCents: 0 });
  } catch (error) {
    // Postgres unique_violation — race-safe (relies on the DB constraint,
    // not a check-then-insert) rather than an app-level pre-check.
    if (isUniqueViolation(error)) {
      const constraint = pgConstraintName(error);
      if (constraint === "users_email_idx") throw new HttpError(409, "An account with this email already exists");
      if (constraint === "users_username_idx") throw new HttpError(409, "That username is taken");
    }
    throw error;
  }

  const cookie = await createSession(req, userId);
  const emailSent = await issueAndSendVerificationEmail(req, { id: userId, name, email });

  return json(
    { id: userId, name, username, email, role: "standard" as const, createdAt, emailVerifiedAt: null, emailSent },
    { status: 201, headers: { "set-cookie": cookie } },
  );
}

export default withErrorHandling(handler);
