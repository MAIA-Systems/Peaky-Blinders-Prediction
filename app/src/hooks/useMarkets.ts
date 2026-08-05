import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as marketsApi from "@/api/markets";
import type { Category, CreateMarketPayload, TradeSide } from "@/types";

export function useMarkets(category?: Category | "All") {
  return useQuery({
    queryKey: ["markets", category ?? "All"],
    queryFn: () => marketsApi.getMarkets(category),
  });
}

export function useMarket(id: string | undefined) {
  return useQuery({
    queryKey: ["markets", "detail", id],
    queryFn: () => marketsApi.getMarket(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMarketPayload) => marketsApi.createMarket(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["markets"] }),
  });
}

export function usePlaceTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ marketId, side, amountGbp }: { marketId: string; side: TradeSide; amountGbp: number }) =>
      marketsApi.placeTrade(marketId, side, amountGbp),
    onSuccess: (market) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["markets", "detail", market.id] });
      // These are the demo wallet/positions (see api/demoTrading.ts) — a
      // trade here never touches the real Stripe-funded balance.
      queryClient.invalidateQueries({ queryKey: ["demoWallet"] });
      queryClient.invalidateQueries({ queryKey: ["demoPositions"] });
      queryClient.invalidateQueries({ queryKey: ["demoActivity"] });
    },
  });
}
