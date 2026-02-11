-- Site statistics tábla: partner száma és megtekintések száma a főoldalhoz
CREATE TABLE IF NOT EXISTS public.site_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- 'partners' vagy 'page_views'
  value INTEGER NOT NULL DEFAULT 0,
  display_label TEXT, -- Megjelenítési címke (pl. 'Partner', 'Megtekintés')
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Alapértelmezett értékek beszúrása
INSERT INTO public.site_statistics (key, value, display_label)
VALUES 
  ('partners', 2000, 'Partner'),
  ('page_views', 100000, 'Megtekintés')
ON CONFLICT (key) DO NOTHING;

-- Index a gyors kereséshez
CREATE INDEX IF NOT EXISTS idx_site_statistics_key ON public.site_statistics(key);

-- RLS engedélyezése
ALTER TABLE public.site_statistics ENABLE ROW LEVEL SECURITY;

-- Mindenki olvashatja (publikus adat)
CREATE POLICY "site_statistics_select_public" ON public.site_statistics
  FOR SELECT USING (true);

-- Csak admin szerkesztheti
CREATE POLICY "site_statistics_update_admin" ON public.site_statistics
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "site_statistics_insert_admin" ON public.site_statistics
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

COMMENT ON TABLE public.site_statistics IS 'Főoldal statisztikák: partner száma és megtekintések száma számláló animációhoz';
