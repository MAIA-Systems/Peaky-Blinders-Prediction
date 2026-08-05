import { desc, eq } from "drizzle-orm";
import { db } from "../_db/client";
import { transactions } from "../_db/schema";
import { requireUser } from "../_lib/authz";
import { errorResponse, json, withErrorHandling } from "../_lib/http";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  const user = await requireUser(req);
  const rows = await db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.createdAt));

  return json({ transactions: rows });
}

export default withErrorHandling(handler);
