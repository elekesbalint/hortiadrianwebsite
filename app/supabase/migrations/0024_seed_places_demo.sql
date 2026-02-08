-- Példa helyek tömeges feltöltése – minden kategóriába 2–3 hely, hogy látszódjon a kinézet.
-- Futtatás: Supabase SQL Editor vagy: supabase db push / migration up

-- Étterem (ettermek)
INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, phone, website, rating, rating_count, is_active, featured_order)
SELECT 'Gerbeaud', 'gerbeaud-budapest', 'A Vörösmarty tér ikonikus kávéháza és cukrászda, 1858 óta.', id, 'Vörösmarty tér 7', 'Budapest', 'Budapest', 47.4965, 19.0512, '+36 1 429 9000', 'https://gerbeaud.hu', 4.6, 2847, true, 1 FROM public.categories WHERE slug = 'ettermek' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, phone, website, rating, rating_count, is_active, featured_order)
SELECT 'Halászbástya étterem', 'halaszbastya-etterem-budapest', 'A Halászbástya lábánál, panorámás kilátással a Duna és a Pest oldalra.', id, 'Halászbástya', 'Budapest', 'Budapest', 47.5020, 19.0344, NULL, NULL, 4.3, 1203, true, 2 FROM public.categories WHERE slug = 'ettermek' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, phone, rating, rating_count, is_active)
SELECT 'Tihanyi Halászkert', 'tihanyi-halaszcsarda', 'Híres halászlé és pálinka a Balaton-parton.', id, 'Kossuth Lajos u. 16', 'Tihany', 'Veszprém', 46.9142, 17.8891, '+36 87 538 208', 4.5, 892, true FROM public.categories WHERE slug = 'ettermek' LIMIT 1;

-- Szállás (szallasok)
INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, phone, website, rating, rating_count, is_active, featured_order)
SELECT 'Gellért Szálló', 'gellert-szallo-budapest', 'Legendás fürdőszálló a Gellért-hegy lábánál, gyógyfürdővel.', id, 'Szent Gellért rakpart 1', 'Budapest', 'Budapest', 47.4839, 19.0531, '+36 1 889 5500', 'https://www.danubius.eu/gellert', 4.7, 5621, true, 3 FROM public.categories WHERE slug = 'szallasok' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, phone, rating, rating_count, is_active)
SELECT 'Anna Grand Hotel', 'anna-grand-siofok', 'Negycsillagos szálloda a Siófok belvárosában, strandra közel.', id, 'Fő u. 11', 'Siófok', 'Somogy', 46.9052, 18.0556, '+36 84 312 345', 4.4, 1203, true FROM public.categories WHERE slug = 'szallasok' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, rating, rating_count, is_active)
SELECT 'Tündérkert Panzió', 'tunderkert-panzio-eger', 'Kis családi panzió Eger szívében, borvidék közelében.', id, 'Széchenyi u. 28', 'Eger', 'Heves', 47.9025, 20.3772, 4.6, 445, true FROM public.categories WHERE slug = 'szallasok' LIMIT 1;

-- Látnivaló (latnivalok)
INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, website, rating, rating_count, is_active, featured_order)
SELECT 'Budavári Palota', 'budavari-palota', 'A történelmi királyi palota a Várhegyen, múzeumokkal és kilátással.', id, 'Szent György tér 2', 'Budapest', 'Budapest', 47.4960, 19.0396, 'https://www.btm.hu', 4.8, 32104, true, 4 FROM public.categories WHERE slug = 'latnivalok' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, rating, rating_count, is_active)
SELECT 'Hollókő ófalu', 'holloko-ofalu', 'Az UNESCO világörökség része, élő skanzen és műemlék falu.', id, 'Kossuth Lajos u. 82', 'Hollókő', 'Nógrád', 47.9972, 19.5897, 4.7, 2891, true FROM public.categories WHERE slug = 'latnivalok' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, rating, rating_count, is_active)
SELECT 'Aggtelek – Baradla', 'aggtelek-baradla-barlang', 'A Baradla cseppkőbarlang és az Aggteleki Nemzeti Park.', id, 'Baradla oldal', 'Aggtelek', 'Borsod-Abaúj-Zemplén', 48.4711, 20.4964, 4.9, 4521, true FROM public.categories WHERE slug = 'latnivalok' LIMIT 1;

-- Program (programok)
INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, website, rating, rating_count, is_active)
SELECT 'Széchenyi Gyógyfürdő', 'szechenyi-gyogyfurdo', 'Nyitott és fedett termálmedencék, egyik legismertebb budapesti program.', id, 'Állatkerti krt. 9–11', 'Budapest', 'Budapest', 47.5185, 19.0810, 'https://www.szechenyifurdo.hu', 4.6, 18723, true FROM public.categories WHERE slug = 'programok' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, rating, rating_count, is_active)
SELECT 'Visegrádi Fellegvár', 'visegradi-fellegvar', 'Királyi palota és fellegvár, középkori programok és kirándulás.', id, 'Vár u.', 'Visegrád', 'Pest', 47.7892, 18.9703, 4.5, 3421, true FROM public.categories WHERE slug = 'programok' LIMIT 1;

INSERT INTO public.places (name, slug, description, category_id, address, city, county, latitude, longitude, rating, rating_count, is_active)
SELECT 'Hortobágyi Nemzeti Park', 'hortobagy-nemzeti-park', 'Pusztasétány, csikós bemutató, tájház és madárvilág.', id, 'Hortobágy', 'Hortobágy', 'Hajdú-Bihar', 47.5833, 21.1500, 4.6, 2103, true FROM public.categories WHERE slug = 'programok' LIMIT 1;
