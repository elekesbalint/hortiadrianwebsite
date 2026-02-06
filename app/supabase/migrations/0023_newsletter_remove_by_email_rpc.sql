-- Hírlevél leiratkozás e-mail alapján, kis-/nagybetűtől függetlenül (pl. Google OAuth más formátumban tárol).
CREATE OR REPLACE FUNCTION public.remove_newsletter_subscriber_by_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  DELETE FROM newsletter_subscribers
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

COMMENT ON FUNCTION public.remove_newsletter_subscriber_by_email(text) IS 'Hírlevél feliratkozó törlése e-mail alapján (case-insensitive). Service role / server action hívja.';
