import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import {
  getClipsForSession,
  updateClipFromServer,
  type ClipRow,
} from '../database';
import {
  uploadQueue,
  addUploadQueueListener,
  type UploadQueueEvent,
} from '../../services/uploadQueue';

export function useClips(sessionId: string | null, onPlanLimitReached?: () => void) {
  const [clips, setClips] = useState<ClipRow[]>([]);
  const onPlanLimitReachedRef = useRef(onPlanLimitReached);
  onPlanLimitReachedRef.current = onPlanLimitReached;

  const refresh = useCallback(() => {
    if (!sessionId) {
      setClips([]);
      return;
    }
    setClips(getClipsForSession(sessionId));
  }, [sessionId]);

  const retryClip = useCallback((local_id: string) => {
    uploadQueue.retryClip(local_id);
  }, []);

  /** Update in-memory clip state for local upload progress/status (so cards show live %) */
  const updateLocalClip = useCallback(
    (local_id: string, updates: Partial<Pick<ClipRow, 'upload_status' | 'upload_progress'>>) => {
      if (!sessionId) return;
      setClips((prev) =>
        prev.map((c) =>
          c.local_id === local_id ? { ...c, ...updates } : c
        )
      );
    },
    [sessionId]
  );

  useEffect(() => {
    if (!sessionId) {
      setClips([]);
      return;
    }
    if (!supabase) return;

    setClips(getClipsForSession(sessionId));

    let mounted = true;
    const channel = supabase
      .channel(`clips:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clips',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as Record<string, unknown>;
          const local_id = row?.local_id as string | undefined;
          const server_id = row?.id as string | undefined;
          const mux_playback_id = row?.mux_playback_id as string | null | undefined;
          setClips((prev) => {
            const idx = prev.findIndex((c) => c.local_id === local_id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                server_id: server_id ?? next[idx].server_id,
                mux_playback_id: mux_playback_id ?? next[idx].mux_playback_id,
                upload_status: (row?.upload_status as string) ?? next[idx].upload_status,
              };
              if (local_id) {
                updateClipFromServer(local_id, {
                  server_id: server_id ?? undefined,
                  mux_playback_id: mux_playback_id ?? undefined,
                  upload_status: (row?.upload_status as string) ?? undefined,
                  move_name: (row?.move_name as string | null) ?? undefined,
                  style: (row?.style as string | null) ?? undefined,
                  energy: (row?.energy as string | null) ?? undefined,
                  difficulty: (row?.difficulty as string | null) ?? undefined,
                  bpm: (row?.bpm as number | null) ?? undefined,
                  notes: (row?.notes as string | null) ?? undefined,
                });
              }
              return next;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clips',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as Record<string, unknown>;
          const server_id = row?.id as string | undefined;
          const local_id = row?.local_id as string | undefined;
          const mux_playback_id = row?.mux_playback_id as string | null | undefined;
          const upload_status = row?.upload_status as string | undefined;
          setClips((prev) => {
            const idx = prev.findIndex(
              (c) => c.server_id === server_id || c.local_id === local_id
            );
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                server_id: server_id ?? next[idx].server_id,
                mux_playback_id: mux_playback_id ?? next[idx].mux_playback_id,
                upload_status: upload_status ?? next[idx].upload_status,
                move_name: (row?.move_name as string | null) ?? next[idx].move_name,
                style: (row?.style as string | null) ?? next[idx].style,
                energy: (row?.energy as string | null) ?? next[idx].energy,
                difficulty: (row?.difficulty as string | null) ?? next[idx].difficulty,
                bpm: (row?.bpm as number | null) ?? next[idx].bpm,
                notes: (row?.notes as string | null) ?? next[idx].notes,
              };
              if (local_id) {
                updateClipFromServer(local_id, {
                  server_id: server_id ?? undefined,
                  mux_playback_id: mux_playback_id ?? undefined,
                  upload_status: upload_status ?? undefined,
                  move_name: (row?.move_name as string | null) ?? undefined,
                  style: (row?.style as string | null) ?? undefined,
                  energy: (row?.energy as string | null) ?? undefined,
                  difficulty: (row?.difficulty as string | null) ?? undefined,
                  bpm: (row?.bpm as number | null) ?? undefined,
                  notes: (row?.notes as string | null) ?? undefined,
                });
              }
              return next;
            }
            return prev;
          });
        }
      )
      .subscribe();

    const unsubscribe = addUploadQueueListener((event: UploadQueueEvent) => {
      setClips((prev) =>
        prev.map((clip) => {
          if (clip.local_id !== event.local_id) return clip;
          return {
            ...clip,
            upload_status: event.status ?? clip.upload_status,
            upload_progress:
              typeof event.progress === 'number'
                ? event.progress
                : clip.upload_progress,
          };
        })
      );
      if (event.reason === 'plan_limit_reached') {
        onPlanLimitReachedRef.current?.();
      }
    });

    return () => {
      unsubscribe();
      mounted = false;
      supabase?.removeChannel(channel);
    };
  }, [sessionId]);

  return { clips, refresh, retryClip, updateLocalClip };
}
