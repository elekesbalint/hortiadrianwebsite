-- Étlapok (JPG/PDF) tárolása – nyilvános bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('menus', 'menus', true)
ON CONFLICT (id) DO NOTHING;

-- Olvasás: mindenki (nyilvános bucket)
DROP POLICY IF EXISTS "menus_public_read" ON storage.objects;
CREATE POLICY "menus_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menus');

-- Feltöltés: bejelentkezett felhasználó (admin panelből)
DROP POLICY IF EXISTS "menus_authenticated_upload" ON storage.objects;
CREATE POLICY "menus_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menus' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "menus_authenticated_update" ON storage.objects;
CREATE POLICY "menus_authenticated_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'menus' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "menus_authenticated_delete" ON storage.objects;
CREATE POLICY "menus_authenticated_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'menus' AND auth.role() = 'authenticated');
