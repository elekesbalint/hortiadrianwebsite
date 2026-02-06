-- Anonim felhasználók is rögzíthessék a statisztikát (pl. oldalmegtekintés, kattintás)
DROP POLICY IF EXISTS "statistics_insert_authenticated" ON public.statistics;
CREATE POLICY "statistics_insert_all" ON public.statistics
  FOR INSERT WITH CHECK (true);
