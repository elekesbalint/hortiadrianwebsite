-- Elküldött push értesítések listája (az oldalon belüli „Értesítések” megjelenítéshez)
CREATE TABLE IF NOT EXISTS public.sent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sent_notifications ENABLE ROW LEVEL SECURITY;

-- Bejelentkezett felhasználók olvashassák (lista az oldalon)
CREATE POLICY "sent_notifications_select_authenticated" ON public.sent_notifications
  FOR SELECT TO authenticated USING (true);

-- Insert csak service role-lal (admin küldéskor)
