-- Kategóriák
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image TEXT,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helyek
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  county TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  opening_hours JSONB,
  is_open BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  price_level INTEGER,
  rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  menu_url TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_places_category_id ON public.places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_is_active ON public.places(is_active);
CREATE INDEX IF NOT EXISTS idx_places_slug ON public.places(slug);

-- Alapértelmezett kategóriák
INSERT INTO public.categories (slug, name, "order") VALUES
  ('ettermek', 'Étterem', 1),
  ('szallasok', 'Szállás', 2),
  ('latnivalok', 'Látnivaló', 3),
  ('programok', 'Program', 4)
ON CONFLICT (slug) DO NOTHING;
