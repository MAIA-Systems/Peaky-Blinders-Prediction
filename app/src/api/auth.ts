import { delay } from "./client";
import { currentUser } from "./mockData";
import type { AuthCredentials, SignupPayload, User } from "@/types";

/**
 * Mock auth: a plaintext in-memory user store + a session id in
 * localStorage. Obviously not how you'd do this against a real backend
 * (cookies/JWTs, hashed passwords, server-side session) — this exists so
 * the Login/Signup pages and ProtectedRoute have something real to call
 * while the actual backend doesn't exist yet. Swap the bodies below for
 * `request()` calls (see client.ts) once it does.
 */

interface StoredUser extends User {
  password: string;
}

const SESSION_KEY = "pbpm_session_user_id";

const users: StoredUser[] = [{ ...currentUser, password: "peakyblinders" }];

function toPublicUser(user: StoredUser): User {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export async function login({ email, password }: AuthCredentials): Promise<User> {
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }
  localStorage.setItem(SESSION_KEY, user.id);
  return delay(toPublicUser(user), 500);
}

export async function signup(payload: SignupPayload): Promise<User> {
  if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error("An account with this email already exists");
  }
  if (users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
    throw new Error("That username is taken");
  }

  const user: StoredUser = {
    id: `user-${Date.now().toString(36)}`,
    name: payload.name,
    username: payload.username,
    email: payload.email,
    password: payload.password,
    joinedAt: new Date().toISOString(),
    bio: "Trading culture since day one.",
  };
  users.push(user);
  localStorage.setItem(SESSION_KEY, user.id);
  return delay(toPublicUser(user), 600);
}

export async function getCurrentUser(): Promise<User | null> {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return delay(null, 150);
  const user = users.find((u) => u.id === id);
  return delay(user ? toPublicUser(user) : null, 150);
}

export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  return delay(undefined, 150);
}

export const DEMO_CREDENTIALS = { email: "ben@example.com", password: "peakyblinders" };
