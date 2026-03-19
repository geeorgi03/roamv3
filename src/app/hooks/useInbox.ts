import { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest, uploadFile } from "../../utils/supabase";
import { getPendingClips, type PendingClip } from "../lib/pendingQueue";
import { syncPendingClips } from "../lib/syncPendingClips";
import { useOnlineStatus } from "./useOnlineStatus";

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
  pending?: boolean;
  pendingStatus?: "pending" | "syncing" | "failed";
}

export function useInbox() {
  const [serverClips, setServerClips] = useState<InboxClip[]>([]);
  const [pendingClips, setPendingClips] = useState<PendingClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const online = useOnlineStatus();

  const refreshPending = useCallback(() => {
    setPendingClips(getPendingClips());
  }, []);

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
      setServerClips(data.clips || []);
    } catch (err) {
      console.error("Inbox load error:", err);
      // Treat offline/network fetch failures as non-fatal so local pending items can still render.
      const isOfflineFetchFailure =
        !navigator.onLine ||
        (err instanceof Error && /failed to fetch|networkerror|network request failed|load failed|offline/i.test(err.message));
      if (isOfflineFetchFailure) {
        setError("You're offline — showing anything saved locally. We'll sync when you're back online.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load inbox");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const saveClip = async (clipData: Omit<InboxClip, "id" | "userId" | "sessionId">) => {
    const payload: Record<string, unknown> = {
      local_id: crypto.randomUUID(),
      recorded_at: clipData.createdAt,
      label: clipData.mediaType === "audio" ? "Voice memo" : "Video clip",
      media_type: clipData.mediaType,
    };
    if (clipData.videoUrl) {
      payload.video_storage_path = clipData.videoUrl;
    }
    if (clipData.audioUrl) {
      payload.audio_storage_path = clipData.audioUrl;
    }
    if (clipData.duration !== undefined) {
      payload.duration_ms = Math.round(clipData.duration * 1000);
    }
    if (clipData.thumbnailUrl) {
      payload.thumbnail_storage_path = clipData.thumbnailUrl;
    }
    const res = await apiRequest("/inbox", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Save failed (${res.status}): ${body.error || res.statusText}`);
    }
    const data = await res.json();
    const clip = data.clip;
    const mappedClip: InboxClip = {
      id: clip.id,
      userId: clip.user_id,
      sessionId: clip.session_id,
      mediaType: clip.label === "Voice memo" ? "audio" : "video",
      videoUrl: clip.video_storage_path,
      audioUrl: clip.audio_storage_path,
      duration: clip.duration_ms ? clip.duration_ms / 1000 : undefined,
      thumbnailUrl: clip.thumbnail_storage_path,
      createdAt: clip.recorded_at || clip.created_at,
    };
    setServerClips((prev) => [mappedClip, ...prev]);
    return mappedClip;
  };

  const assignClip = async (clipId: string, sessionId: string, sectionLabel?: string) => {
    const payload: { sessionId: string; session_id?: string; sectionLabel?: string; section_label?: string } = {
      sessionId,
      session_id: sessionId,
    };
    if (sectionLabel) {
      payload.sectionLabel = sectionLabel;
      payload.section_label = sectionLabel;
    }
    const res = await apiRequest(`/inbox/${clipId}/assign`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Assign failed (${res.status}): ${body.error || res.statusText}`);
    }
    setServerClips((prev) => prev.filter((c) => c.id !== clipId));
    return (await res.json()).clip;
  };

  const deleteClip = async (clipId: string) => {
    const res = await apiRequest(`/inbox/${clipId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setServerClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  const clips = useMemo(() => {
    const mappedPending: InboxClip[] = pendingClips.map((p) => ({
      id: p.tempId,
      userId: "local",
      sessionId: null,
      mediaType: p.mediaType,
      videoUrl: p.mediaType === "video" ? p.blobBase64 : undefined,
      audioUrl: p.mediaType === "audio" ? p.blobBase64 : undefined,
      duration: p.duration,
      createdAt: p.createdAt,
      pending: true,
      pendingStatus: p.status,
    }));
    return [...mappedPending, ...serverClips];
  }, [pendingClips, serverClips]);

  const syncPending = useCallback(async () => {
    await syncPendingClips(saveClip, uploadFile);
    refreshPending();
    await load();
  }, [load, refreshPending]);

  useEffect(() => {
    if (!online) return;
    syncPending().catch(() => {});
  }, [online, syncPending]);

  // Clips older than 48 hours
  const staleClips = clips.filter((c) => {
    const age = Date.now() - new Date(c.createdAt).getTime();
    return age > 48 * 60 * 60 * 1000;
  });

  return {
    clips,
    pendingClips,
    refreshPending,
    syncPending,
    loading,
    error,
    staleClips,
    saveClip,
    assignClip,
    deleteClip,
    refresh: load,
  };
}

