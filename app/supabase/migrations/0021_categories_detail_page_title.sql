-- Kategória: opcionális „részletes oldal címe” (ha üres, a headerben megjelenő név jelenik meg a részletes oldalon is).
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS detail_page_title TEXT;

COMMENT ON COLUMN public.categories.detail_page_title IS 'Részletes kategóriaoldal címe (opcionális). Ha null, a name (header név) jelenik meg.';
