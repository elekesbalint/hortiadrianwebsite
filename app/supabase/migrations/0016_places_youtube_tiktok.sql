-- Helyek: YouTube és TikTok linkek
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS youtube TEXT,
  ADD COLUMN IF NOT EXISTS tiktok TEXT;

COMMENT ON COLUMN public.places.youtube IS 'YouTube csatorna vagy videó URL.';
COMMENT ON COLUMN public.places.tiktok IS 'TikTok profil vagy videó URL.';
