-- Admin felhasználó email és jelszó módosítása
-- Felhasználónév: AProgram (email formátumban: AProgram@programlaz.hu)
-- Jelszó: Boat2026!

-- Frissítjük az email-t az auth.users táblában
-- Megjegyzés: A Supabase-ban az email cím szolgál felhasználónévként a bejelentkezéshez
-- A bejelentkezésnél az "AProgram@programlaz.hu" email címet kell használni
UPDATE auth.users
SET 
  email = 'AProgram@programlaz.hu',
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"name": "AProgram"}'::jsonb,
  updated_at = now()
WHERE id IN (SELECT user_id FROM public.admin_users)
LIMIT 1;

-- FONTOS: A jelszó módosításához futtasd le a következő scriptet:
-- npx tsx app/scripts/update-admin-credentials.ts
-- 
-- VAGY módosítsd manuálisan a Supabase Dashboard-ban:
-- 1. Supabase Dashboard > Authentication > Users
-- 2. Válaszd ki a felhasználót (AProgram@programlaz.hu)
-- 3. Kattints a "Reset Password" vagy "Update User" gombra
-- 4. Állítsd be az új jelszót: Boat2026!
