import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as walletApi from "@/api/wallet";
import type { DepositMethod } from "@/types";

export function useWallet() {
  return useQuery({ queryKey: ["wallet"], queryFn: walletApi.getWallet });
}

export function usePositions() {
  return useQuery({ queryKey: ["positions"], queryFn: walletApi.getPositions });
}

export function useTransactions() {
  return useQuery({ queryKey: ["transactions"], queryFn: walletApi.getTransactions });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amountGbp, method, detail }: { amountGbp: number; method: DepositMethod; detail: string }) =>
      walletApi.deposit(amountGbp, method, detail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCashout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (positionId: string) => walletApi.cashout(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
