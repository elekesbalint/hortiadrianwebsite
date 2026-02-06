-- Hírlevél feliratkozók: csak e-mail és időbélyeg. Duplikátum nem engedélyezett.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Bárki (anon is) beszúrhat egy e-mailt (feliratkozás)
CREATE POLICY "newsletter_subscribers_insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- SELECT: csak service_role vagy később admin (jelenleg nem kell nyilvános olvasás)
-- Nincs SELECT policy → csak service_role látja (Dashboard, backend).

COMMENT ON TABLE public.newsletter_subscribers IS 'Hírlevél feliratkozók e-mail címei. A footer Feliratkozás gomb ide ment.';
