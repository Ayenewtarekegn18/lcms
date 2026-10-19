-- migrate:up
-- keepalive(): a trivial query the keep-warm pinger calls (GET /api/keepalive and the scheduled
-- GitHub workflow). Free Supabase projects pause after a period with no API/database activity;
-- a request every 10-15 minutes keeps the project active. It reads no tables and returns only
-- the database time, so anonymous callers learn nothing.
CREATE FUNCTION public.keepalive()
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT now() $$;
REVOKE ALL ON FUNCTION public.keepalive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keepalive() TO anon, authenticated, service_role;

-- migrate:down
DROP FUNCTION IF EXISTS public.keepalive();
