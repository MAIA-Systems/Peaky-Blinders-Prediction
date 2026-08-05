import { requireUser } from "../_lib/authz";
import { assertKeyNotRateLimited, recordKeyEvent } from "../_lib/rateLimit";
import { issueAndSendVerificationEmail } from "../_lib/verification";
import { errorResponse, HttpError, json, withErrorHandling } from "../_lib/http";

const MAX_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60 * 1000;

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const user = await requireUser(req);
  const rateLimitKey = `resend-verification:${user.email}`;
  await assertKeyNotRateLimited(rateLimitKey, MAX_PER_WINDOW, WINDOW_MS);
  await recordKeyEvent(rateLimitKey);

  const sent = await issueAndSendVerificationEmail(req, user);
  if (!sent) throw new HttpError(503, "Email sending is not configured yet.");

  return json({ sent: true });
}

export default withErrorHandling(handler);
