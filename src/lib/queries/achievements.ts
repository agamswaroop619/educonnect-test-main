import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements", "me"],
    queryFn: () => get<any[]>("/achievements/me"),
  });
}
