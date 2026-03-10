import { useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { API_BASE } from '../api';

export function useShare(sessionId: string) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(async (): Promise<string | null> => {
    if (!sessionId) return null;
    if (!supabase) return null;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Not signed in');
        return null;
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to create share link');
        return null;
      }
      const body = (await res.json()) as { url: string };
      setShareUrl(body.url);
      return body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const revoke = useCallback(async () => {
    if (!sessionId) return;
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Not signed in');
        return;
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/share`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to revoke');
        return;
      }
      setShareUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return {
    shareUrl,
    share,
    revoke,
    isShared: shareUrl !== null,
    loading,
    error,
  };
}
