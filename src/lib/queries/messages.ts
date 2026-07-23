import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "@/lib/api-client";

export function useMessageThreads() {
  return useQuery({
    queryKey: ["messages", "threads"],
    queryFn: () => get<any[]>("/messages"),
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: ["messages", "thread", id],
    queryFn: () => get<any>(`/messages/${id}`),
    enabled: !!id,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { to_user_id: string; subject?: string; body: string }) =>
      post("/messages", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useReplyToThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      post(`/messages/${threadId}/reply`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useMarkThreadRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => put(`/messages/${threadId}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}
