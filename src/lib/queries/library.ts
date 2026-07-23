import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useLibrary() {
  return useQuery({
    queryKey: ["library", "me"],
    queryFn: () => get<any>("/library/me"),
  });
}
