import { delay } from "./client";
import { positions, transactions, wallet } from "./mockData";
import type { DepositMethod, Position, Transaction, Wallet } from "@/types";

export async function getWallet(): Promise<Wallet> {
  return delay({ ...wallet });
}

export async function getPositions(): Promise<Position[]> {
  return delay([...positions]);
}

export async function getTransactions(): Promise<Transaction[]> {
  return delay([...transactions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
}

export async function deposit(amountGbp: number, method: DepositMethod, detail: string): Promise<Wallet> {
  wallet.balance = Number((wallet.balance + amountGbp).toFixed(2));
  transactions.unshift({
    id: `tx-${Date.now().toString(36)}`,
    type: "deposit",
    detail,
    amount: amountGbp,
    method,
    createdAt: new Date().toISOString(),
  });
  return delay({ ...wallet }, 700);
}

export async function cashout(positionId: string): Promise<Wallet> {
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
