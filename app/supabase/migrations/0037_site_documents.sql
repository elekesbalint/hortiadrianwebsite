-- Dokumentumok (pl. Partnereinknek PDF) tárolása: nyilvános bucket + URL tábla
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Olvasás: mindenki
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Feltöltés/módosítás/törlés: bejelentkezett (admin)
DROP POLICY IF EXISTS "documents_authenticated_upload" ON storage.objects;
CREATE POLICY "documents_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "documents_authenticated_update" ON storage.objects;
CREATE POLICY "documents_authenticated_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;
CREATE POLICY "documents_authenticated_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Tábla: melyik oldalhoz melyik dokumentum URL tartozik
CREATE TABLE IF NOT EXISTS public.site_documents (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;

-- Olvasás: mindenki (a nyilvános oldalnak kell)
CREATE POLICY "site_documents_select" ON public.site_documents
  FOR SELECT USING (true);

-- Írás: csak bejelentkezett (admin)
CREATE POLICY "site_documents_insert" ON public.site_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "site_documents_update" ON public.site_documents
  FOR UPDATE USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.site_documents IS 'Oldal-specifikus dokumentumok URL-jei (pl. Partnereinknek PDF).';
