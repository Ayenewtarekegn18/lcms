-- =============================================================================
-- verify_security.sql                       Remediation Guide: Steps 0.4, 1.3, 1.5
-- -----------------------------------------------------------------------------
-- Proves the lockdown works by acting as an anonymous visitor, a plain member,
-- a finance user and an admin, and checking what each one can do.
-- Run AFTER 01 (and again after 02 and 03). Run as `postgres`:
--   * Supabase SQL editor: paste and run. "Success" means every check passed;
--     a failure aborts with an error that lists the failed checks (and nothing
--     is left behind, because the whole script rolls back).
--   * psql:  psql "$DB_URL" -1 -v ON_ERROR_STOP=1 -f verify_security.sql
-- Test users use fixed ids (…-00000000c0de) and are deleted at the end.
-- =============================================================================

-- Runs one statement as a given user (NULL = anonymous) and returns its single
-- value, or 'denied:<sqlstate>' if Postgres refused it.
CREATE OR REPLACE FUNCTION pg_temp.try_as(p_uid uuid, p_sql text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE v text;
BEGIN
  PERFORM set_config('request.jwt.claims',
                     CASE WHEN p_uid IS NULL THEN '{"role":"anon"}'
                          ELSE json_build_object('sub', p_uid, 'role', 'authenticated')::text END, true);
  PERFORM set_config('request.jwt.claim.sub', COALESCE(p_uid::text, ''), true);
  EXECUTE CASE WHEN p_uid IS NULL THEN 'SET LOCAL ROLE anon' ELSE 'SET LOCAL ROLE authenticated' END;
  BEGIN
    EXECUTE p_sql INTO v;
    v := COALESCE(v, 'null');
  EXCEPTION WHEN OTHERS THEN
    v := 'denied:' || SQLSTATE;  -- 42501 = permission denied / RLS violation
  END;
  RESET ROLE;
  RETURN v;
END
$$;

DO $$
DECLARE
  member_id  constant uuid := '00000000-0000-4000-8000-00000001c0de';
  finance_id constant uuid := '00000000-0000-4000-8000-00000002c0de';
  admin_id   constant uuid := '00000000-0000-4000-8000-00000003c0de';
  signup_id  constant uuid := '00000000-0000-4000-8000-00000004c0de';
  leader_id  constant uuid := '00000000-0000-4000-8000-00000005c0de';
  failures text := '';
  passed int := 0;
  got text;
BEGIN
  IF to_regprocedure('public.has_role(text[])') IS NULL THEN
    RAISE EXCEPTION 'verify_security: run 01_emergency_lockdown.sql first (public.has_role() is missing)';
  END IF;

  -- leftovers from an interrupted run
  DELETE FROM public.financial_transactions WHERE description = 'verify_security test row';
  IF to_regclass('public.documents') IS NOT NULL THEN
    DELETE FROM public.documents WHERE name LIKE 'verify_security %';
  END IF;
  DELETE FROM public.profiles WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id);
  DELETE FROM auth.users WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id);

  -- Test users (the sign-up trigger creates their profiles)
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    (member_id,  'verify-member@example.invalid',  '{"first_name":"Verify"}'),
    (finance_id, 'verify-finance@example.invalid', '{"first_name":"Verify"}'),
    (admin_id,   'verify-admin@example.invalid',   '{"first_name":"Verify"}'),
    (leader_id,  'verify-leader@example.invalid',  '{"first_name":"Verify"}'),
    -- attacker-style sign-up: asks for admin through metadata
    (signup_id,  'verify-signup@example.invalid',  '{"first_name":"Verify","is_admin":true,"role":"admin"}');
  UPDATE public.profiles SET role = 'finance' WHERE id = finance_id;
  UPDATE public.profiles SET role = 'admin'   WHERE id = admin_id;
  UPDATE public.profiles SET role = 'ministry_leader' WHERE id = leader_id;
  INSERT INTO public.financial_transactions (transaction_type, amount, description, member_id, recorded_by_id)
  VALUES ('income', 100, 'verify_security test row', admin_id, admin_id);

  -- Each check: run as a user, compare, record pass/fail.
  got := (SELECT role FROM public.profiles WHERE id = signup_id);
  IF got = 'member' THEN passed := passed + 1; ELSE failures := failures || E'\n  sign-up metadata cannot grant admin (role=' || got || ')'; END IF;

  got := pg_temp.try_as(NULL, 'SELECT count(*) FROM public.profiles');
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  anon cannot read profiles (got ' || got || ')'; END IF;

  got := pg_temp.try_as(NULL, 'SELECT count(*) FROM public.financial_transactions');
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  anon cannot read finances (got ' || got || ')'; END IF;

  got := pg_temp.try_as(NULL, $q$INSERT INTO public.financial_transactions (transaction_type, amount, recorded_by_id) VALUES ('income', 1, gen_random_uuid()) RETURNING 'inserted'$q$);
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  anon cannot insert finances (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, 'SELECT count(*) FROM public.profiles');
  IF got = '1' THEN passed := passed + 1; ELSE failures := failures || E'\n  member sees only own profile (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, $q$SELECT count(*) FROM public.financial_transactions WHERE description = 'verify_security test row'$q$);
  IF got = '0' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot read others'' giving (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, format($q$WITH u AS (UPDATE public.profiles SET role = 'admin' WHERE id = %L RETURNING 1) SELECT count(*) FROM u$q$, member_id));
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot set own role=admin (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, format($q$WITH u AS (UPDATE public.profiles SET is_admin = true WHERE id = %L RETURNING 1) SELECT count(*) FROM u$q$, member_id));
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot set own is_admin=true (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, format($q$WITH u AS (UPDATE public.profiles SET phone = '+251900000000' WHERE id = %L RETURNING 1) SELECT count(*) FROM u$q$, member_id));
  IF got = '1' THEN passed := passed + 1; ELSE failures := failures || E'\n  member can still edit own phone (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, format($q$WITH d AS (DELETE FROM public.profiles WHERE id = %L RETURNING 1) SELECT count(*) FROM d$q$, member_id));
  IF got = '0' OR got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot delete own profile (got ' || got || ')'; END IF;

  got := pg_temp.try_as(member_id, $q$INSERT INTO public.financial_transactions (transaction_type, amount, recorded_by_id) VALUES ('income', 1, auth.uid()) RETURNING 'inserted'$q$);
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot record transactions (got ' || got || ')'; END IF;

  got := pg_temp.try_as(finance_id, $q$SELECT count(*) FROM public.financial_transactions WHERE description = 'verify_security test row'$q$);
  IF got = '1' THEN passed := passed + 1; ELSE failures := failures || E'\n  finance can read finances (got ' || got || ')'; END IF;

  got := pg_temp.try_as(finance_id, format($q$WITH u AS (UPDATE public.profiles SET role = 'admin' WHERE id = %L RETURNING 1) SELECT count(*) FROM u$q$, finance_id));
  IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  finance cannot promote self (got ' || got || ')'; END IF;

  got := pg_temp.try_as(admin_id, format($q$WITH u AS (UPDATE public.profiles SET role = 'ministry_leader' WHERE id = %L RETURNING 1) SELECT count(*) FROM u$q$, member_id));
  IF got = '1' THEN passed := passed + 1; ELSE failures := failures || E'\n  admin can change a member''s role (got ' || got || ')'; END IF;
  UPDATE public.profiles SET role = 'member' WHERE id = member_id;

  -- audit forgery is closed by 02/03, so only checked once 03's trigger is installed
  IF to_regclass('public.audit_log') IS NOT NULL AND to_regprocedure('public.audit_row_change()') IS NOT NULL THEN
    got := pg_temp.try_as(member_id, $q$INSERT INTO public.audit_log (action, resource_type) VALUES ('forged', 'test') RETURNING 'inserted'$q$);
    IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot forge audit entries (got ' || got || ')'; END IF;
  END IF;

  IF to_regclass('public.deacon_care_visits') IS NOT NULL THEN
    got := pg_temp.try_as(member_id, 'SELECT count(*) FROM public.deacon_care_visits');
    IF got = '0' OR got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot read deacon care notes (got ' || got || ')'; END IF;
  END IF;

  IF to_regclass('public.documents') IS NOT NULL THEN
    INSERT INTO public.documents (name, file_path, access_level) VALUES
      ('verify_security public', 'verify/public', 'Public'),
      ('verify_security staff', 'verify/staff', 'Staff Only'),
      ('verify_security leadership', 'verify/leadership', 'Leadership Only');
    got := pg_temp.try_as(member_id, $q$SELECT count(*) FROM public.documents WHERE name LIKE 'verify_security %'$q$);
    IF got = '1' THEN passed := passed + 1; ELSE failures := failures || E'\n  member sees only Public documents (got ' || got || ')'; END IF;
    got := pg_temp.try_as(leader_id, $q$SELECT count(*) FROM public.documents WHERE name LIKE 'verify_security %'$q$);
    IF got = '2' THEN passed := passed + 1; ELSE failures := failures || E'\n  leader sees Public + Staff Only documents (got ' || got || ')'; END IF;
    got := pg_temp.try_as(admin_id, $q$SELECT count(*) FROM public.documents WHERE name LIKE 'verify_security %'$q$);
    IF got = '3' THEN passed := passed + 1; ELSE failures := failures || E'\n  admin sees all documents (got ' || got || ')'; END IF;
    got := pg_temp.try_as(leader_id, $q$INSERT INTO public.documents (name, file_path, access_level) VALUES ('verify_security escalate', 'verify/x', 'Leadership Only') RETURNING 'inserted'$q$);
    IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  leader cannot create Leadership Only documents (got ' || got || ')'; END IF;
  END IF;

  -- clean up
  DELETE FROM public.financial_transactions WHERE description = 'verify_security test row';
  IF to_regclass('public.documents') IS NOT NULL THEN
    DELETE FROM public.documents WHERE name LIKE 'verify_security %';
  END IF;
  DELETE FROM public.profiles WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id);
  DELETE FROM auth.users WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id);
  IF to_regclass('public.audit_log') IS NOT NULL THEN
    DELETE FROM public.audit_log WHERE user_id IN (member_id, finance_id, admin_id, signup_id, leader_id)
       OR resource_id IN (member_id::text, finance_id::text, admin_id::text, signup_id::text, leader_id::text)
       OR details::text LIKE '%verify_security%';
  END IF;

  IF failures <> '' THEN
    RAISE EXCEPTION 'verify_security: % passed, FAILED:%', passed, failures;
  END IF;
  RAISE NOTICE 'verify_security: all % checks passed', passed;
END
$$;
