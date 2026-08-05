import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// neon-http: stateless, one query per HTTP call — the right driver for
// short-lived serverless functions (no connection pool to manage/leak).
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
