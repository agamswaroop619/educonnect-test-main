import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: () => get<any>("/attendance/me"),
  });
}
