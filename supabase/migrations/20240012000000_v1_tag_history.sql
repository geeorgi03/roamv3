-- Migration 012: V1 clip_tag_history table
-- Idempotent: IF NOT EXISTS for table; DROP IF EXISTS for policies before CREATE.

CREATE TABLE IF NOT EXISTS clip_tag_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  saved_at timestamptz DEFAULT now(),
  saved_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE clip_tag_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clip_tag_history_all_own ON clip_tag_history;
CREATE POLICY clip_tag_history_all_own ON clip_tag_history FOR ALL
  USING (clip_id IN (
    SELECT c.id FROM clips c
    INNER JOIN sessions s ON c.session_id = s.id
    WHERE s.user_id = auth.uid()
  ));
