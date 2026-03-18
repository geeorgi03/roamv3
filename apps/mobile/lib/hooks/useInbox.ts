import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { API_BASE } from '../api';
import { assignLocalClipToSessionByServerId, getInboxClips } from '../database';

export type InboxClip = {
  id: string;
  user_id: string;
  session_id: string | null;
  label: string;
  upload_status: string;
  mux_playback_id: string | null;
  recorded_at: string;
  created_at: string;
};

const STALE_MS = 48 * 60 * 60 * 1000;

async function authHeader(): Promise<{ Authorization: string } | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/** Convert a local ClipRow into a pending InboxClip for immediate display. */
function localRowToInboxClip(row: ReturnType<typeof getInboxClips>[number]): InboxClip {
  return {
    id: row.server_id ?? row.local_id,
    user_id: '',
    session_id: null,
    label: row.label ?? 'Clip',
    upload_status: row.upload_status,
    mux_playback_id: row.mux_playback_id,
    recorded_at: row.recorded_at ?? new Date().toISOString(),
    created_at: row.recorded_at ?? new Date().toISOString(),
  };
}

export function useInbox() {
  const [clips, setClips] = useState<InboxClip[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staleClips = useMemo(() => {
    const now = Date.now();
    return clips.filter((c) => {
      const t = new Date(c.recorded_at).getTime();
      return Number.isFinite(t) && now - t > STALE_MS;
    });
  }, [clips]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeader();
      if (!headers) {
        setClips([]);
        setCount(0);
        setError('Not signed in');
        return;
      }
      const res = await fetch(`${API_BASE}/inbox`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to load inbox');
        return;
      }
      const body = (await res.json()) as { clips: InboxClip[] };
      const serverClips = Array.isArray(body.clips) ? body.clips : [];

      // Merge locally-pending inbox clips so newly-saved clips are visible
      // immediately after capture, even before the upload completes.
      let merged = serverClips;
      try {
        const localRows = getInboxClips();
        const serverIds = new Set(serverClips.map((c) => c.id));
        const pendingLocal = localRows
          .filter((r) => {
            if (r.upload_status === 'failed') return false;
            // Skip if the server clip is already in the list (by server_id)
            if (r.server_id && serverIds.has(r.server_id)) return false;
            return true;
          })
          .map(localRowToInboxClip);
        if (pendingLocal.length > 0) {
          merged = [...pendingLocal, ...serverClips];
        }
      } catch {
        // Local DB unavailable – fall back to server-only list
      }

      setClips(merged);
      setCount(merged.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCount = useCallback(async () => {
    setError(null);
    try {
      const headers = await authHeader();
      if (!headers) {
        setCount(0);
        return;
      }
      const res = await fetch(`${API_BASE}/inbox/count`, { headers });
      if (!res.ok) return;
      const body = (await res.json()) as { count: number };
      const serverCount = typeof body.count === 'number' ? body.count : 0;

      // Include locally-pending clips (no server_id yet) in the badge count
      let localPending = 0;
      try {
        localPending = getInboxClips().filter(
          (r) => !r.server_id && r.upload_status !== 'failed'
        ).length;
      } catch {
        // ignore
      }
      setCount(serverCount + localPending);
    } catch {
      // ignore lightweight count failures
    }
  }, []);

  /**
   * Assign an inbox clip to a session. Optionally supply `sectionName` to
   * also persist the clip's membership in a named section via section_clips.
   */
  const assignClip = useCallback(
    async (clipId: string, sessionId: string, sectionName?: string): Promise<boolean> => {
      setError(null);
      const prev = clips;
      setClips((p) => p.filter((c) => c.id !== clipId));
      setCount((n) => Math.max(0, n - 1));
      try {
        const headers = await authHeader();
        if (!headers) throw new Error('Not signed in');
        const res = await fetch(`${API_BASE}/inbox/${clipId}/assign`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            ...(sectionName ? { section_label: sectionName } : {}),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? 'Failed to assign');
        }
        try {
          assignLocalClipToSessionByServerId(clipId, sessionId);
        } catch {
          // ignore local persistence failures
        }
        return true;
      } catch (e) {
        setClips(prev);
        setCount(prev.length);
        setError(e instanceof Error ? e.message : 'Network error');
        return false;
      }
    },
    [clips]
  );

  const deleteClip = useCallback(async (clipId: string): Promise<boolean> => {
    setError(null);
    const prev = clips;
    setClips((p) => p.filter((c) => c.id !== clipId));
    setCount((n) => Math.max(0, n - 1));
    try {
      const headers = await authHeader();
      if (!headers) throw new Error('Not signed in');
      const res = await fetch(`${API_BASE}/inbox/${clipId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Failed to delete');
      }
      return true;
    } catch (e) {
      setClips(prev);
      setCount(prev.length);
      setError(e instanceof Error ? e.message : 'Network error');
      return false;
    }
  }, [clips]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return {
    clips,
    count,
    staleClips,
    loading,
    error,
    refresh,
    refreshCount,
    assignClip,
    deleteClip,
  };
}
