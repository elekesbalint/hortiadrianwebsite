-- Kategória banner képek – nyilvános bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-banners', 'category-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Olvasás: mindenki
DROP POLICY IF EXISTS "category_banners_public_read" ON storage.objects;
CREATE POLICY "category_banners_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-banners');

-- Feltöltés: bejelentkezett felhasználó (admin)
DROP POLICY IF EXISTS "category_banners_authenticated_upload" ON storage.objects;
CREATE POLICY "category_banners_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'category-banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "category_banners_authenticated_update" ON storage.objects;
CREATE POLICY "category_banners_authenticated_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'category-banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "category_banners_authenticated_delete" ON storage.objects;
CREATE POLICY "category_banners_authenticated_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'category-banners' AND auth.role() = 'authenticated');
