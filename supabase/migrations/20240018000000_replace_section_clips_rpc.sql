-- RPC for atomic assembly replace: delete + insert in one transaction.
-- Validates session ownership and clip_ids before mutating state.

CREATE OR REPLACE FUNCTION replace_section_clips(
  p_session_id uuid,
  p_user_id uuid,
  p_assignments jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_ok boolean;
  v_clip_ids uuid[];
  v_clip_count int;
  v_valid_count int;
  v_a jsonb;
  v_result jsonb;
BEGIN
  -- 1. Verify session belongs to user
  SELECT EXISTS(
    SELECT 1 FROM sessions WHERE id = p_session_id AND user_id = p_user_id
  ) INTO v_session_ok;
  IF NOT v_session_ok THEN
    RAISE EXCEPTION 'Session not found or access denied' USING errcode = 'P0001';
  END IF;

  -- 2. Validate payload: must be array of objects with section_label, section_start_ms, clip_id, position
  IF jsonb_typeof(p_assignments) != 'array' THEN
    RAISE EXCEPTION 'assignments must be an array' USING errcode = 'P0002';
  END IF;

  -- 3. Extract and validate clip_ids exist and belong to session
  FOR v_a IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    IF v_a->>'clip_id' IS NULL OR v_a->>'section_label' IS NULL
       OR (v_a->'section_start_ms') IS NULL OR (v_a->'position') IS NULL THEN
      RAISE EXCEPTION 'Each assignment must have section_label, section_start_ms, clip_id, position'
        USING errcode = 'P0002';
    END IF;
  END LOOP;

  SELECT COALESCE(array_agg((elem->>'clip_id')::uuid), ARRAY[]::uuid[])
  INTO v_clip_ids
  FROM jsonb_array_elements(p_assignments) AS elem
  WHERE elem->>'clip_id' IS NOT NULL AND elem->>'clip_id' != '';

  SELECT COUNT(*) INTO v_valid_count
  FROM clips c
  WHERE c.id = ANY(v_clip_ids) AND c.session_id = p_session_id;

  SELECT array_length(v_clip_ids, 1) INTO v_clip_count;
  IF v_clip_count IS NULL THEN
    v_clip_count := 0;
  END IF;
  IF v_valid_count != v_clip_count THEN
    RAISE EXCEPTION 'One or more clip_ids are invalid or do not belong to this session'
      USING errcode = 'P0002';
  END IF;

  -- 4. Delete existing + insert new (atomic in one transaction)
  DELETE FROM section_clips WHERE session_id = p_session_id;

  IF v_clip_count > 0 THEN
    INSERT INTO section_clips (session_id, section_label, section_start_ms, clip_id, position)
    SELECT
      p_session_id,
      elem->>'section_label',
      (elem->'section_start_ms')::int,
      (elem->>'clip_id')::uuid,
      (elem->'position')::int
    FROM jsonb_array_elements(p_assignments) AS elem;
  END IF;

  -- 5. Return inserted rows as jsonb array
  SELECT COALESCE(
    (SELECT jsonb_agg(to_jsonb(sc) ORDER BY sc.section_start_ms, sc.position)
     FROM section_clips sc WHERE sc.session_id = p_session_id),
    '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
END;
$$;
