-- Kategória–szűrőcsoport hozzárendelés (adminból szerkeszthető)
-- Egy kategóriához több szűrőcsoport (group_slug) tartozhat.

CREATE TABLE IF NOT EXISTS public.category_filter_groups (
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  group_slug TEXT NOT NULL,
  PRIMARY KEY (category_id, group_slug)
);

CREATE INDEX IF NOT EXISTS idx_category_filter_groups_category_id ON public.category_filter_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_category_filter_groups_group_slug ON public.category_filter_groups(group_slug);

ALTER TABLE public.category_filter_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "category_filter_groups_select" ON public.category_filter_groups FOR SELECT USING (true);
CREATE POLICY "category_filter_groups_insert" ON public.category_filter_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "category_filter_groups_delete" ON public.category_filter_groups FOR DELETE USING (auth.role() = 'authenticated');

-- Seed: jelenlegi kódban lévő hozzárendelések (kategória slug → group_slug lista)
-- Csak azokra a kategóriákra illesztünk, amelyek léteznek az adatbázisban.
INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, g.group_slug
FROM public.categories c
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY['tipus', 'kenyelmi-funkciok', 'kinek', 'evszak']) AS group_slug
) g
WHERE c.slug = 'szallasok'
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, g.group_slug
FROM public.categories c
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY['konyha-tipusa', 'etkezesi-igenyek']) AS group_slug
) g
WHERE c.slug = 'ettermek'
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, g.group_slug
FROM public.categories c
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY['hangulat', 'evszak', 'idoszak', 'kivel-mesz', 'ter']) AS group_slug
) g
WHERE c.slug = 'programok'
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, g.group_slug
FROM public.categories c
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY['program-tipusa', 'kinek-ajanlott', 'megkozelithetoseg', 'evszak', 'kivel-mesz', 'hangulat', 'ter']) AS group_slug
) g
WHERE c.slug = 'latnivalok'
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'paroknak'
FROM public.categories c
WHERE c.slug = 'paroknak'
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'esos-napra'
FROM public.categories c
WHERE c.slug IN ('esos-napra', 'esos_napra', 'esosnapra')
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, 'hetvegere'
FROM public.categories c
WHERE c.slug = 'hetvegere'
ON CONFLICT (category_id, group_slug) DO NOTHING;

INSERT INTO public.category_filter_groups (category_id, group_slug)
SELECT c.id, g.group_slug
FROM public.categories c
CROSS JOIN LATERAL (
  SELECT unnest(ARRAY['korosztaly', 'ter', 'aktivitas', 'kreativ', 'kulturalis']) AS group_slug
) g
WHERE c.slug IN ('gyerekeknek', 'gyerekek')
ON CONFLICT (category_id, group_slug) DO NOTHING;
