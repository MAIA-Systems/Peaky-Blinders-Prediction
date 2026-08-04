export const CATEGORIES = ["Film & TV", "Sports", "Politics", "Music", "Esports", "Crypto"] as const;
export type Category = (typeof CATEGORIES)[number];

export type TradeSide = "YES" | "NO";

export interface PricePoint {
  t: number;
  price: number;
}

export interface Market {
  id: string;
  question: string;
  category: Category;
  rules: string;
  imageUrl?: string;
  yesProbability: number;
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  closesAt: string;
  createdAt: string;
  community: boolean;
  creatorUsername?: string;
  priceHistory: PricePoint[];
  resolved: boolean;
  outcome?: TradeSide;
}

export interface Position {
  id: string;
  marketId: string;
  marketQuestion: string;
  side: TradeSide;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

export type TransactionType = "deposit" | "cashout" | "trade";
export type DepositMethod = "card" | "apple_pay" | "google_pay" | "crypto";

export interface Transaction {
  id: string;
  type: TransactionType;
  detail: string;
  amount: number;
  method?: DepositMethod;
  createdAt: string;
}

export interface Wallet {
  balance: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  joinedAt: string;
  socials?: { x?: string; twitch?: string };
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupPayload extends AuthCredentials {
  name: string;
  username: string;
}

export interface CreateMarketPayload {
  question: string;
  category: Category;
  rules: string;
  closesAt: string;
  initialYesProbability: number;
  seedLiquidity: number;
}
