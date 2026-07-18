import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";

export function useChatHistory() {
  return useQuery({
    queryKey: ["ai", "history"],
    queryFn: () => get<any[]>("/ai/chat/history"),
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => post<any>("/ai/chat", { message }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "history"] }),
  });
}
