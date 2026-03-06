// packages/db/src/index.ts
import { createClient } from '@supabase/supabase-js';

export * from '@roam/types';

export type CreateSupabaseClientOptions = Parameters<typeof createClient>[2];

export function createSupabaseClient(
  url: string,
  key: string,
  options?: CreateSupabaseClientOptions
) {
  return createClient(url, key, options);
}

export function createSupabaseClientFromEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing environment variable: SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: SUPABASE_ANON_KEY');
  return createSupabaseClient(url, key);
}

/** Expo/React Native: reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY */
export function createSupabaseClientFromExpoEnv(options?: CreateSupabaseClientOptions) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing environment variable: EXPO_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY');
  return createSupabaseClient(url, key, options);
}

export function createSupabaseServiceRoleClient(
  url: string,
  serviceRoleKey: string,
  options?: CreateSupabaseClientOptions
) {
  return createClient(url, serviceRoleKey, options);
}

export function createSupabaseServiceRoleClientFromEnv(options?: CreateSupabaseClientOptions) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('Missing environment variable: SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  return createSupabaseServiceRoleClient(url, key, options);
}
