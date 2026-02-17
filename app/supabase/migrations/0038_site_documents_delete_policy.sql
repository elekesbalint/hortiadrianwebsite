-- Admin törölheti a site_documents sorokat (pl. Partnereinknek PDF eltávolítása)
DROP POLICY IF EXISTS "site_documents_delete" ON public.site_documents;
CREATE POLICY "site_documents_delete" ON public.site_documents
  FOR DELETE USING (auth.role() = 'authenticated');
