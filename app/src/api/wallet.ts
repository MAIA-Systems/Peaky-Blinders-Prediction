import { request } from "./client";
import type { Transaction, Wallet } from "@/types";

/**
 * The real wallet — backed by Postgres (api/wallet/*.ts, api/payments/*.ts)
 * and funded through actual Stripe Checkout. This is deliberately separate
 * from api/demoTrading.ts, which is the simulated-trading side of the
 * product and never touches this balance.
 */

interface ApiWallet {
  balanceCents: number;
  currency: string;
}

interface ApiTransaction {
  id: string;
  type: Transaction["type"];
  status: "pending" | "completed" | "failed";
  amountCents: number;
  currency: string;
  detail: string;
  createdAt: string;
}

export async function getWallet(): Promise<Wallet> {
  const apiWallet = await request<ApiWallet>("/wallet");
  return { balance: apiWallet.balanceCents / 100 };
}

export async function getTransactions(): Promise<Transaction[]> {
  const { transactions } = await request<{ transactions: ApiTransaction[] }>("/wallet/transactions");
  return transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    detail: tx.status === "pending" ? `${tx.detail} (pending)` : tx.detail,
    amount: tx.amountCents / 100,
    createdAt: tx.createdAt,
  }));
}

/** Kicks off a real Stripe Checkout session and returns the URL to redirect
 * the browser to — deposits are never instant, so there's no "deposit()"
 * that resolves with an updated balance the way the old mock had. The
 * balance only actually changes once Stripe's webhook confirms payment. */
export async function createDepositCheckout(amountGbp: number): Promise<{ checkoutUrl: string }> {
  return request<{ checkoutUrl: string }>("/payments/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ amountGbp }),
  });
}
