-- RLS: Remove permissive anon policies; add token-scoped RPCs for comments and feedback.
-- Feedback: Deduplicate and enforce UNIQUE(clip_id) on feedback_requests.

-- 1. Drop permissive anon SELECT policies
DROP POLICY IF EXISTS clip_comments_select_anon ON clip_comments;
DROP POLICY IF EXISTS feedback_requests_select_anon_open ON feedback_requests;

-- 2. RPC: Get clip comments for a valid share token (anon-accessible)
CREATE OR REPLACE FUNCTION get_clip_comments_for_share(p_token uuid, p_clip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_clip_ok boolean;
  v_result jsonb;
BEGIN
  SELECT st.session_id INTO v_session_id
  FROM share_tokens st
  WHERE st.token = p_token AND st.revoked_at IS NULL;

  IF v_session_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM clips c
    WHERE c.id = p_clip_id AND c.session_id = v_session_id
  ) INTO v_clip_ok;

  IF NOT v_clip_ok THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(
    (SELECT jsonb_agg(to_jsonb(cc) ORDER BY cc.timecode_ms)
     FROM clip_comments cc
     WHERE cc.clip_id = p_clip_id AND cc.session_id = v_session_id),
    '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_clip_comments_for_share(uuid, uuid) TO anon;

-- 3. RPC: Get feedback request status for a valid share token (anon-accessible)
CREATE OR REPLACE FUNCTION get_feedback_request_for_share(p_token uuid, p_clip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_clip_ok boolean;
  v_result jsonb;
BEGIN
  SELECT st.session_id INTO v_session_id
  FROM share_tokens st
  WHERE st.token = p_token AND st.revoked_at IS NULL;

  IF v_session_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM clips c
    WHERE c.id = p_clip_id AND c.session_id = v_session_id
  ) INTO v_clip_ok;

  IF NOT v_clip_ok THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(fr) INTO v_result
  FROM feedback_requests fr
  WHERE fr.clip_id = p_clip_id AND fr.session_id = v_session_id
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_feedback_request_for_share(uuid, uuid) TO anon;

-- 4. Deduplicate feedback_requests: keep one row per clip_id (prefer open, then most recent)
DELETE FROM feedback_requests
WHERE id NOT IN (
  SELECT DISTINCT ON (clip_id) id
  FROM feedback_requests
  ORDER BY clip_id, CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC NULLS LAST
);

-- 5. Add UNIQUE constraint on feedback_requests.clip_id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'feedback_requests' AND c.conname IN ('feedback_requests_clip_id_unique', 'feedback_requests_clip_id_key')
  ) THEN
    ALTER TABLE feedback_requests ADD CONSTRAINT feedback_requests_clip_id_unique UNIQUE (clip_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
