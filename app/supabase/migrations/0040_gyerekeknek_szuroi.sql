-- Gyerekeknek kategória szűrői

-- 1. Korosztály
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Korosztály', 'korosztaly', '0-3 év', '0-3-ev', 1, true),
  ('Korosztály', 'korosztaly', '3-6 év', '3-6-ev', 2, true),
  ('Korosztály', 'korosztaly', '6-12 év', '6-12-ev', 3, true),
  ('Korosztály', 'korosztaly', '12+ év', '12-ev', 4, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 2. Aktív
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Aktív', 'aktivitas', 'Aktív', 'aktiv', 1, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 4. Kreatív
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Kreatív', 'kreativ', 'Kreatív', 'kreativ', 1, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 5. Kultúrális
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Kultúrális', 'kulturalis', 'Kultúrális', 'kulturalis', 1, true)
ON CONFLICT (group_slug, slug) DO NOTHING;
