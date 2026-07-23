import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useAdminClasses() {
  return useQuery({
    queryKey: ["admin", "classes"],
    queryFn: () => get<any[]>("/admin/classes"),
  });
}

export function useAdminClassStudents(classId: string) {
  return useQuery({
    queryKey: ["admin", "classes", classId, "students"],
    queryFn: () => get<any[]>(`/admin/classes/${classId}/students`),
    enabled: !!classId,
  });
}
