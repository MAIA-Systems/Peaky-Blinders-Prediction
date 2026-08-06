/**
 * Every function in markets.ts / wallet.ts / auth.ts currently reads and
 * writes the in-memory arrays in mockData.ts and resolves after a fake
 * network delay, so the UI already behaves like it's talking to a server
 * (loading states, optimistic-feeling updates, latency).
 *
 * To wire up a real backend:
 *   1. Point API_BASE_URL at it (via an env var, e.g. import.meta.env.VITE_API_URL).
 *   2. Replace each mock function body with a `request()` call below —
 *      the function signatures and return types are already what the rest
 *      of the app expects, so callers (React Query hooks, pages) don't change.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? body?.message ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Fake network latency for the mock API layer; drop once every call is real. */
export function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiError extends Error {}
