-- Kategória-specifikus szűrők hozzáadása és módosítások
-- 1. "Babával" opció törlése a "Kivel mész?" csoportból
DELETE FROM public.filters WHERE group_slug = 'kivel-mesz' AND slug = 'babaval';

-- 2. SZÁLLÁSOK kategória új szűrői

-- 2.1. Típus (A "Wow"-faktor)
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Típus', 'tipus', 'Luxus Hotel', 'luxus-hotel', 1, true),
  ('Típus', 'tipus', 'Boutique Hotel', 'boutique-hotel', 2, true),
  ('Típus', 'tipus', 'Romantikus Faház / Kabinház', 'romantikus-fahaz-kabinhaz', 3, true),
  ('Típus', 'tipus', 'Apartman', 'apartman', 4, true),
  ('Típus', 'tipus', 'Glamping', 'glamping', 5, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 2.2. Kényelmi funkciók
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Kényelmi funkciók', 'kenyelmi-funkciok', 'Jakuzzi / Fűthető dézsa', 'jakuzzi-futheto-dezsa', 1, true),
  ('Kényelmi funkciók', 'kenyelmi-funkciok', 'Szauna / Wellness', 'szauna-wellness', 2, true),
  ('Kényelmi funkciók', 'kenyelmi-funkciok', 'Medence', 'medence', 3, true),
  ('Kényelmi funkciók', 'kenyelmi-funkciok', 'Panoráma', 'panorama', 4, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 2.3. "Kinek?" (Célcsoport)
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Kinek?', 'kinek', 'Csak felnőtteknek', 'csak-felnotteknek', 1, true),
  ('Kinek?', 'kinek', 'Családbarát', 'csaladbarat', 2, true),
  ('Kinek?', 'kinek', 'Kutyabarát', 'kutyabarat', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 3. ÉTTERMEK kategória új szűrői

-- 3.1. Konyha típusa
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Konyha típusa', 'konyha-tipusa', 'Magyaros', 'magyaros', 1, true),
  ('Konyha típusa', 'konyha-tipusa', 'Olasz (Pasta & Pizza)', 'olasz', 2, true),
  ('Konyha típusa', 'konyha-tipusa', 'Ázsiai (Sushi, Ramen, Thai)', 'azsiai', 3, true),
  ('Konyha típusa', 'konyha-tipusa', 'Street Food (Burger, Gyros)', 'street-food', 4, true),
  ('Konyha típusa', 'konyha-tipusa', 'Fine Dining', 'fine-dining', 5, true),
  ('Konyha típusa', 'konyha-tipusa', 'Reggeliző / Brunch', 'reggelizo-brunch', 6, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 3.2. Étkezési igények
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Étkezési igények', 'etkezesi-igenyek', 'Vegetáriánus / Vegán', 'vegetarianus-vegan', 1, true),
  ('Étkezési igények', 'etkezesi-igenyek', 'Gluténmentes opciók', 'glutenmentes', 2, true),
  ('Étkezési igények', 'etkezesi-igenyek', 'Laktózmentes opciók', 'laktozmentes', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 4. PROGRAMOK kategória új szűrői

-- 4.1. Hangulat (már létezik, de ellenőrizzük)
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Hangulat', 'hangulat', 'Chill', 'chill', 1, true),
  ('Hangulat', 'hangulat', 'Aktív', 'aktiv', 2, true),
  ('Hangulat', 'hangulat', 'Élmény', 'elmeny', 3, true),
  ('Hangulat', 'hangulat', 'Kultúrális', 'kulturalis', 4, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 5. LÁTNIVALÓK kategória új szűrői

-- 5.1. Program típusa
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Program típusa', 'program-tipusa', 'Kilátók & Panoráma', 'kilatok-panorama', 1, true),
  ('Program típusa', 'program-tipusa', 'Parkok & Kert', 'parkok-kert', 2, true),
  ('Program típusa', 'program-tipusa', 'Kulturális & Történelmi', 'kulturalis-tortenelmi', 3, true),
  ('Program típusa', 'program-tipusa', 'Természeti csodák', 'termeszeti-codak', 4, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 5.2. Kinek ajánlott?
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Kinek ajánlott?', 'kinek-ajanlott', 'Gyerekkel', 'gyerekkel', 1, true),
  ('Kinek ajánlott?', 'kinek-ajanlott', 'Kutyával', 'kutyaval', 2, true),
  ('Kinek ajánlott?', 'kinek-ajanlott', 'Esős időre', 'esos-idore', 3, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 5.3. Megközelíthetőség (módosítás: új opciók)
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Megközelíthetőség', 'megkozelithetoseg', 'Autóval könnyű', 'autoval-konnyu', 1, true),
  ('Megközelíthetőség', 'megkozelithetoseg', 'Tömegközlekedéssel elérhető', 'tomegkozlekedessel-elerheto', 2, true)
ON CONFLICT (group_slug, slug) DO NOTHING;
