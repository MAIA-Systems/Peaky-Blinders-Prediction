import Stripe from "stripe";
import { HttpError } from "./http";

let client: Stripe | null = null;

/** Constructed lazily so the app doesn't crash at import time when Stripe
 * keys aren't set yet — callers get a clean 503 instead. */
export function getStripe(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new HttpError(503, "Payments are not configured yet (STRIPE_SECRET_KEY missing).");
  }

  client = new Stripe(secretKey);
  return client;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new HttpError(503, "Payments are not configured yet (STRIPE_WEBHOOK_SECRET missing).");
  }
  return secret;
}
