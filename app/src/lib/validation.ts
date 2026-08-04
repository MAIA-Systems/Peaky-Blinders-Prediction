import { z } from "zod";
import { CATEGORIES } from "@/types";

// Same constraints as the original Create Market form (question/rules length,
// probability range, close date must be in the future).
export const createMarketSchema = z.object({
  question: z.string().min(12, "Ask a clear question").max(120, "Keep it under 120 characters"),
  category: z.enum(CATEGORIES),
  rules: z.string().min(15, "Describe how the market resolves").max(600),
  closesAt: z.string().refine((value) => new Date(value).getTime() > Date.now(), "Must be in the future"),
  initialYesProbability: z.number().min(0.01).max(0.99),
  seedLiquidity: z.number().min(1),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min. 8 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your name"),
    username: z
      .string()
      .min(3, "Min. 3 characters")
      .max(20, "Max. 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Min. 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
