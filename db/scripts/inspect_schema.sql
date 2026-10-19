-- =============================================================================
-- inspect_schema.sql                              Remediation Guide: Phase 0, Step 0.2
-- -----------------------------------------------------------------------------
-- READ-ONLY. Shows what is really deployed, because scripts/*.sql and the live
-- project have drifted (on 2026-10-17 the live REST API was missing every table
-- from 011, 012, 014 and 015). Run each query in the Supabase SQL editor and
-- keep the output with your notes before running anything in docs/remediation.
-- =============================================================================

-- 1. Which migration "marker" objects exist?
SELECT m.migration, to_regclass(m.marker) IS NOT NULL AS applied
  FROM (VALUES
    ('001 core schema',            'public.profiles'),
    ('003 phase-2 ministries',     'public.counseling_services'),
    ('004 analytics/localization', 'public.translations'),
    ('011 announcements',          'public.announcements'),
    ('012 documents',              'public.documents'),
    ('014 roles + audit',          'public.audit_log'),
    ('015 PRD ministry tables',    'public.spiritual_candidates')
  ) AS m(migration, marker);

SELECT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') AS has_role_column,
       EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_date') AS has_013_event_date,
       EXISTS (SELECT 1 FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_id_fkey') AS profiles_fk_to_auth_users;

-- 2. Every table, whether RLS is on, and how many policies it has.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies,
       has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_select
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
 ORDER BY anon_can_select DESC, c.relname;

-- 3. Every policy in force (look for USING (true) and policies without "TO authenticated").
SELECT tablename, policyname, cmd, roles, qual AS using_expr, with_check
  FROM pg_policies WHERE schemaname = 'public'
 ORDER BY tablename, policyname;

-- 4. Who has elevated access? Investigate any account you do not recognise:
--    the sign-up trigger lets anyone create is_admin = true accounts (F-02).
SELECT p.id, p.email, p.is_admin, u.created_at, u.last_sign_in_at,
       u.raw_user_meta_data ->> 'is_admin' AS requested_admin_at_signup
  FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id
 WHERE p.is_admin IS TRUE OR (u.raw_user_meta_data ->> 'is_admin') = 'true'
 ORDER BY u.created_at;

-- 5. Demo accounts whose passwords were published in the public GitHub repo.
SELECT id, email, created_at, last_sign_in_at
  FROM auth.users WHERE email LIKE '%@church.local' ORDER BY email;
