-- Szűrő csoportok és opciók (pl. Szolgáltatások: Parkoló, Állatbarát; Hol?: Budapest, Balaton)
CREATE TABLE IF NOT EXISTS public.filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  group_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_slug, slug)
);

CREATE INDEX IF NOT EXISTS idx_filters_group_slug ON public.filters(group_slug);
CREATE INDEX IF NOT EXISTS idx_filters_is_active ON public.filters(is_active);

-- Helyekhez rendelt szűrők (N:N)
CREATE TABLE IF NOT EXISTS public.place_filters (
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  filter_id UUID NOT NULL REFERENCES public.filters(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_place_filters_place_id ON public.place_filters(place_id);
CREATE INDEX IF NOT EXISTS idx_place_filters_filter_id ON public.place_filters(filter_id);

ALTER TABLE public.filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_filters ENABLE ROW LEVEL SECURITY;

-- Szűrők: mindenki olvashat, csak bejelentkezett írhat (admin)
CREATE POLICY "filters_select" ON public.filters FOR SELECT USING (true);
CREATE POLICY "filters_insert" ON public.filters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "filters_update" ON public.filters FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "filters_delete" ON public.filters FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "place_filters_select" ON public.place_filters FOR SELECT USING (true);
CREATE POLICY "place_filters_insert" ON public.place_filters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "place_filters_delete" ON public.place_filters FOR DELETE USING (auth.role() = 'authenticated');
