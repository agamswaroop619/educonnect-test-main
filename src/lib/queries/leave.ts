import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave", "me"],
    queryFn: () => get<any[]>("/leaves/me"),
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { from_date: string; to_date: string; reason: string }) =>
      post("/leaves", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave"] }),
  });
}
