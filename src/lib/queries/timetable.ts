import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useTimetable() {
  return useQuery({
    queryKey: ["timetable", "me"],
    queryFn: () => get<any>("/timetable/me"),
  });
}
