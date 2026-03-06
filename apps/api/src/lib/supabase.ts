/**
 * Server-side Supabase client (service role) for API.
 * Uses @roam/db for consistent env and client creation.
 */
import { createSupabaseServiceRoleClientFromEnv } from '@roam/db';

export const supabase = createSupabaseServiceRoleClientFromEnv();
