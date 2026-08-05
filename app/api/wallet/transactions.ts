import { desc, eq } from "drizzle-orm";
import { db } from "../_db/client.js";
import { transactions } from "../_db/schema.js";
import { requireUser } from "../_lib/authz.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

import { toNodeHandler } from "../_lib/adapter.js";
async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  const user = await requireUser(req);
  const rows = await db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.createdAt));

  return json({ transactions: rows });
}

// Named export: the raw Fetch-style handler, used directly by
// scripts/test-backend.ts and scripts/dev-server.ts.
export const fetchHandler = withErrorHandling(handler);
export default toNodeHandler(fetchHandler);