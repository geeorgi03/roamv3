import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseSafe = {
  supabase: SupabaseClient | null;
  error: Error | null;
  loading: boolean;
};

/**
 * Loads the Supabase client without crashing when env vars are missing.
 * Use on auth screens so "Continue to sign in" / "Continue anyway" still show a usable screen.
 */
export function useSupabaseSafe(): SupabaseSafe {
  const [state, setState] = useState<SupabaseSafe>({
    supabase: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    import('../supabase')
      .then(({ supabase }) => {
        if (mounted) setState({ supabase, error: null, loading: false });
      })
      .catch((err) => {
        if (mounted) {
          setState({
            supabase: null,
            error: err instanceof Error ? err : new Error(String(err)),
            loading: false,
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
