import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useFees() {
  return useQuery({
    queryKey: ["fees", "me"],
    queryFn: () => get<any>("/fees/me"),
  });
}
