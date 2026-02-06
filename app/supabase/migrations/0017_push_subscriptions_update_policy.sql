-- Push feliratkozás: upsert (on conflict) UPDATE-hez policy (RLS)
CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "push_subscriptions_update_own" ON public.push_subscriptions IS
  'Saját feliratkozás frissítése (pl. upsert endpoint konfliktusnál).';
