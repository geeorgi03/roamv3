import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../../utils/supabase";

export interface InboxClip {
  id: string;
  userId: string;
  sessionId: null;
  mediaType: "video" | "audio";
  videoUrl?: string;
  audioUrl?: string;
  duration?: number; // seconds
  thumbnailUrl?: string;
  createdAt: string;
}

export function useInbox() {
  const [clips, setClips] = useState<InboxClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest("/inbox");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Inbox load failed (${res.status}): ${body.error || res.statusText}`);
      }
      const data = await res.json();
      setClips(data.clips || []);
    } catch (err) {
      console.error("Inbox load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveClip = async (clipData: Omit<InboxClip, "id" | "userId" | "sessionId">) => {
    const res = await apiRequest("/inbox", {
      method: "POST",
      body: JSON.stringify(clipData),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Save failed (${res.status}): ${body.error || res.statusText}`);
    }
    const data = await res.json();
    setClips((prev) => [data.clip, ...prev]);
    return data.clip as InboxClip;
  };

  const assignClip = async (clipId: string, sessionId: string) => {
    const res = await apiRequest(`/inbox/${clipId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Assign failed (${res.status}): ${body.error || res.statusText}`);
    }
    setClips((prev) => prev.filter((c) => c.id !== clipId));
    return (await res.json()).clip;
  };

  const deleteClip = async (clipId: string) => {
    const res = await apiRequest(`/inbox/${clipId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  // Clips older than 48 hours
  const staleClips = clips.filter((c) => {
    const age = Date.now() - new Date(c.createdAt).getTime();
    return age > 48 * 60 * 60 * 1000;
  });

  return {
    clips,
    loading,
    error,
    staleClips,
    saveClip,
    assignClip,
    deleteClip,
    refresh: load,
  };
}

