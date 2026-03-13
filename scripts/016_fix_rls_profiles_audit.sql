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
