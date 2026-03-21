-- Add Phase 2 clip tagging columns
-- First add section_id column (nullable for existing records)
ALTER TABLE clips ADD COLUMN IF NOT EXISTS section_id TEXT;
-- Then add tagging columns
ALTER TABLE clips ADD COLUMN IF NOT EXISTS type_tag TEXT;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS feel_tags TEXT[] DEFAULT '{}';

-- Create composite index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_clips_session_section_type ON clips (session_id, section_id, type_tag);
