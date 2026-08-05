import { desc, eq } from "drizzle-orm";
import { db } from "../_db/client.js";
import { users, wallets } from "../_db/schema.js";
import { requireAdmin } from "../_lib/authz.js";
import { errorResponse, json, withErrorHandling } from "../_lib/http.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return errorResponse(405, "Method not allowed");

  await requireAdmin(req);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      balanceCents: wallets.balanceCents,
    })
    .from(users)
    .leftJoin(wallets, eq(users.id, wallets.userId))
    .orderBy(desc(users.createdAt));

  return json({ users: rows });
}

export default withErrorHandling(handler);
