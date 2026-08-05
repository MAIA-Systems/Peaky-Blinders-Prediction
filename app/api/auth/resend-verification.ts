import { requireUser } from "../_lib/authz.js";
import { assertKeyNotRateLimited, recordKeyEvent } from "../_lib/rateLimit.js";
import { issueAndSendVerificationEmail } from "../_lib/verification.js";
import { errorResponse, HttpError, json, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
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

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);