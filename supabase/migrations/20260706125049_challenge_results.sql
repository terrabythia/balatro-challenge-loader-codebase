ALTER TABLE content ADD COLUMN plays INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN wins INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN losses INTEGER DEFAULT 0;

CREATE TABLE challenge_results (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
  won BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenge_results_content ON challenge_results(content_id);
