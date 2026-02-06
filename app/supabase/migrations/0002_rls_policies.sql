-- RLS (Row Level Security) bekapcsolása
-- Így nem maradnak "unrestricted" a táblák: ki mit láthat/módosíthat policy-kkel szabályozzuk.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Kategóriák: mindenki olvashat (nyilvános), írni csak bejelentkezett felhasználó (admin)
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Helyek: mindenki olvashat, írni csak bejelentkezett felhasználó (admin)
CREATE POLICY "places_select" ON public.places
  FOR SELECT USING (true);

CREATE POLICY "places_insert" ON public.places
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "places_update" ON public.places
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "places_delete" ON public.places
  FOR DELETE USING (auth.role() = 'authenticated');
