-- Kategóriák: melyik jelenjen meg a header navigációban
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS show_in_header BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.categories.show_in_header IS 'Ha true, a kategória megjelenik a header menüben (Térkép mellett).';
