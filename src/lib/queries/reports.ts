import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useReport() {
  return useQuery({
    queryKey: ["report", "me"],
    queryFn: () => get<any>("/reports/me"),
  });
}
