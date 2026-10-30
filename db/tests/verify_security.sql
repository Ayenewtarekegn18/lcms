-- =============================================================================
-- db/tests/verify_security.sql              Remediation Guide: Steps 0.4, 1.3, 1.5
-- -----------------------------------------------------------------------------
-- Proves the lockdown works by acting as an anonymous visitor, a plain member,
-- a finance user and an admin, and checking what each one can do.
-- Run after the emergency lockdown / `npm run db:up` (CI runs it after every migrate). Run as `postgres`:
--   * Supabase SQL editor: paste and run. "Success" means every check passed;
--     a failure aborts with an error that lists the failed checks (and nothing
--     is left behind, because the whole script rolls back).
--   * psql:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/tests/verify_security.sql
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
  -- don't leave the test user's identity on the transaction (it would be blamed for later statements)
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
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
  test_ids text[];
  seq_last bigint;
  seq_called boolean;
  test_number bigint;
BEGIN
  IF to_regprocedure('public.has_role(text[])') IS NULL THEN
    RAISE EXCEPTION 'verify_security: run 01_emergency_lockdown.sql first (public.has_role() is missing)';
  END IF;

  -- leftovers from an interrupted run
  DELETE FROM public.financial_transactions WHERE description = 'verify_security test row';
  IF to_regclass('public.documents') IS NOT NULL THEN
    DELETE FROM public.documents WHERE name LIKE 'verify_security %';
  END IF;
  DELETE FROM public.profiles WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id)
     OR (first_name = 'verify_security' AND last_name = 'registrant');
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

  IF to_regprocedure('public.register_member(jsonb)') IS NOT NULL THEN
    SELECT last_value, is_called INTO seq_last, seq_called FROM public.member_number_seq;
    got := pg_temp.try_as(member_id, $q$SELECT public.register_member('{"firstNameAm":"x","fatherNameAm":"y","sex":"male","phone":"0911000000"}'::jsonb) ->> 'member_number'$q$);
    IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot register members (got ' || got || ')'; END IF;
    got := pg_temp.try_as(admin_id, $q$SELECT public.register_member('{"firstNameAm":"verify_security","fatherNameAm":"registrant","sex":"female","phone":"0911000001","memberNumber":"FORGED-1"}'::jsonb) ->> 'member_number'$q$);
    test_number := nullif(substring(got FROM '([0-9]+)$'), '')::bigint;
    IF got ~ '^[A-Z0-9]+-[0-9]{4,}$' THEN passed := passed + 1; ELSE failures := failures || E'\n  admin registers with a sequential number, client-chosen numbers ignored (got ' || got || ')'; END IF;
    got := pg_temp.try_as(member_id, $q$SELECT count(*) FROM public.member_details d JOIN public.profiles p ON p.id = d.member_id WHERE p.first_name = 'verify_security'$q$);
    IF got = '0' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot read other members'' registry records (got ' || got || ')'; END IF;
    got := pg_temp.try_as(leader_id, $q$SELECT count(*) FROM public.member_details d JOIN public.profiles p ON p.id = d.member_id WHERE p.first_name = 'verify_security'$q$);
    IF got = '1' THEN passed := passed + 1; ELSE failures := failures || E'\n  leader can read the registry (got ' || got || ')'; END IF;
  END IF;

  -- ledger totals (20261030000001): only the roles that read the ledger get rows
  IF to_regclass('public.financial_summary') IS NOT NULL THEN
    -- the member's own gift: RLS lets them read that row, but the totals still show them nothing
    INSERT INTO public.financial_transactions (transaction_type, category, amount, description, member_id, recorded_by_id)
    VALUES ('income', 'verify_security', 40, 'verify_security test row', member_id, admin_id);
    got := pg_temp.try_as(NULL, 'SELECT count(*) FROM public.financial_summary');
    IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  anon cannot read ledger totals (got ' || got || ')'; END IF;
    got := pg_temp.try_as(member_id, 'SELECT count(*) FROM public.financial_summary');
    IF got = '0' THEN passed := passed + 1; ELSE failures := failures || E'\n  member gets no ledger totals, not even of their own giving (got ' || got || ')'; END IF;
    got := pg_temp.try_as(leader_id, 'SELECT count(*) FROM public.financial_summary');
    IF got = '0' THEN passed := passed + 1; ELSE failures := failures || E'\n  leader gets no ledger totals (got ' || got || ')'; END IF;
    got := pg_temp.try_as(finance_id, $q$SELECT sum(total)::text || '/' || sum(transaction_count)::text FROM public.financial_summary WHERE category = 'verify_security'$q$);
    IF got = '40.00/1' THEN passed := passed + 1; ELSE failures := failures || E'\n  finance reads ledger totals (got ' || got || ')'; END IF;
  END IF;

  -- report figures (20261030000001): staff and finance only (PAGE_ACCESS.reports)
  IF to_regprocedure('public.report_summary()') IS NOT NULL THEN
    got := pg_temp.try_as(NULL, 'SELECT count(*) FROM public.report_summary()');
    IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  anon cannot read report figures (got ' || got || ')'; END IF;
    got := pg_temp.try_as(member_id, 'SELECT count(*) FROM public.report_summary()');
    IF got = 'denied:42501' THEN passed := passed + 1; ELSE failures := failures || E'\n  member cannot read report figures (got ' || got || ')'; END IF;
    -- finance cannot read attendance rows, but gets the count
    got := pg_temp.try_as(finance_id, 'SELECT (members_total >= 5 AND attendance_total >= 0)::text FROM public.report_summary()');
    IF got = 'true' THEN passed := passed + 1; ELSE failures := failures || E'\n  finance reads report figures (got ' || got || ')'; END IF;
    got := pg_temp.try_as(leader_id, 'SELECT (members_total >= 5)::text FROM public.report_summary()');
    IF got = 'true' THEN passed := passed + 1; ELSE failures := failures || E'\n  leader reads report figures (got ' || got || ')'; END IF;
  END IF;

  -- clean up
  DELETE FROM public.financial_transactions WHERE description = 'verify_security test row';
  IF to_regclass('public.documents') IS NOT NULL THEN
    DELETE FROM public.documents WHERE name LIKE 'verify_security %';
  END IF;
  -- every id this run created (incl. the registrant), so their audit rows can be removed afterwards
  test_ids := ARRAY[member_id::text, finance_id::text, admin_id::text, signup_id::text, leader_id::text]
              || ARRAY(SELECT id::text FROM public.profiles WHERE first_name = 'verify_security' AND last_name = 'registrant');
  DELETE FROM public.profiles WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id)
     OR (first_name = 'verify_security' AND last_name = 'registrant');
  DELETE FROM auth.users WHERE id IN (member_id, finance_id, admin_id, signup_id, leader_id);
  IF to_regclass('public.audit_log') IS NOT NULL THEN
    DELETE FROM public.audit_log WHERE resource_id = ANY (test_ids);
    DELETE FROM public.audit_log WHERE user_id IN (member_id, finance_id, admin_id, signup_id, leader_id)
       OR resource_id IN (member_id::text, finance_id::text, admin_id::text, signup_id::text, leader_id::text)
       OR details::text LIKE '%verify_security%';
  END IF;

  -- give back the member number the test registration used, unless a real registration came after it.
  -- Nested IF: PL/pgSQL plans a whole condition at once, so the sequence must not appear in it
  -- on databases that don't have the member registry yet (Phase 0, before npm run db:up).
  IF test_number IS NOT NULL THEN
    IF (SELECT last_value FROM public.member_number_seq) = test_number THEN
      PERFORM setval('public.member_number_seq', seq_last, seq_called);
    END IF;
  END IF;

  IF failures <> '' THEN
    RAISE EXCEPTION 'verify_security: % passed, FAILED:%', passed, failures;
  END IF;
  RAISE NOTICE 'verify_security: all % checks passed', passed;
END
$$;
