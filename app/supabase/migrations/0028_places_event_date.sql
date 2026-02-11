-- Dátum/időpont mező hozzáadása a programokhoz
ALTER TABLE public.places
ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ NULL;

-- Index a gyors dátum szerinti szűréshez
CREATE INDEX IF NOT EXISTS idx_places_event_date ON public.places(event_date) WHERE event_date IS NOT NULL;

-- Komment: csak programokhoz használjuk
COMMENT ON COLUMN public.places.event_date IS 'Esemény dátuma/időpontja (csak programokhoz)';
