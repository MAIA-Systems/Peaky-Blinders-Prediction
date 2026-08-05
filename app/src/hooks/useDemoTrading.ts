import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as demoTradingApi from "@/api/demoTrading";

export function useDemoWallet() {
  return useQuery({ queryKey: ["demoWallet"], queryFn: demoTradingApi.getDemoWallet });
}

export function useDemoPositions() {
  return useQuery({ queryKey: ["demoPositions"], queryFn: demoTradingApi.getDemoPositions });
}

export function useDemoActivity() {
  return useQuery({ queryKey: ["demoActivity"], queryFn: demoTradingApi.getDemoActivity });
}

export function useDemoCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (positionId: string) => demoTradingApi.cashoutDemoPosition(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demoWallet"] });
      queryClient.invalidateQueries({ queryKey: ["demoPositions"] });
      queryClient.invalidateQueries({ queryKey: ["demoActivity"] });
    },
  });
}
