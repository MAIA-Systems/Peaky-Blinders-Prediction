import { useQuery } from "@tanstack/react-query";
import { getTrendingStream } from "@/api/twitch";

export function useTrendingStream() {
  return useQuery({
    queryKey: ["twitch", "trending"],
    queryFn: getTrendingStream,
    staleTime: 60_000,
    refetchInterval: 60_000, // "most trending" should mean "still trending" if the page is left open
    retry: false, // a 503 (not configured) shouldn't retry-loop
  });
}
