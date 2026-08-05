import { db } from "../_db/client.js";
import { transactions } from "../_db/schema.js";
import { requireUser } from "../_lib/authz.js";
import { getStripe } from "../_lib/stripe.js";
import { createCheckoutSessionSchema } from "../_lib/validation.js";
import { errorResponse, HttpError, json, readJsonBody, withErrorHandling } from "../_lib/http.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return errorResponse(405, "Method not allowed");

  const user = await requireUser(req);

  const body = await readJsonBody(req);
  const parsed = createCheckoutSessionSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const amountCents = parsed.data.amountGbp * 100;

  const stripe = getStripe(); // throws a clean 503 until STRIPE_SECRET_KEY is set
  const origin = new URL(req.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: amountCents,
          product_data: { name: "Peaky Blinders Prediction Market — wallet top-up" },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/wallet?deposit=success`,
    cancel_url: `${origin}/wallet?deposit=cancelled`,
    metadata: { userId: user.id },
  });

  // Recorded as pending now; the webhook flips it to completed (and credits
  // the wallet) once Stripe confirms the payment actually went through —
  // never trust the client-side redirect alone for that.
  await db.insert(transactions).values({
    userId: user.id,
    type: "deposit",
    status: "pending",
    amountCents,
    detail: "Card deposit via Stripe Checkout",
    stripeCheckoutSessionId: checkoutSession.id,
  });

  return json({ checkoutUrl: checkoutSession.url });
}

export default withErrorHandling(handler);
