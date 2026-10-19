-- migrate:up
-- Data integrity (remediation step 1.6, findings F-14..F-16): updated_at triggers, actor defaults, ETB, positive amounts,
-- end >= start, and fkidx_* indexes on unindexed foreign keys. New CHECKs are NOT VALID; see db/scripts/inspect_schema.sql.

-- 1. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.table_name FROM information_schema.columns c
            JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
           WHERE c.table_schema = 'public' AND c.column_name = 'updated_at' AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END
$$;

-- 2. Actor columns default to the signed-in user.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
            WHERE table_schema = 'public'
              AND column_name IN ('recorded_by_id', 'organizer_id', 'uploaded_by_id', 'author_id', 'requested_by_id')
              AND data_type = 'uuid'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT auth.uid()', r.table_name, r.column_name);
  END LOOP;
END
$$;

-- 3. Money and dates
ALTER TABLE public.financial_transactions ALTER COLUMN currency SET DEFAULT 'ETB';
ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_amount_positive;
ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_amount_positive CHECK (amount > 0) NOT VALID;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_end_after_start;
ALTER TABLE public.events
  ADD CONSTRAINT events_end_after_start CHECK (end_date IS NULL OR end_date >= start_date) NOT VALID;

-- 4. Index every single-column foreign key that has no index starting with that column.
--    Named fkidx_<table>_<column> so the down migration can remove exactly these.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conrelid::regclass AS tbl, a.attname AS col, cl.relname AS tbl_name
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = cl.relnamespace
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
     WHERE con.contype = 'f' AND n.nspname = 'public' AND array_length(con.conkey, 1) = 1
       AND NOT EXISTS (SELECT 1 FROM pg_index i
                        WHERE i.indrelid = con.conrelid AND i.indkey[0] = con.conkey[1])
  LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)',
                   left('fkidx_' || r.tbl_name || '_' || r.col, 63), r.tbl, r.col);
  END LOOP;
END
$$;

-- migrate:down
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tgrelid::regclass AS tbl FROM pg_trigger WHERE tgname = 'set_updated_at' AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %s', r.tbl);
  END LOOP;
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND column_default = 'auth.uid()'
              AND column_name IN ('recorded_by_id', 'organizer_id', 'uploaded_by_id', 'author_id', 'requested_by_id')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
  END LOOP;
  FOR r IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'fkidx\_%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.indexname);
  END LOOP;
END
$$;
DROP FUNCTION IF EXISTS public.set_updated_at();
ALTER TABLE public.financial_transactions ALTER COLUMN currency SET DEFAULT 'USD';
ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_amount_positive;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_end_after_start;
