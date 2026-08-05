import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const DEMO_USERS = [
  { name: "Ben H", username: "benh", email: "ben@example.com", password: "peakyblinders", role: "standard" as const },
  { name: "Adam", username: "adam", email: "adam@example.com", password: "peakyblinders-admin", role: "admin" as const },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set (expected in .env.local)");

  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  for (const demo of DEMO_USERS) {
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, demo.email)).limit(1);
    if (existing) {
      console.log(`Skip (already exists): ${demo.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(demo.password, 12);
    const [user] = await db
      .insert(schema.users)
      .values({ name: demo.name, username: demo.username, email: demo.email, passwordHash, role: demo.role })
      .returning({ id: schema.users.id });

    await db.insert(schema.wallets).values({ userId: user.id, balanceCents: demo.role === "admin" ? 0 : 91755 });

    console.log(`Created ${demo.role} user: ${demo.email} / ${demo.password}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
