import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { API_BASE } from '../api';

export type NotePin = {
  id: string;
  session_id: string;
  timecode_ms: number;
  text: string | null;
  audio_storage_path: string | null;
  color: string | null;
  created_at: string;
};

async function authHeader(): Promise<{ Authorization: string } | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export function useNotePins(sessionId: string | null) {
  const [notes, setNotes] = useState<NotePin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => a.timecode_ms - b.timecode_ms),
    [notes]
  );

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeader();
      if (!headers) {
        setNotes([]);
        setError('Not signed in');
        return;
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/notes`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to load notes');
        return;
      }
      const body = (await res.json()) as { notes: NotePin[] };
      setNotes(Array.isArray(body.notes) ? body.notes : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const createNote = useCallback(async (input: {
    timecode_ms: number;
    text?: string | null;
    audio_storage_path?: string | null;
    color?: string | null;
  }): Promise<NotePin | null> => {
    if (!sessionId) return null;
    setError(null);
    try {
      const headers = await authHeader();
      if (!headers) throw new Error('Not signed in');
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Failed to create note');
      }
      const note = (await res.json()) as NotePin;
      setNotes((prev) => [...prev, note]);
      return note;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      return null;
    }
  }, [sessionId]);

  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    if (!sessionId) return false;
    setError(null);
    const prev = notes;
    setNotes((p) => p.filter((n) => n.id !== noteId));
    try {
      const headers = await authHeader();
      if (!headers) throw new Error('Not signed in');
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/notes/${noteId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Failed to delete note');
      }
      return true;
    } catch (e) {
      setNotes(prev);
      setError(e instanceof Error ? e.message : 'Network error');
      return false;
    }
  }, [sessionId, notes]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    if (!sessionId) return;
    const sb = supabase;
    if (!sb) return;

    let mounted = true;
    const channel = sb
      .channel(`note_pins:session_id=eq.${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_pins',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === 'INSERT') {
            const n = payload.new as NotePin;
            setNotes((prev) => {
              if (prev.some((x) => x.id === n.id)) return prev;
              return [...prev, n];
            });
          } else if (payload.eventType === 'UPDATE') {
            const n = payload.new as NotePin;
            setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id?: string };
            if (!oldRow?.id) return;
            setNotes((prev) => prev.filter((x) => x.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      sb.removeChannel(channel);
    };
  }, [sessionId]);

  return {
    notes: sorted,
    loading,
    error,
    refresh,
    createNote,
    deleteNote,
  };
}

