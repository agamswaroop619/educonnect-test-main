import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useCirculars() {
  return useQuery({
    queryKey: ["circulars"],
    queryFn: () => get<any[]>("/circulars"),
  });
}

export function useCircular(id: string) {
  return useQuery({
    queryKey: ["circulars", id],
    queryFn: () => get<any>(`/circulars/${id}`),
    enabled: !!id,
  });
}
