-- Felkapott helyek sorrendje a kezdőlapon (adminból kezelhető)
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS featured_order INTEGER;

COMMENT ON COLUMN public.places.featured_order IS 'NULL = nem felkapott; 1, 2, 3... = sorrend a kezdőlap „Felkapott helyek” szekciójában';
