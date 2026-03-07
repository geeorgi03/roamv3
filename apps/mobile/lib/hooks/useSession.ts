import { useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';

const LOADING_TIMEOUT_MS = 12_000;

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;

    timeoutRef.current = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        setError(new Error('Loading timed out. Check your connection.'));
      }
    }, LOADING_TIMEOUT_MS);

    import('../supabase')
      .then(({ supabase }) => {
        if (!mounted) return null;
        const { data } = supabase.auth.onAuthStateChange((_event, s) => {
          if (mounted) setSession(s);
        });
        subRef.current = data.subscription;
        return supabase.auth.getSession().then((r) => ({ supabase, result: r }));
      })
      .then((data) => {
        if (!mounted || !data) return;
        setSession(data.result.data.session);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (mounted) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    error,
  };
}
