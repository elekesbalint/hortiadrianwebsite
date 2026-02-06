-- Helyek galéria fotói (részletes oldal Fotók fül) – nyilvános bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-photos', 'place-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "place_photos_public_read" ON storage.objects;
CREATE POLICY "place_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'place-photos');

DROP POLICY IF EXISTS "place_photos_authenticated_upload" ON storage.objects;
CREATE POLICY "place_photos_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'place-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "place_photos_authenticated_update" ON storage.objects;
CREATE POLICY "place_photos_authenticated_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'place-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "place_photos_authenticated_delete" ON storage.objects;
CREATE POLICY "place_photos_authenticated_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'place-photos' AND auth.role() = 'authenticated');
