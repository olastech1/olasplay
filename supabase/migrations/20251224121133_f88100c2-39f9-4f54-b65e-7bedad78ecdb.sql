-- Add SEO-related settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_url', 'https://olasplay.com'),
  ('meta_description', 'Download free MP3 music from top artists worldwide. High-quality music downloads, latest hits, and trending songs.'),
  ('meta_keywords', 'mp3 download, free music, music download, songs, artists, afrobeats, amapiano'),
  ('google_analytics_id', NULL),
  ('google_verification', NULL)
ON CONFLICT (key) DO NOTHING;