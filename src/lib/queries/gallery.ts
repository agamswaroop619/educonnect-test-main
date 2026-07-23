import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: () => get<any[]>("/gallery"),
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: ["gallery", "album", id],
    queryFn: () => get<any>(`/gallery/${id}`),
    enabled: !!id,
  });
}
