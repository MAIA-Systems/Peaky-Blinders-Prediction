import { eq } from "drizzle-orm";
import { db } from "../_db/client.js";
import { wallets } from "../_db/schema.js";
import { requireUser } from "../_lib/authz.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  const user = await requireUser(req);
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);

  // Every account gets a wallet row at signup/OAuth-creation — this is a
  // defensive fallback, not the normal path.
  return json({ balanceCents: wallet?.balanceCents ?? 0, currency: wallet?.currency ?? "GBP" });
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);