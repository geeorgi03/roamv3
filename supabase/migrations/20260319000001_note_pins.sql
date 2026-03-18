-- Migration 20260319000001: Session-level timestamped note pins

CREATE TABLE IF NOT EXISTS note_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  timecode_ms integer NOT NULL,
  text text,
  audio_storage_path text,
  color text DEFAULT '#4ECDC4',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE note_pins ENABLE ROW LEVEL SECURITY;

-- Owner is derived from the parent session.
CREATE POLICY note_pins_all_own_session ON note_pins FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS note_pins_session_id_timecode_idx ON note_pins (session_id, timecode_ms);

