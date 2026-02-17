-- Kiemelt kategóriák (Pároknak, Esős Napra, Hétvégére) szűrői
-- A főoldal kiemelt kategóriáihoz tartozó szűrő opciók

-- 1. Pároknak kategória szűrői
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Program típusa', 'paroknak', 'Romantikus programok', 'romantikus-programok', 1, true),
  ('Program típusa', 'paroknak', 'Gasztro élmények', 'gasztro-elmenyek', 2, true),
  ('Program típusa', 'paroknak', 'Kulturális programok', 'kulturalis-programok', 3, true),
  ('Program típusa', 'paroknak', 'Aktív & kalandos programok', 'aktiv-kalandos-programok', 4, true),
  ('Program típusa', 'paroknak', 'Kreatív programok', 'kreativ-programok', 5, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 2. Esős Napra kategória szűrői
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Program típusa', 'esos-napra', 'Mozi & filmélmény', 'mozi-filmelmeny', 1, true),
  ('Program típusa', 'esos-napra', 'Színház & előadások', 'szinhaz-eloadasok', 2, true),
  ('Program típusa', 'esos-napra', 'Kiállítás & múzeum', 'kiallitas-muzeum', 3, true),
  ('Program típusa', 'esos-napra', 'Játék & élményprogram', 'jatek-elmenyprogram', 4, true),
  ('Program típusa', 'esos-napra', 'Gasztro programok', 'gasztro-programok', 5, true),
  ('Program típusa', 'esos-napra', 'Wellness & kikapcsolódás', 'wellness-kikapcsolodas', 6, true),
  ('Program típusa', 'esos-napra', 'Kreatív programok', 'kreativ-programok', 7, true)
ON CONFLICT (group_slug, slug) DO NOTHING;

-- 3. Hétvégére kategória szűrői
INSERT INTO public.filters (group_name, group_slug, name, slug, "order", is_active) VALUES
  ('Program típusa', 'hetvegere', 'Kirándulás & természet', 'kirandulas-termeszet', 1, true),
  ('Program típusa', 'hetvegere', 'Városi felfedezés', 'varosi-felfedezes', 2, true),
  ('Program típusa', 'hetvegere', 'Wellness & pihenés', 'wellness-pihenes', 3, true),
  ('Program típusa', 'hetvegere', 'Gasztro hétvége', 'gasztro-hetvege', 4, true),
  ('Program típusa', 'hetvegere', 'Élményprogramok', 'elmenyprogramok', 5, true),
  ('Program típusa', 'hetvegere', 'Kulturális programok', 'kulturalis-programok', 6, true)
ON CONFLICT (group_slug, slug) DO NOTHING;
