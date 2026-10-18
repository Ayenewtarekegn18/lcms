-- =============================================================================
-- 04_schema_hardening.sql                         Remediation Guide: Phase 1, Step 1.6
-- -----------------------------------------------------------------------------
-- Data-integrity fixes that are safe on a live database (F-14, F-15, F-16):
--   * updated_at maintained by trigger on every table that has the column
--     (about 30 tables declare it; nothing ever updated it)
--   * "who did this" columns default to the caller, so inserts that forget them
--     (financial page, calendar) stop failing on NOT NULL
--   * money defaults to ETB, amounts must be positive, events cannot end before they start
--   * an index on every single-column foreign key that lacks one
-- New CHECK constraints are added NOT VALID: they apply to new/changed rows
-- immediately without failing on old data. The queries at the bottom show the
-- rows that violate them; clean those up, then run the VALIDATE statements.
-- Requires nothing else. Idempotent.
-- =============================================================================

BEGIN;

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
                   left('idx_' || r.tbl_name || '_' || r.col, 63), r.tbl, r.col);
  END LOOP;
END
$$;

COMMIT;

-- 5. Rows that violate the new constraints (fix or delete them, then validate).
SELECT 'financial_transactions' AS table_name, id, amount::text AS problem
  FROM public.financial_transactions WHERE amount <= 0
UNION ALL
SELECT 'events', id, 'end_date ' || end_date || ' < start_date ' || start_date
  FROM public.events WHERE end_date < start_date;

-- When the query above returns no rows:
-- ALTER TABLE public.financial_transactions VALIDATE CONSTRAINT financial_amount_positive;
-- ALTER TABLE public.events VALIDATE CONSTRAINT events_end_after_start;
