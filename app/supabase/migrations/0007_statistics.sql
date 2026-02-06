-- Statisztikák: weboldal és hely megtekintések, kattintások
CREATE TABLE IF NOT EXISTS public.statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'place_view', 'place_click', 'direction_click')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_statistics_place_id ON public.statistics(place_id);
CREATE INDEX IF NOT EXISTS idx_statistics_event_type ON public.statistics(event_type);
CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON public.statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_statistics_created_at ON public.statistics(created_at DESC);

ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Csak bejelentkezett felhasználó rögzíthet statisztikát
CREATE POLICY "statistics_insert_authenticated" ON public.statistics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Csak admin (aki bejelentkezett) láthatja a statisztikákat
CREATE POLICY "statistics_select_admin" ON public.statistics
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
