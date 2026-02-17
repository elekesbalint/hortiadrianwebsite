-- Admin user reset: régi admin törlése és új admin hozzáadása
-- FONTOS: Először hozd létre az új admin usert a Supabase Dashboard-ban:
-- 1. Supabase Dashboard > Authentication > Add user
--    - Email: aprogram@programlaz.hu
--    - Password: Boat2026!
--    - Auto Confirm User: ON
-- 2. Majd futtasd ezt a migrációt

-- Régi admin userek törlése az admin_users táblából
DELETE FROM public.admin_users 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@programlaz.hu'
);

-- Új admin user hozzáadása (csak akkor fut le, ha az auth.users táblában már létezik)
INSERT INTO public.admin_users (user_id) 
SELECT id FROM auth.users 
WHERE email = 'aprogram@programlaz.hu'
ON CONFLICT (user_id) DO NOTHING;
