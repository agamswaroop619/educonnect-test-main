import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";

export function useHomework() {
  return useQuery({
    queryKey: ["homework", "me"],
    queryFn: () => get<any[]>("/homework/me"),
  });
}

export function useSubmitHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fileUrl }: { id: string; fileUrl?: string }) =>
      post(`/homework/${id}/submit`, { file_url: fileUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
  });
}
