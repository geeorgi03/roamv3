-- Migration 011: V1 clip_annotations table
-- Idempotent: IF NOT EXISTS for table; DROP IF EXISTS for policies before CREATE.

CREATE TABLE IF NOT EXISTS clip_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  timecode_ms integer NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'arrow', 'circle')),
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clip_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clip_annotations_all_own ON clip_annotations;
CREATE POLICY clip_annotations_all_own ON clip_annotations FOR ALL
  USING (clip_id IN (
    SELECT c.id FROM clips c
    INNER JOIN sessions s ON c.session_id = s.id
    WHERE s.user_id = auth.uid()
  ));
