import { delay } from "./client";
import { markets, positions, transactions, wallet } from "./mockData";
import { generatePriceHistory, seedFromString } from "@/lib/priceHistory";
import type { Category, CreateMarketPayload, Market, TradeSide } from "@/types";

export async function getMarkets(category?: Category | "All"): Promise<Market[]> {
  const list = !category || category === "All" ? markets : markets.filter((m) => m.category === category);
  return delay(list);
}

export async function getMarket(id: string): Promise<Market | undefined> {
  return delay(markets.find((m) => m.id === id));
}

export async function createMarket(payload: CreateMarketPayload): Promise<Market> {
  const id = payload.question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) + `-${Date.now().toString(36)}`;

  const market: Market = {
    id,
    question: payload.question,
    category: payload.category,
    rules: payload.rules,
    yesProbability: payload.initialYesProbability,
    volume24h: 0,
    volumeTotal: payload.seedLiquidity,
    liquidity: payload.seedLiquidity,
    closesAt: payload.closesAt,
    createdAt: new Date().toISOString(),
    community: true,
    priceHistory: generatePriceHistory(seedFromString(id), payload.initialYesProbability),
    resolved: false,
  };

  markets.unshift(market);
  return delay(market, 500);
}

const TRADE_IMPACT = 0.015;

export async function placeTrade(marketId: string, side: TradeSide, amountGbp: number): Promise<Market> {
  const market = markets.find((m) => m.id === marketId);
  if (!market) throw new Error("Market not found");
  if (amountGbp > wallet.balance) throw new Error("Insufficient balance");

  wallet.balance = Number((wallet.balance - amountGbp).toFixed(2));

  const fillPrice = side === "YES" ? market.yesProbability : 1 - market.yesProbability;
  const shares = Number((amountGbp / fillPrice).toFixed(2));

  const existing = positions.find((p) => p.marketId === marketId && p.side === side);
  if (existing) {
    const totalCost = existing.avgPrice * existing.shares + amountGbp;
    existing.shares = Number((existing.shares + shares).toFixed(2));
    existing.avgPrice = Number((totalCost / existing.shares).toFixed(4));
  } else {
    positions.push({
      id: `pos-${Date.now().toString(36)}`,
      marketId,
      marketQuestion: market.question,
      side,
      shares,
      avgPrice: fillPrice,
      currentPrice: fillPrice,
    });
  }

  const delta = side === "YES" ? TRADE_IMPACT : -TRADE_IMPACT;
  market.yesProbability = Number(Math.min(0.98, Math.max(0.02, market.yesProbability + delta)).toFixed(3));
  market.volume24h = Number((market.volume24h + amountGbp).toFixed(2));
  market.volumeTotal = Number((market.volumeTotal + amountGbp).toFixed(2));
  market.priceHistory = [...market.priceHistory.slice(1), { t: market.priceHistory.length, price: market.yesProbability }];

  for (const position of positions) {
    if (position.marketId === marketId) {
      position.currentPrice = position.side === "YES" ? market.yesProbability : 1 - market.yesProbability;
    }
  }

  transactions.unshift({
    id: `tx-${Date.now().toString(36)}`,
    type: "trade",
    detail: `${side} · ${market.question}`,
    amount: -amountGbp,
    createdAt: new Date().toISOString(),
  });

  return delay(market, 400);
}
