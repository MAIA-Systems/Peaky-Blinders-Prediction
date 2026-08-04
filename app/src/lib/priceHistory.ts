import type { PricePoint } from "@/types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Deterministic random-walk price history for a market's YES probability.
 * Same idea as the sparkline generator in the original bundle: seed a tiny
 * LCG off the market id so charts are stable across renders without storing
 * every tick server-side.
 */
export function generatePriceHistory(seed: number, targetProbability: number, points = 30, volatility = 0.05): PricePoint[] {
  const rand = seededRandom(seed);
  const history: PricePoint[] = [];
  let price = clamp(targetProbability + (rand() - 0.5) * 0.28, 0.1, 0.9);

  for (let i = 0; i < points; i++) {
    const drift = (targetProbability - price) * 0.08;
    const noise = (rand() - 0.5) * volatility;
    price = clamp(price + drift + noise, 0.02, 0.98);
    history.push({ t: i, price: Number(price.toFixed(3)) });
  }

  history[history.length - 1] = { t: points - 1, price: targetProbability };
  return history;
}

export function seedFromString(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}
