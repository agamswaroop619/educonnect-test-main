import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useStudentProfile() {
  return useQuery({
    queryKey: ["student", "me"],
    queryFn: () => get<any>("/students/me"),
  });
}
