import { generatePriceHistory, seedFromString } from "@/lib/priceHistory";
import type { Market, Position, Transaction } from "@/types";

/**
 * In-memory mock backend. Every function in src/api/*.ts reads and writes
 * these arrays instead of calling a server. This is the one file that goes
 * away once a real backend exists — see README.md for the swap plan.
 */

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
const daysFromNow = (n: number) => new Date(now + n * 86_400_000).toISOString();

function withHistory(market: Omit<Market, "priceHistory">): Market {
  return { ...market, priceHistory: generatePriceHistory(seedFromString(market.id), market.yesProbability) };
}

export const markets: Market[] = [
  withHistory({
    id: "tommy-final-scene",
    question: "Will Tommy Shelby return in the Peaky Blinders film's final scene?",
    category: "Film & TV",
    rules:
      "Resolves YES if the theatrical or streaming release of the Peaky Blinders film depicts Tommy Shelby on screen, alive, during the final scene. Resolves NO otherwise. Source of truth: the officially released cut of the film.",
    yesProbability: 0.38,
    volume24h: 18_420,
    volumeTotal: 214_800,
    liquidity: 42_000,
    closesAt: daysFromNow(120),
    createdAt: daysAgo(58),
    community: false,
    resolved: false,
  }),
  withHistory({
    id: "tommygungaming-ranked",
    question: "Will @TommyGunGaming win his next ranked match?",
    category: "Esports",
    rules:
      "Resolves YES if TommyGunGaming's next completed ranked match (as shown on his official stream) ends in a win. Resolves NO on a loss. Void and refunded if the match is not played within 48 hours of market close.",
    yesProbability: 0.56,
    volume24h: 2_105,
    volumeTotal: 9_840,
    liquidity: 3_200,
    closesAt: daysFromNow(1),
    createdAt: daysAgo(14),
    community: true,
    creatorUsername: "benh",
    resolved: false,
  }),
  withHistory({
    id: "england-world-cup-2026",
    question: "Will England win the 2026 World Cup?",
    category: "Sports",
    rules:
      "Resolves YES if the England men's national team is declared champion of the 2026 FIFA World Cup. Resolves NO otherwise. Source of truth: official FIFA result.",
    yesProbability: 0.14,
    volume24h: 31_650,
    volumeTotal: 402_100,
    liquidity: 88_500,
    closesAt: daysFromNow(21),
    createdAt: daysAgo(140),
    community: false,
    resolved: false,
  }),
  withHistory({
    id: "uk-election-2026",
    question: "Will there be a UK general election before the end of 2026?",
    category: "Politics",
    rules:
      "Resolves YES if a UK general election is held on or before 31 Dec 2026. Resolves NO otherwise. Source of truth: UK Parliament official results.",
    yesProbability: 0.09,
    volume24h: 6_720,
    volumeTotal: 51_300,
    liquidity: 15_000,
    closesAt: daysFromNow(149),
    createdAt: daysAgo(70),
    community: false,
    resolved: false,
  }),
  withHistory({
    id: "fontaines-glastonbury-2027",
    question: "Will Fontaines D.C. headline Glastonbury 2027?",
    category: "Music",
    rules:
      "Resolves YES if Fontaines D.C. is announced and performs as a headline act (top-of-poster billing on any main stage) at Glastonbury 2027. Resolves NO otherwise.",
    yesProbability: 0.22,
    volume24h: 1_240,
    volumeTotal: 7_650,
    liquidity: 2_800,
    closesAt: daysFromNow(300),
    createdAt: daysAgo(9),
    community: true,
    creatorUsername: "ada_thorne",
    resolved: false,
  }),
  withHistory({
    id: "btc-150k-2027",
    question: "Will BTC close above $150K before 2027?",
    category: "Crypto",
    rules:
      "Resolves YES if the BTC/USD daily close on a major reference exchange (Coinbase) exceeds $150,000 at any point before 1 Jan 2027. Resolves NO otherwise.",
    yesProbability: 0.31,
    volume24h: 44_900,
    volumeTotal: 611_000,
    liquidity: 120_000,
    closesAt: daysFromNow(150),
    createdAt: daysAgo(200),
    community: false,
    resolved: false,
  }),
  withHistory({
    id: "peaky-film-2026-release",
    question: "Will the Peaky Blinders film release in UK cinemas in 2026?",
    category: "Film & TV",
    rules:
      "Resolves YES if the Peaky Blinders theatrical film has a general UK cinema release date on or before 31 Dec 2026, per the studio's official announcement. Resolves NO otherwise.",
    yesProbability: 0.71,
    volume24h: 9_300,
    volumeTotal: 88_400,
    liquidity: 26_000,
    closesAt: daysFromNow(149),
    createdAt: daysAgo(90),
    community: false,
    resolved: false,
  }),
];

export let wallet = { balance: 917.55 };

export const positions: Position[] = [
  { id: "pos-1", marketId: "tommygungaming-ranked", marketQuestion: "Will @TommyGunGaming win his next ranked match?", side: "YES", shares: 45, avgPrice: 0.5, currentPrice: 0.56 },
  { id: "pos-2", marketId: "tommy-final-scene", marketQuestion: "Will Tommy Shelby return in the Peaky Blinders film's final scene?", side: "NO", shares: 138, avgPrice: 0.64, currentPrice: 0.62 },
  { id: "pos-3", marketId: "england-world-cup-2026", marketQuestion: "Will England win the 2026 World Cup?", side: "NO", shares: 32, avgPrice: 0.87, currentPrice: 0.86 },
];

export const transactions: Transaction[] = [
  { id: "tx-1", type: "deposit", detail: "Card deposit •••• 4242", amount: 100, method: "card", createdAt: daysAgo(21) },
  { id: "tx-2", type: "cashout", detail: "Cash out · Will @TommyGunGaming win his next ranked match?", amount: 24.6, createdAt: daysAgo(1) },
  { id: "tx-3", type: "trade", detail: "YES · Will @TommyGunGaming win his next ranked match?", amount: -25.25, createdAt: daysAgo(1) },
  { id: "tx-4", type: "trade", detail: "YES · Will @TommyGunGaming win his next ranked match?", amount: -25.25, createdAt: daysAgo(1) },
  { id: "tx-5", type: "trade", detail: "YES · Will @TommyGunGaming win his next ranked match?", amount: -25.25, createdAt: daysAgo(4) },
  { id: "tx-6", type: "trade", detail: "NO · Will @TommyGunGaming win his next ranked match?", amount: -5.05, createdAt: daysAgo(4) },
  { id: "tx-7", type: "trade", detail: "NO · Will Tommy Shelby return in the Peaky Blinders film's final scene?", amount: -101, createdAt: daysAgo(4) },
  { id: "tx-8", type: "trade", detail: "NO · Will Tommy Shelby return in the Peaky Blinders film's final scene?", amount: -25.25, createdAt: daysAgo(14) },
];
