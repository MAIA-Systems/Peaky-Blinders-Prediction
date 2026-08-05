import { pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

// Money is stored as integer minor units (cents/pence) everywhere — never
// floating point — to avoid rounding bugs in balances and ledger entries.

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    // Nullable: accounts created via Google Sign-In have no local password.
    passwordHash: text("password_hash"),
    googleId: text("google_id"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    role: text("role", { enum: ["standard", "admin"] }).notNull().default("standard"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // email/username uniqueness relies on the application layer always
  // normalizing to lowercase before insert/lookup (see api/_lib/auth.ts) —
  // these are plain indexes over the stored (already-normalized) value.
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_google_id_idx").on(table.googleId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // SHA-256 hash of the raw session token. The raw token only ever lives
    // in the httpOnly cookie on the client — if the DB leaks, sessions
    // can't be replayed from it.
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sessions_token_hash_idx").on(table.tokenHash), index("sessions_user_id_idx").on(table.userId)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    ip: text("ip"),
    succeeded: boolean("succeeded").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("login_attempts_email_created_idx").on(table.email, table.createdAt)],
);

// Generic throttle for anything that isn't login (password-reset requests,
// verification-email resends): count rows for a `key` string in a window.
// Login keeps its own table above because it also doubles as an audit trail
// and differentiates success/failure — this one doesn't need either.
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rate_limit_events_key_created_idx").on(table.key, table.createdAt)],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_hash_idx").on(table.tokenHash),
    index("email_verification_tokens_user_id_idx").on(table.userId),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_idx").on(table.tokenHash),
    index("password_reset_tokens_user_id_idx").on(table.userId),
  ],
);

export const wallets = pgTable("wallets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balanceCents: integer("balance_cents").notNull().default(0),
  currency: text("currency").notNull().default("GBP"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["deposit", "cashout", "trade"] }).notNull(),
    status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("completed"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("GBP"),
    detail: text("detail").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    uniqueIndex("transactions_stripe_checkout_session_idx").on(table.stripeCheckoutSessionId),
  ],
);
