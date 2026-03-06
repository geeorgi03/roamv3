// packages/db/src/index.ts
import { createClient } from '@supabase/supabase-js';

export * from '@roam/types';

export function createSupabaseClient(url: string, key: string) {
  return createClient(url, key);
}

export function createSupabaseClientFromEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing environment variable: SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: SUPABASE_ANON_KEY');
  return createSupabaseClient(url, key);
}
