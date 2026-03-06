-- Migration 004: get_shared_session RPC (anon-accessible share page)

CREATE OR REPLACE FUNCTION get_shared_session(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_session sessions%ROWTYPE;
  v_music_track music_tracks%ROWTYPE;
  v_clips jsonb;
BEGIN
  -- Look up valid share token
  SELECT st.session_id INTO v_session_id
  FROM share_tokens st
  WHERE st.token = p_token AND st.revoked_at IS NULL;

  IF v_session_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch session
  SELECT * INTO v_session FROM sessions WHERE id = v_session_id;

  -- Fetch single music_track (V1: one track per session)
  SELECT * INTO v_music_track
  FROM music_tracks
  WHERE session_id = v_session_id
  LIMIT 1;

  -- Fetch clips with upload_status IN ('ready', 'processing'), ordered by recorded_at ASC
  SELECT COALESCE(
    (SELECT jsonb_agg(to_jsonb(cl) ORDER BY cl.recorded_at ASC)
     FROM clips cl
     WHERE cl.session_id = v_session_id AND cl.upload_status IN ('ready', 'processing')),
    '[]'::jsonb
  ) INTO v_clips;

  RETURN json_build_object(
    'session', to_jsonb(v_session),
    'music_track', CASE WHEN v_music_track.id IS NULL THEN NULL ELSE to_jsonb(v_music_track) END,
    'clips', COALESCE(v_clips, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_shared_session(uuid) TO anon;
