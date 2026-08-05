import { request } from "./client";
import type { AuthCredentials, SignupPayload, User } from "@/types";

/**
 * Talks to the real backend (api/auth/*.ts — Postgres via Drizzle, bcrypt
 * password hashes, httpOnly session cookies). No client-side state here at
 * all; the cookie the server sets is the only thing carrying the session.
 */

interface ApiUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "standard" | "admin";
  createdAt: string;
  emailVerifiedAt: string | null;
}

function toUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    username: apiUser.username,
    email: apiUser.email,
    role: apiUser.role,
    emailVerifiedAt: apiUser.emailVerifiedAt,
    joinedAt: apiUser.createdAt,
  };
}

export interface SignupResult extends ReturnType<typeof toUser> {
  emailSent: boolean;
}

export async function login(credentials: AuthCredentials): Promise<User> {
  const apiUser = await request<ApiUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return toUser(apiUser);
}

export async function signup(payload: SignupPayload): Promise<SignupResult> {
  const apiUser = await request<ApiUser & { emailSent: boolean }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { ...toUser(apiUser), emailSent: apiUser.emailSent };
}

export async function getCurrentUser(): Promise<User | null> {
  const { user } = await request<{ user: ApiUser | null }>("/auth/me");
  return user ? toUser(user) : null;
}

export async function logout(): Promise<void> {
  await request<{ ok: true }>("/auth/logout", { method: "POST" });
}

export async function resendVerificationEmail(): Promise<void> {
  await request<{ sent: true }>("/auth/resend-verification", { method: "POST" });
}

export async function verifyEmail(token: string): Promise<void> {
  await request<{ verified: true }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<User> {
  const apiUser = await request<ApiUser>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
  return toUser(apiUser);
}

export const GOOGLE_SIGN_IN_URL = "/api/auth/google/start";
