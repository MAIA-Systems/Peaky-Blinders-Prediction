import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set (expected in .env.local)");

  const sql = neon(connectionString);
  const db = drizzle(sql);

  console.log("Applying migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
