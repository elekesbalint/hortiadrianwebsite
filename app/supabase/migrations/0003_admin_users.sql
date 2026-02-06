-- Admin jogosultság: csak ebben a táblában szereplő user_id-k érhetik el az admin panelt.
-- Új admin hozzáadása: Supabase SQL Editor-ban futtasd (cseréld az e-mailt):
--   INSERT INTO public.admin_users (user_id) SELECT id FROM auth.users WHERE email = 'admin@programlaz.hu';

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Csak a saját sorodat látod: így tudjuk lekérdezni, hogy "én admin vagyok-e"
CREATE POLICY "admin_users_select_own" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE: csak service_role (Dashboard SQL, vagy backend). Normál user nem adhat hozzá admint.
-- Nincs policy authenticated-re → csak service_role tud írni.

COMMENT ON TABLE public.admin_users IS 'Csak ebben a táblában lévő user_id-k érhetik el az admin panelt.';
