import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useCalendar(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({
    queryKey: ["calendar", month, year],
    queryFn: () => get<any[]>(`/calendar${qs}`),
  });
}
