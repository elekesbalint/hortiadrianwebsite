-- Értékelések: user_id, place_id, rating, comment, megjelenített név
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  user_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON public.reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Mindenki olvashatja a hely értékeléseit
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (true);

-- Csak bejelentkezett user írhat, és csak a saját user_id-val
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
