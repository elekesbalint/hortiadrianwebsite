-- Részletes statisztikai események visszaállítása
-- Események: page_view, place_view, place_click, direction_click

CREATE TABLE IF NOT EXISTS public.statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NULL REFERENCES public.places(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'place_view', 'place_click', 'direction_click')),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Beszúrás engedélyezése minden anon / authenticated felhasználónak
DROP POLICY IF EXISTS "statistics_insert_public" ON public.statistics;
CREATE POLICY "statistics_insert_public"
  ON public.statistics
  FOR INSERT
  WITH CHECK (true);

-- Lekérdezés alapértelmezetten tiltott (admin felület service_role kulccsal éri el, ami megkerüli az RLS-t)

CREATE INDEX IF NOT EXISTS idx_statistics_event_type_created_at
  ON public.statistics (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_statistics_place_id_created_at
  ON public.statistics (place_id, created_at);

