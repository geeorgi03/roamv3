import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { API_BASE } from '../api';

export function useClipShare(clipId: string | null) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset all share state whenever the selected clip changes so stale
  // link data from a previous clip cannot bleed through to a new selection.
  useEffect(() => {
    setShareUrl(null);
    setLoading(false);
    setError(null);
  }, [clipId]);

  const share = useCallback(async (): Promise<string | null> => {
    if (!clipId) return null;
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
      const res = await fetch(`${API_BASE}/clips/${clipId}/share`, {
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
  }, [clipId]);

  const revoke = useCallback(async (): Promise<boolean> => {
    if (!clipId) return false;
    if (!supabase) return false;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Not signed in');
        return false;
      }
      const res = await fetch(`${API_BASE}/clips/${clipId}/share`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to revoke');
        return false;
      }
      setShareUrl(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [clipId]);

  return {
    shareUrl,
    share,
    revoke,
    isShared: shareUrl !== null,
    loading,
    error,
  };
}

