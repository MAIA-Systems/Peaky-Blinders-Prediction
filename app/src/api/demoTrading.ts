import { delay } from "./client";
import { positions, transactions, wallet } from "./mockData";
import type { Position, Transaction, Wallet } from "@/types";

/**
 * The trading side of the product (markets, positions, P/L) is still a
 * client-side simulation — see markets.ts. This file is its wallet/ledger
 * counterpart, kept deliberately separate from api/wallet.ts (which is the
 * real, Postgres-backed money). Nothing here touches a real account balance.
 */

export async function getDemoWallet(): Promise<Wallet> {
  return delay({ ...wallet });
}

export async function getDemoPositions(): Promise<Position[]> {
  return delay([...positions]);
}

export async function getDemoActivity(): Promise<Transaction[]> {
  return delay([...transactions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
}

export async function cashoutDemoPosition(positionId: string): Promise<Wallet> {
  const index = positions.findIndex((p) => p.id === positionId);
  if (index === -1) throw new Error("Position not found");
  const position = positions[index];
  const value = Number((position.shares * position.currentPrice).toFixed(2));

  wallet.balance = Number((wallet.balance + value).toFixed(2));
  positions.splice(index, 1);
  transactions.unshift({
    id: `tx-${Date.now().toString(36)}`,
    type: "cashout",
    detail: `Cash out · ${position.marketQuestion}`,
    amount: value,
    createdAt: new Date().toISOString(),
  });

  return delay({ ...wallet }, 500);
}
