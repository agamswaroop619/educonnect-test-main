import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useClassRoster(filters?: { status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({
    queryKey: ["teachers", "class", filters],
    queryFn: () => get<any[]>(`/teachers/me/class${qs}`),
  });
}

export function useTeacherSubjects() {
  return useQuery({
    queryKey: ["teachers", "subjects"],
    queryFn: () => get<any[]>("/teachers/me/subjects"),
  });
}
