import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useTransport() {
  return useQuery({
    queryKey: ["transport", "me"],
    queryFn: () => get<any>("/transport/me"),
    refetchInterval: 15_000, // poll every 15s for live ETA
  });
}
