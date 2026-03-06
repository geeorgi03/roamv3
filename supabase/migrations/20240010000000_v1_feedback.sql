-- Migration 010: V1 feedback tables (feedback_requests, clip_comments)
-- Idempotent: IF NOT EXISTS for tables; DROP IF EXISTS for policies before CREATE.

CREATE TABLE IF NOT EXISTS feedback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(clip_id)
);

CREATE TABLE IF NOT EXISTS clip_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  timecode_ms integer NOT NULL,
  text text NOT NULL,
  commenter_name text,
  created_at timestamptz DEFAULT now()
);

-- Add uniqueness if table already existed from combined migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_requests_clip_id_key'
  ) AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'feedback_requests') THEN
    ALTER TABLE feedback_requests ADD CONSTRAINT feedback_requests_clip_id_key UNIQUE (clip_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_comments ENABLE ROW LEVEL SECURITY;

-- feedback_requests: owner SELECT/INSERT/UPDATE via session → user; NO anon SELECT
DROP POLICY IF EXISTS feedback_requests_select_anon_open ON feedback_requests;
DROP POLICY IF EXISTS feedback_requests_select_own ON feedback_requests;
DROP POLICY IF EXISTS feedback_requests_insert_own ON feedback_requests;
DROP POLICY IF EXISTS feedback_requests_update_own ON feedback_requests;
CREATE POLICY feedback_requests_select_own ON feedback_requests FOR SELECT
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY feedback_requests_insert_own ON feedback_requests FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY feedback_requests_update_own ON feedback_requests FOR UPDATE
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

-- clip_comments: owner SELECT via session → user; anon INSERT only; NO anon SELECT
DROP POLICY IF EXISTS clip_comments_select_anon ON clip_comments;
DROP POLICY IF EXISTS clip_comments_select_own ON clip_comments;
DROP POLICY IF EXISTS clip_comments_insert_anon ON clip_comments;
CREATE POLICY clip_comments_select_own ON clip_comments FOR SELECT
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY clip_comments_insert_anon ON clip_comments FOR INSERT
  TO anon
  WITH CHECK (true);
