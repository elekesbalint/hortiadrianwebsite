-- Étterem kategória – Szolgáltatások szűrők
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Szolgáltatások', 'szolgaltatasok', 'Házhozszállítás', 'hazhozszallitas', 1, true),
  ('Szolgáltatások', 'szolgaltatasok', 'Elvitel', 'elvitel', 2, true),
  ('Szolgáltatások', 'szolgaltatasok', 'Helyben fogyasztás', 'helyben-fogyasztas', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- Szállás kategória – Ellátás szűrők
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Ellátás', 'ellatas', 'Reggelivel', 'reggelivel', 1, true),
  ('Ellátás', 'ellatas', 'Félpanzió', 'felpanzio', 2, true),
  ('Ellátás', 'ellatas', 'Önellátó', 'onellato', 3, true),
  ('Ellátás', 'ellatas', 'All inclusive', 'all-inclusive', 4, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- Látnivaló kategória – Megközelíthetőség opciók szövegeinek módosítása
UPDATE public.filters
SET name = 'Autóval'
WHERE group_slug = 'megkozelithetoseg' AND slug = 'autoval-konnyu';

UPDATE public.filters
SET name = 'Tömegközlekedés'
WHERE group_slug = 'megkozelithetoseg' AND slug = 'tomegkozlekedessel-elerheto';

-- Étterem kategória – Szolgáltatások csoport hozzárendelése
INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'szolgaltatasok'
FROM public.categories c
WHERE c.slug = 'ettermek'
ON CONFLICT (category_id, group_slug) DO NOTHING;

-- Szállás kategória – Ellátás csoport hozzárendelése
INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'ellatas'
FROM public.categories c
WHERE c.slug = 'szallasok'
ON CONFLICT (category_id, group_slug) DO NOTHING;

-- Hétvégére és Esős Napra kategóriák – \"Kivel mész?\" szűrőcsoport hozzárendelése
INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'kivel-mesz'
FROM public.categories c
WHERE c.slug IN ('hetvegere', 'esos-napra', 'esos_napra', 'esosnapra', 'esos napra')
ON CONFLICT (category_id, group_slug) DO NOTHING;

-- Gyerekeknek kategória – korábbi \"Aktív / Kreatív / Kultúrális\" csoportok helyett Hangulat
DELETE FROM public.category_filter_groups
WHERE category_id IN (
  SELECT id FROM public.categories WHERE slug IN ('gyerekeknek', 'gyerekek')
) AND group_slug IN ('aktivitas', 'kreativ', 'kulturalis');

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'hangulat'
FROM public.categories c
WHERE c.slug IN ('gyerekeknek', 'gyerekek')
ON CONFLICT (category_id, group_slug) DO NOTHING;

