-- Migration 20260319000002: Clip-level share tokens (keeps session-level tokens working)

ALTER TABLE share_tokens
  ADD COLUMN IF NOT EXISTS clip_id uuid REFERENCES clips(id) ON DELETE CASCADE;

-- One active (non-revoked) token per clip.
CREATE UNIQUE INDEX IF NOT EXISTS share_tokens_active_clip_unique
  ON share_tokens (clip_id)
  WHERE clip_id IS NOT NULL AND revoked_at IS NULL;

