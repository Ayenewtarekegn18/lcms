-- migrate:up
-- Admin-only profile/financial inserts and admin-only audit reads (legacy scripts 016 and 016a, which were identical).

-- ---- from scripts/016_fix_rls_profiles_audit.sql ----
-- Fix RLS so admin can register members. Safe to run even if audit_log or other tables don't exist yet.

-- 1. Allow admin to insert into profiles (for member registration)
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT WITH CHECK (
  COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE) = TRUE
);

-- 2. Audit log: only if the table exists (e.g. after running 014_roles_and_audit.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    DROP POLICY IF EXISTS "allow_audit_select_admin" ON public.audit_log;
    CREATE POLICY "allow_audit_select_admin" ON public.audit_log FOR SELECT USING (
      COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE) = TRUE
    );
  END IF;
END $$;

-- 3. Financial: only if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_transactions') THEN
    DROP POLICY IF EXISTS "financial_insert_admin" ON public.financial_transactions;
    CREATE POLICY "financial_insert_admin" ON public.financial_transactions FOR INSERT WITH CHECK (
      COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE) = TRUE
    );
    ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS category TEXT;
  END IF;
END $$;

-- migrate:down
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename IN ('profiles', 'audit_log', 'financial_transactions')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- policies as they were before this migration
CREATE POLICY allow_audit_insert_authenticated ON public.audit_log AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY allow_audit_select_admin ON public.audit_log AS PERMISSIVE FOR SELECT TO public USING (((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'elder'::text)));
CREATE POLICY allow_financial_insert ON public.financial_transactions AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_financial_select ON public.financial_transactions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_profiles_delete ON public.profiles AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = id));
CREATE POLICY allow_profiles_insert ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY allow_profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));

ALTER TABLE public.financial_transactions DROP COLUMN IF EXISTS category;
