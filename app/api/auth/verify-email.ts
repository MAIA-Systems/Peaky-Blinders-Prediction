import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../_db/client.js";
import { emailVerificationTokens, users } from "../_db/schema.js";
import { hashToken } from "../_lib/tokens.js";
import { errorResponse, HttpError, json, readJsonBody, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
const bodySchema = z.object({ token: z.string().min(1) });

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const body = await readJsonBody(req);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, "Invalid input");

  const tokenHash = hashToken(parsed.data.token);

  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), isNull(emailVerificationTokens.usedAt)))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    throw new HttpError(400, "This verification link is invalid or has expired.");
  }

  await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, row.id));
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));

  return json({ verified: true });
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);