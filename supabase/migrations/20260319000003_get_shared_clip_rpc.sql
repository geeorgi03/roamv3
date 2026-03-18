-- Migration 20260319000003: get_shared_clip RPC (anon-accessible clip share page)

CREATE OR REPLACE FUNCTION get_shared_clip(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_clip_id uuid;
  v_session sessions%ROWTYPE;
  v_clip clips%ROWTYPE;
BEGIN
  -- Look up valid clip-level share token (clip_id must be present)
  SELECT st.session_id, st.clip_id INTO v_session_id, v_clip_id
  FROM share_tokens st
  WHERE st.token = p_token AND st.revoked_at IS NULL AND st.clip_id IS NOT NULL;

  IF v_session_id IS NULL OR v_clip_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch session (for display context)
  SELECT * INTO v_session FROM sessions WHERE id = v_session_id;

  -- Fetch the bound clip (scoped to session as defense-in-depth)
  SELECT * INTO v_clip FROM clips WHERE id = v_clip_id AND session_id = v_session_id;

  IF v_clip.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'session', to_jsonb(v_session),
    'clip', to_jsonb(v_clip)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_shared_clip(uuid) TO anon;

