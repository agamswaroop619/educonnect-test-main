import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useCourses() {
  return useQuery({
    queryKey: ["courses", "me"],
    queryFn: () => get<any[]>("/courses/me"),
  });
}
