import { request } from "./client";

export interface TrendingStream {
  channel: string;
  displayName: string;
  title: string;
  viewers: number;
}

export async function getTrendingStream(): Promise<TrendingStream | null> {
  const { stream } = await request<{ stream: TrendingStream | null }>("/twitch/trending");
  return stream;
}
