import * as SecureStore from 'expo-secure-store';
import { createSupabaseClientFromExpoEnv } from '@roam/db';
import type { SupabaseClient } from '@supabase/supabase-js';

console.log('[BOOT] supabase module loading');

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Never throw at module-evaluation time — route files import this module eagerly
// (expo-router evaluates all routes on startup). A throw here puts the module in
// a broken state so that even the lazy import() in useSession gets undefined.
let supabase: SupabaseClient | null = null;
let supabaseInitError: Error | null = null;

try {
  supabase = createSupabaseClientFromExpoEnv({
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  console.log('[BOOT] Supabase client created');
} catch (e) {
  supabaseInitError = e instanceof Error ? e : new Error(String(e));
  console.error('[BOOT] Supabase init error (check EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY):', supabaseInitError.message);
}

export { supabase, supabaseInitError };
