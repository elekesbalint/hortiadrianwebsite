-- Bejelentkezett felhasználó törölheti a saját e-mailjét a hírlevél feliratkozók közül (Beállítások → Leiratkozás).
CREATE POLICY "newsletter_subscribers_delete_own" ON public.newsletter_subscribers
  FOR DELETE TO authenticated
  USING (email = (auth.jwt() ->> 'email'));
