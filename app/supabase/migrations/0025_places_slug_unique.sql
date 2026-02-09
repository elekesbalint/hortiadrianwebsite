-- Slug egyediség biztosítása: UNIQUE constraint a places.slug mezőn
-- SEO-barát URL-ekhez szükséges, hogy minden slug egyedi legyen.

-- Először generálunk slug-ot azoknak a helyeknek, akiknek nincs vagy üres
-- Slug generálás: lowercase, szóközök helyett kötőjel, speciális karakterek eltávolítása
DO $$
DECLARE
  place_rec RECORD;
  generated_slug TEXT;
  base_slug TEXT;
  counter INTEGER;
BEGIN
  FOR place_rec IN 
    SELECT id, name, slug
    FROM public.places
    WHERE is_active = true AND (slug IS NULL OR slug = '' OR TRIM(slug) = '')
  LOOP
    -- Slug generálás a névből
    base_slug := LOWER(TRIM(place_rec.name));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g'); -- szóközök → kötőjel
    base_slug := REGEXP_REPLACE(base_slug, '[^\p{L}\p{N}-]', '', 'g'); -- speciális karakterek eltávolítása
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g'); -- többszörös kötőjelek → egy
    base_slug := REGEXP_REPLACE(base_slug, '^-|-$', '', 'g'); -- elején/végén lévő kötőjelek eltávolítása
    IF base_slug = '' THEN
      base_slug := 'hely';
    END IF;
    
    -- Ellenőrizzük, hogy egyedi-e, ha nem, hozzáadunk számot
    generated_slug := base_slug;
    counter := 2;
    WHILE EXISTS (SELECT 1 FROM public.places WHERE slug = generated_slug AND id != place_rec.id) LOOP
      generated_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE public.places SET slug = generated_slug WHERE id = place_rec.id;
  END LOOP;
END $$;

-- Most javítjuk a duplikált slug-okat (ha vannak)
-- Duplikált slug-ok esetén hozzáadunk egy számot a végéhez (pl. trattoria-da-matteo-2)
DO $$
DECLARE
  dup RECORD;
  counter INTEGER;
  new_slug TEXT;
BEGIN
  FOR dup IN 
    SELECT slug, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as ids
    FROM public.places
    WHERE is_active = true AND slug IS NOT NULL AND slug != ''
    GROUP BY slug
    HAVING COUNT(*) > 1
  LOOP
    counter := 2;
    FOR i IN 2..array_length(dup.ids, 1) LOOP
      LOOP
        new_slug := dup.slug || '-' || counter;
        -- Ellenőrizzük, hogy ez a slug már létezik-e
        IF NOT EXISTS (SELECT 1 FROM public.places WHERE slug = new_slug) THEN
          EXIT;
        END IF;
        counter := counter + 1;
      END LOOP;
      -- Frissítjük a slug-ot
      UPDATE public.places SET slug = new_slug WHERE id = dup.ids[i];
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- UNIQUE constraint hozzáadása (csak ha még nem létezik)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'places_slug_unique' 
    AND conrelid = 'public.places'::regclass
  ) THEN
    ALTER TABLE public.places
      ADD CONSTRAINT places_slug_unique UNIQUE (slug);
    
    COMMENT ON CONSTRAINT places_slug_unique ON public.places IS 'SEO-barát URL-ekhez: minden slug egyedi kell legyen.';
  END IF;
END $$;
