-- Javítás: nagy-/kisbetű független egyezés, hogy a törlés mindig működjön (footer vs JWT email eltérés).
-- SELECT saját sor: kell a DELETE .select() visszaadáshoz, és hogy a kliens lássa, törölve lett-e sor.
DROP POLICY IF EXISTS "newsletter_subscribers_delete_own" ON public.newsletter_subscribers;

CREATE POLICY "newsletter_subscribers_select_own" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email')));

CREATE POLICY "newsletter_subscribers_delete_own" ON public.newsletter_subscribers
  FOR DELETE TO authenticated
  USING (LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email')));
