import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/api/admin";

export function useAdminUsers() {
  return useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });
}
