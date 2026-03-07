-- RPC Security Hardening: Lock mutating SECURITY DEFINER functions to service_role only
--
-- These are mutating SECURITY DEFINER RPCs that must only be callable via the service-role
-- path (i.e., the apps/api server). Direct RPC calls from anon or authenticated roles
-- are blocked at the permission level.
--
-- The API routes apps/api/src/routes/assembly.ts and apps/api/src/routes/tags.ts already
-- use the service-role client (apps/api/src/lib/supabase.ts), so no API changes are needed.
-- After this migration, anon/authenticated direct RPC calls will receive permission denied.

-- update_clip_tags_with_history(uuid, uuid, jsonb, jsonb)
REVOKE EXECUTE ON FUNCTION update_clip_tags_with_history(uuid, uuid, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_clip_tags_with_history(uuid, uuid, jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION update_clip_tags_with_history(uuid, uuid, jsonb, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION update_clip_tags_with_history(uuid, uuid, jsonb, jsonb) TO service_role;

-- replace_section_clips(uuid, uuid, jsonb)
REVOKE EXECUTE ON FUNCTION replace_section_clips(uuid, uuid, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION replace_section_clips(uuid, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION replace_section_clips(uuid, uuid, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION replace_section_clips(uuid, uuid, jsonb) TO service_role;
