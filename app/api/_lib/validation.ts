import { z } from "zod";

// Server-side validation — authoritative. The client (src/lib/validation.ts)
// re-implements the same shape for instant feedback, but every one of these
// rules is re-checked here because client-side validation is a UX nicety,
// never a security boundary.

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export const createCheckoutSessionSchema = z.object({
  amountGbp: z.number().int().min(1).max(10_000),
});
