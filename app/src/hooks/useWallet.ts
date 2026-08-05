import { useMutation, useQuery } from "@tanstack/react-query";
import * as walletApi from "@/api/wallet";

export function useWallet() {
  return useQuery({ queryKey: ["wallet"], queryFn: walletApi.getWallet });
}

export function useTransactions() {
  return useQuery({ queryKey: ["transactions"], queryFn: walletApi.getTransactions });
}

export function useCreateDepositCheckout() {
  return useMutation({
    mutationFn: (amountGbp: number) => walletApi.createDepositCheckout(amountGbp),
  });
}
