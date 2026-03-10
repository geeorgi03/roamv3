import { useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';

const LOADING_TIMEOUT_MS = 5_000;

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;
    console.log('[BOOT] auth restore (supabase init) started');

    timeoutRef.current = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[BOOT] auth restore timeout reached');
        setLoading(false);
        setError(new Error('Loading timed out. Check your connection.'));
      }
    }, LOADING_TIMEOUT_MS);

    console.log('[BOOT] auth restore: importing supabase module');
    import('../supabase')
      .then(({ supabase, supabaseInitError }) => {
        if (!mounted) return null;
        if (!supabase) {
          throw supabaseInitError ?? new Error('Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env.local');
        }
        console.log('[BOOT] supabase init done');
        const { data } = supabase.auth.onAuthStateChange((_event, s) => {
          if (mounted) setSession(s);
        });
        subRef.current = data.subscription;
        console.log('[BOOT] auth restore getSession started');
        return supabase.auth.getSession().then((r) => ({ supabase, result: r }));
      })
      .then((data) => {
        if (!mounted || !data) return;
        console.log('[BOOT] auth restore getSession done');
        setSession(data.result.data.session);
      })
      .catch((err) => {
        if (mounted) {
          console.log('[BOOT] auth restore error', err?.message ?? err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (mounted) {
          console.log('[BOOT] auth restore finally');
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
