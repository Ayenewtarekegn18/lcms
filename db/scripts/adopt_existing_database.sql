-- =============================================================================
-- adopt_existing_database.sql                     Remediation Guide: Phase 1, Step 1.1
-- -----------------------------------------------------------------------------
-- For a database that was built by pasting scripts/legacy/*.sql into the SQL
-- editor (the live project). Records which db/migrations are ALREADY reflected
-- in the database, so `npm run db:up` only applies what is missing.
--
-- Run ONCE, as postgres, in the SQL editor (or psql), BEFORE the first
-- `npm run db:up`. Safe to re-run. Changes nothing except the dbmate table.
--
-- Only legacy migrations that are not safe to re-run are marked; idempotent ones
-- (016 and all 2026-10 remediation migrations) are simply applied by dbmate.
-- The final SELECT shows what was marked and what dbmate will apply.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS dbmate;
CREATE TABLE IF NOT EXISTS dbmate.schema_migrations (version varchar PRIMARY KEY);

INSERT INTO dbmate.schema_migrations (version)
SELECT m.version
  FROM (VALUES
    -- baseline = legacy 001, 002, 003, 004, 008
    ('20260209000000', to_regclass('public.profiles') IS NOT NULL
                       AND to_regclass('public.counseling_services') IS NOT NULL
                       AND to_regclass('public.translations') IS NOT NULL),
    ('20260209000011', to_regclass('public.announcements') IS NOT NULL),
    ('20260209000012', to_regclass('public.documents') IS NOT NULL),
    ('20260209000013', EXISTS (SELECT 1 FROM information_schema.columns
                                WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_date')),
    ('20260209000014', to_regclass('public.audit_log') IS NOT NULL),
    ('20260209000015', to_regclass('public.spiritual_candidates') IS NOT NULL)
  ) AS m(version, applied)
 WHERE m.applied
ON CONFLICT (version) DO NOTHING;

-- Partial states that need a human: the baseline must be fully present.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM dbmate.schema_migrations WHERE version = '20260209000000') THEN
    RAISE EXCEPTION 'profiles exists but the rest of the baseline (counseling_services, translations) does not: inspect with db/scripts/inspect_schema.sql before migrating';
  END IF;
END
$$;

SELECT version, 'already present - marked as applied' AS status FROM dbmate.schema_migrations ORDER BY version;
