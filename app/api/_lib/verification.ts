import { db } from "../_db/client";
import { emailVerificationTokens } from "../_db/schema";
import { generateToken } from "./tokens";
import { sendVerificationEmail, isEmailConfigured } from "./email";

const TOKEN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Issues a fresh verification token and emails it. Best-effort: returns
 * whether it actually sent rather than throwing, because signup shouldn't
 * fail just because email isn't configured yet or Resend hiccuped.
 */
export async function issueAndSendVerificationEmail(req: Request, user: { id: string; name: string; email: string }): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const { raw, hash } = generateToken();
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + TOKEN_DURATION_MS),
  });

  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${raw}`;

  try {
    await sendVerificationEmail(user.email, user.name, verifyUrl);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}
