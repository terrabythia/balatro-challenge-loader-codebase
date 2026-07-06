-- Enable real-time for the content table so the Explore page auto-updates
-- when challenges are published, rated, or downloaded.

ALTER TABLE content REPLICA IDENTITY FULL;

-- Allow public read access for published content (needed for real-time subscriptions)
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published content"
  ON content
  FOR SELECT
  USING (status = 'published');

-- Enable real-time for ratings (affects avg_rating on explore page)
ALTER TABLE ratings REPLICA IDENTITY FULL;

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view ratings"
  ON ratings
  FOR SELECT
  USING (true);
