-- Térképes nézet: admin választhatja, hogy a Részletek mellett „Útvonal” vagy „Jegyvásárlás” jelenjen meg
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS map_secondary_button TEXT NULL
  CHECK (map_secondary_button IS NULL OR map_secondary_button IN ('route', 'tickets'));

COMMENT ON COLUMN public.places.map_secondary_button IS 'Térképen a Részletek mellett: route = Útvonal, tickets = Jegyvásárlás (booking_url). NULL = Útvonal.';
