-- Add Phase 2 share mode column
ALTER TABLE share_tokens ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'lightweight' CHECK (mode IN ('lightweight', 'structured'));
