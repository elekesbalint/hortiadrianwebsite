-- Részletes megtekintés statisztikák: kategóriákra és helyekre lebontva, napi aggregációval.

-- Kategória megtekintés statisztika (napi sorok)
CREATE TABLE IF NOT EXISTS public.category_view_stats (
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, date)
);

-- Hely megtekintés statisztika (napi sorok)
CREATE TABLE IF NOT EXISTS public.place_view_stats (
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (place_id, date)
);

ALTER TABLE public.category_view_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_view_stats ENABLE ROW LEVEL SECURITY;

-- Publikus olvasás (aggregált számlálók, nincs személyes adat)
CREATE POLICY "category_view_stats_select" ON public.category_view_stats
  FOR SELECT USING (true);

CREATE POLICY "place_view_stats_select" ON public.place_view_stats
  FOR SELECT USING (true);

-- Inkrementáló függvények – SECURITY DEFINER, hogy anon / authenticated is hívhassa

CREATE OR REPLACE FUNCTION public.increment_category_view(p_category_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.category_view_stats (category_id, date, views)
  VALUES (p_category_id, CURRENT_DATE, 1)
  ON CONFLICT (category_id, date)
  DO UPDATE SET views = category_view_stats.views + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_category_view(UUID) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.increment_place_view(p_place_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.place_view_stats (place_id, date, views)
  VALUES (p_place_id, CURRENT_DATE, 1)
  ON CONFLICT (place_id, date)
  DO UPDATE SET views = place_view_stats.views + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_place_view(UUID) TO anon, authenticated;

