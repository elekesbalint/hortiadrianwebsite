-- Hely–kategória many-to-many kapcsolat: egy hely több kategóriához is tartozhat.
-- A places.category_id mező marad „fő kategóriának” (primary), kompatibilitás miatt.

CREATE TABLE IF NOT EXISTS public.place_categories (
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (place_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_place_categories_place_id ON public.place_categories(place_id);
CREATE INDEX IF NOT EXISTS idx_place_categories_category_id ON public.place_categories(category_id);

ALTER TABLE public.place_categories ENABLE ROW LEVEL SECURITY;

-- Mindenki olvashatja (a helyek és kategóriák nyilvánosak)
CREATE POLICY "place_categories_select" ON public.place_categories
  FOR SELECT USING (true);

-- Írni csak bejelentkezett (admin) felhasználó tud – a SUPABASE_SERVICE_ROLE_KEY-es szerver oldali hívások is ebbe a role-ba esnek.
CREATE POLICY "place_categories_insert" ON public.place_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "place_categories_update" ON public.place_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "place_categories_delete" ON public.place_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Backfill: minden aktív hely kap egy rekordot a jelenlegi category_id alapján, primary-ként megjelölve.
INSERT INTO public.place_categories (place_id, category_id, is_primary)
SELECT id AS place_id, category_id, true AS is_primary
FROM public.places
WHERE is_active = true
ON CONFLICT (place_id, category_id) DO NOTHING;

