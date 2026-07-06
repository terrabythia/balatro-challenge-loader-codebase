ALTER TABLE content ADD COLUMN guest_id TEXT;

CREATE INDEX idx_content_guest_id ON content(guest_id) WHERE guest_id IS NOT NULL;
