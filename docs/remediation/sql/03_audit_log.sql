-- =============================================================================
-- 03_audit_log.sql                                Remediation Guide: Phase 1, Step 1.5
-- -----------------------------------------------------------------------------
-- Moves audit logging into the database (F-09). Today audit rows are written by
-- the browser (lib/audit.ts -> POST /api/audit-log): failures are ignored, most
-- mutations never log, and any user can forge entries for anyone else.
-- After this file:
--   * every INSERT/UPDATE/DELETE on the tables below is recorded by a trigger,
--     with the real caller (auth.uid()) - it cannot be skipped or forged;
--   * app users cannot insert/update/delete audit rows at all;
--   * confidential tables log WHICH fields changed, never their contents.
-- Then remove lib/audit.ts calls and the POST handler (guide Step 1.5).
--
-- Requires 01 (has_role). Idempotent. Creates audit_log if it was never created
-- (the live project was missing it on 2026-10-17).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public.audit_log (resource_type, resource_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_log'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.audit_log', r.policyname);
  END LOOP;
END
$$;
CREATE POLICY audit_log_select ON public.audit_log FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'elder')));
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_log FROM anon, authenticated;

-- Trigger function. SECURITY DEFINER so it can write audit_log although callers cannot.
-- TG_ARGV[0] = 'redact' -> record only the names of changed fields (confidential tables).
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_row jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  old_row jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  changed jsonb;
  redact  boolean := COALESCE(TG_ARGV[0], '') = 'redact';
  actor   uuid := auth.uid();
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT jsonb_object_agg(n.key, jsonb_build_object('old', old_row -> n.key, 'new', n.value))
      INTO changed
      FROM jsonb_each(new_row) n
     WHERE n.value IS DISTINCT FROM old_row -> n.key
       AND n.key <> 'updated_at';
    IF changed IS NULL THEN
      RETURN NEW;  -- nothing actually changed
    END IF;
  END IF;

  INSERT INTO public.audit_log (user_id, user_email, action, resource_type, resource_id, details)
  VALUES (
    actor,
    (SELECT u.email FROM auth.users u WHERE u.id = actor),
    lower(TG_OP),
    TG_TABLE_NAME,
    COALESCE(new_row, old_row) ->> 'id',
    CASE
      WHEN redact AND TG_OP = 'UPDATE' THEN
        jsonb_build_object('changed_fields', (SELECT jsonb_agg(k) FROM jsonb_object_keys(changed) AS k))
      WHEN redact THEN NULL
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('changed', changed)
      ELSE jsonb_build_object('row', COALESCE(new_row, old_row))
    END
  );
  RETURN COALESCE(NEW, OLD);
END
$$;

REVOKE ALL ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;

-- Attach to every table that holds money, people, permissions or pastoral care.
DO $$
DECLARE
  full_audit text[] := ARRAY[
    'profiles', 'financial_transactions', 'ministries', 'ministry_members', 'events',
    'documents', 'announcements', 'baptisms', 'attendance_records', 'spiritual_candidates'];
  redacted_audit text[] := ARRAY[
    'counseling_services', 'deacon_care_visits', 'deacon_support_cases', 'charity_aid_requests',
    'charity_distributions', 'workers_aid_beneficiaries', 'workers_aid_disbursements',
    'prayer_requests', 'spiritual_follow_ups'];
  t text;
BEGIN
  FOREACH t IN ARRAY full_audit LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('DROP TRIGGER IF EXISTS audit_row_change ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audit_row_change AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
  END LOOP;
  FOREACH t IN ARRAY redacted_audit LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('DROP TRIGGER IF EXISTS audit_row_change ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audit_row_change AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.audit_row_change(''redact'')', t);
  END LOOP;
END
$$;

COMMIT;
