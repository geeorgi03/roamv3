-- RPC for atomic tag update: snapshot history + update clips in one transaction.
-- Ensures version-history row is created before applying tag updates.

CREATE OR REPLACE FUNCTION update_clip_tags_with_history(
  p_clip_id uuid,
  p_user_id uuid,
  p_snapshot jsonb,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clip_ok boolean;
  v_updated jsonb;
BEGIN
  -- 1. Verify clip belongs to user via session
  SELECT EXISTS(
    SELECT 1 FROM clips c
    INNER JOIN sessions s ON c.session_id = s.id
    WHERE c.id = p_clip_id AND s.user_id = p_user_id
  ) INTO v_clip_ok;
  IF NOT v_clip_ok THEN
    RAISE EXCEPTION 'Clip not found or access denied' USING errcode = 'P0001';
  END IF;

  -- 2. Insert history snapshot first (must succeed before any update)
  INSERT INTO clip_tag_history (clip_id, snapshot, saved_by)
  VALUES (p_clip_id, p_snapshot, p_user_id);

  -- 3. Apply updates to clips (only fields present in p_updates)
  UPDATE clips
  SET
    move_name = CASE WHEN p_updates ? 'move_name' THEN (p_updates->>'move_name')::text ELSE move_name END,
    style = CASE WHEN p_updates ? 'style' THEN (p_updates->>'style')::text ELSE style END,
    energy = CASE WHEN p_updates ? 'energy' THEN (p_updates->>'energy')::text ELSE energy END,
    difficulty = CASE WHEN p_updates ? 'difficulty' THEN (p_updates->>'difficulty')::text ELSE difficulty END,
    bpm = CASE WHEN p_updates ? 'bpm' THEN (p_updates->'bpm')::integer ELSE bpm END,
    notes = CASE WHEN p_updates ? 'notes' THEN (p_updates->>'notes')::text ELSE notes END
  WHERE id = p_clip_id;

  -- 4. Return updated clip as jsonb
  SELECT to_jsonb(cl) INTO v_updated
  FROM clips cl
  WHERE cl.id = p_clip_id;

  RETURN v_updated;
END;
$$;
