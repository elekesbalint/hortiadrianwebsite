-- Alapértelmezett szűrők beszúrása (PDF alapján)
-- ON CONFLICT: ha már létezik, nem írja felül

-- 1. Hol?
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Hol?', 'hol', 'Teljes ország', 'teljes-orszag', 1, true),
  ('Hol?', 'hol', 'Megye', 'megye', 2, true),
  ('Hol?', 'hol', 'Város', 'varos', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 2. Évszak
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Évszak', 'evszak', 'Tavasz', 'tavasz', 1, true),
  ('Évszak', 'evszak', 'Nyár', 'nyar', 2, true),
  ('Évszak', 'evszak', 'Ősz', 'osz', 3, true),
  ('Évszak', 'evszak', 'Tél', 'tel', 4, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 3. Időszak
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Időszak', 'idoszak', 'Nappal', 'nappal', 1, true),
  ('Időszak', 'idoszak', 'Este', 'este', 2, true),
  ('Időszak', 'idoszak', 'Éjjel', 'ejjel', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 4. Tér
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Tér', 'ter', 'Beltér', 'belter', 1, true),
  ('Tér', 'ter', 'Kültér', 'kulter', 2, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 5. Kivel mész?
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Kivel mész?', 'kivel-mesz', 'Családdal', 'csaladdal', 1, true),
  ('Kivel mész?', 'kivel-mesz', 'Párban', 'parban', 2, true),
  ('Kivel mész?', 'kivel-mesz', 'Barátokkal', 'baratokkal', 3, true),
  ('Kivel mész?', 'kivel-mesz', 'Egyedül', 'egyedul', 4, true),
  ('Kivel mész?', 'kivel-mesz', 'Babával', 'babaval', 5, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 6. Megközelítés
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Megközelítés', 'megkozelites', 'Autóval', 'autoval', 1, true),
  ('Megközelítés', 'megkozelites', 'Tömegközlekedés', 'tomegkozlekedes', 2, true),
  ('Megközelítés', 'megkozelites', 'Parkoló van', 'parkolo-van', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;
