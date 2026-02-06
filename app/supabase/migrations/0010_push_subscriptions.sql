-- Push értesítés feliratkozások (Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Saját feliratkozás mentése
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saját feliratkozások olvasása/törlése
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Admin (service role) minden feliratkozást olvashat a küldéshez
-- (service role kihagyja az RLS-t, külön policy nem kell)
