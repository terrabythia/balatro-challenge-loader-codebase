ALTER TABLE content ADD COLUMN version INTEGER DEFAULT 1;

-- Newly published challenges get version 1, so only update NULLs (drafts never published)
-- This keeps existing rows at NULL until their first publish
UPDATE content SET version = 1 WHERE status = 'published' AND version IS NULL;
