-- Challenge Hub Database Schema
-- Auto-runs on first container start via docker-entrypoint-initdb.d

-- Users (populated on first Discord login)
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,        -- Discord user ID (snowflake)
  username   TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- All content types in one extensible table
CREATE TABLE IF NOT EXISTS content (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL
              CHECK (type IN ('challenge', 'joker', 'deck')),
  code        TEXT UNIQUE NOT NULL,   -- short code for playtesting
  author_id   TEXT REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  json_data   JSONB NOT NULL,
  sprite_url  TEXT,
  status      TEXT DEFAULT 'draft'
              CHECK (status IN ('draft', 'published')),
  downloads   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_type_status ON content(type, status);
CREATE INDEX IF NOT EXISTS idx_content_code ON content(code);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id           SERIAL PRIMARY KEY,
  content_id   INTEGER REFERENCES content(id) ON DELETE CASCADE,
  user_id      TEXT REFERENCES users(id),
  score        INTEGER CHECK (score >= 1 AND score <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, user_id)
);
