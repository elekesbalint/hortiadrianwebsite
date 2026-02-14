-- Árak és foglalás linkek a helyekhez (pl. szállás kategória)
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS price_url text,
  ADD COLUMN IF NOT EXISTS booking_url text;

COMMENT ON COLUMN places.price_url IS 'Külső link az árakhoz (pl. szállás árképzés)';
COMMENT ON COLUMN places.booking_url IS 'Külső link a foglaláshoz (pl. booking oldal)';
