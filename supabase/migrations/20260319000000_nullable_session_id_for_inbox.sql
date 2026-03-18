-- Migration 20260319000000: Support Inbox clips (session_id nullable) + direct clip ownership

-- 1) Add user_id to clips so inbox clips (no session) remain owned.
ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- 2) Backfill user_id for existing clips via their session.
UPDATE clips c
SET user_id = s.user_id
FROM sessions s
WHERE c.session_id = s.id
  AND c.user_id IS NULL;

-- 3) Make session_id nullable to allow inbox items.
ALTER TABLE clips
  ALTER COLUMN session_id DROP NOT NULL;

-- 4) Enforce that every clip has an owner (directly), even if session_id is null.
ALTER TABLE clips
  ALTER COLUMN user_id SET NOT NULL;

-- 5) Helpful index for inbox queries
CREATE INDEX IF NOT EXISTS clips_user_id_session_id_idx ON clips (user_id, session_id);

-- 6) Update clips RLS to allow access by direct ownership OR via session ownership.
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clips_all_own_session ON clips;

CREATE POLICY clips_all_own ON clips FOR ALL
  USING (
    user_id = auth.uid()
    OR (
      session_id IS NOT NULL
      AND session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      session_id IS NOT NULL
      AND session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
    )
  );

