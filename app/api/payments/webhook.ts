import { eq, sql } from "drizzle-orm";
import { db } from "../_db/client.js";
import { transactions, wallets } from "../_db/schema.js";
import { getStripe, getWebhookSecret } from "../_lib/stripe.js";
import { errorResponse, HttpError, json, withErrorHandling } from "../_lib/http.js";
import type Stripe from "stripe";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const [transaction] = await db.select().from(transactions).where(eq(transactions.stripeCheckoutSessionId, session.id)).limit(1);

  if (!transaction) {
    console.warn(`Webhook: no matching transaction for checkout session ${session.id}`);
    return;
  }
  // Idempotent: Stripe retries webhook delivery, so a repeat of the same
  // event must not credit the wallet twice.
  if (transaction.status === "completed") return;

  await db.update(transactions).set({
    status: "completed",
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
  }).where(eq(transactions.id, transaction.id));

  await db
    .update(wallets)
    .set({ balanceCents: sql`${wallets.balanceCents} + ${transaction.amountCents}`, updatedAt: new Date() })
    .where(eq(wallets.userId, transaction.userId));
}

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const signature = req.headers.get("stripe-signature");
  if (!signature) throw new HttpError(400, "Missing stripe-signature header");

  // Must verify against the raw, unparsed body — Stripe signs the exact
  // bytes it sent, so JSON.parse-then-restringify would break verification.
  const rawBody = await req.text();

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    throw new HttpError(400, "Invalid signature");
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object);
  }

  return json({ received: true });
}

export default withErrorHandling(handler);
