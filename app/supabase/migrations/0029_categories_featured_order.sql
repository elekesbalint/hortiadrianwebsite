-- Felkapott kategóriák sorrendje a kezdőlapon (adminból kezelhető)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS featured_order INTEGER;

COMMENT ON COLUMN public.categories.featured_order IS 'NULL = nem felkapott; 1, 2, 3... = sorrend a kezdőlap „Felkapott kategóriák” szekciójában';
