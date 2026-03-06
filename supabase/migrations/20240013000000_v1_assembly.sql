-- Migration 013: V1 section_clips table and constraint/index
-- Idempotent: IF NOT EXISTS for table and constraint; DROP IF EXISTS for policies before CREATE.

CREATE TABLE IF NOT EXISTS section_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  section_label text NOT NULL,
  section_start_ms integer NOT NULL,
  clip_id uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add UNIQUE(session_id, clip_id) DEFERRABLE if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'section_clips_session_clip_unique'
  ) AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'section_clips') THEN
    ALTER TABLE section_clips ADD CONSTRAINT section_clips_session_clip_unique
      UNIQUE (session_id, clip_id) DEFERRABLE INITIALLY DEFERRED;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Composite index for ordered assembly fetch (GET /sessions/:id/assembly)
CREATE INDEX IF NOT EXISTS idx_section_clips_order ON section_clips (session_id, section_start_ms, position);

ALTER TABLE section_clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS section_clips_all_own ON section_clips;
CREATE POLICY section_clips_all_own ON section_clips FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
