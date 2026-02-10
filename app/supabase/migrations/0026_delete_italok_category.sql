-- "Italok" kategória törlése és a hozzá tartozó helyek törlése
-- Ez a migráció törli az "italok" kategóriát és az összes hozzá tartozó helyet

DO $$
DECLARE
  italok_category_id UUID;
  places_count INTEGER;
BEGIN
  -- Megkeressük az "italok" kategóriát (slug vagy név alapján)
  SELECT id INTO italok_category_id
  FROM public.categories
  WHERE slug = 'italok' OR name ILIKE '%italok%' OR name ILIKE '%ital%'
  LIMIT 1;
  
  -- Ha megtaláltuk a kategóriát
  IF italok_category_id IS NOT NULL THEN
    -- Számoljuk meg a helyeket
    SELECT COUNT(*) INTO places_count
    FROM public.places
    WHERE category_id = italok_category_id;
    
    -- Töröljük az összes hozzá tartozó helyet (CASCADE miatt automatikusan törlődnek a kapcsolódó rekordok is)
    DELETE FROM public.places
    WHERE category_id = italok_category_id;
    
    -- Töröljük magát a kategóriát
    DELETE FROM public.categories
    WHERE id = italok_category_id;
    
    RAISE NOTICE 'Italok kategória törölve. Törölt helyek száma: %', places_count;
  ELSE
    RAISE NOTICE 'Italok kategória nem található.';
  END IF;
END $$;
