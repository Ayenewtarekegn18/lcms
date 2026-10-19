-- migrate:up
-- Security lockdown (remediation step 0.3, findings F-01..F-04): no anonymous table access, one role model with has_role(),
-- a sign-up trigger that ignores client metadata, a privilege guard on profiles, and locked-down profiles/financial policies.
-- Identical to db/scripts/emergency_lockdown.sql, which can be pasted into the SQL editor before dbmate is adopted.

-- 1. Anonymous visitors get no table access at all.
--    The app never reads tables before login (sign-in/sign-up use the Auth API).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- 2. One role model: profiles.role is the source of truth.
--    is_admin is kept only for old code and is derived from role by the trigger below.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;
UPDATE public.profiles
   SET role = 'member'
 WHERE role IS NULL OR role NOT IN ('admin', 'elder', 'ministry_leader', 'finance', 'member');
UPDATE public.profiles SET role = 'admin' WHERE is_admin IS TRUE AND role = 'member';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'elder', 'ministry_leader', 'finance', 'member'));

-- 3. Role helpers. SECURITY DEFINER so policies on other tables (and on profiles
--    itself) can read the caller's role without RLS recursion (error 42P17).
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT p.role
    FROM public.profiles p
   WHERE p.id = (SELECT auth.uid())
     AND p.is_active IS NOT FALSE
$$;

CREATE OR REPLACE FUNCTION public.has_role(VARIADIC allowed text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(public.current_app_role() = ANY (allowed), false)
$$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated, service_role;

-- 4. Sign-up trigger: never take privileges from client-supplied metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, is_admin, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Member'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    FALSE,
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Privilege guard on profiles. Runs as the caller (not SECURITY DEFINER) so
--    current_user tells us whether the change comes from an app user
--    ('authenticated'/'anon') or from the SQL editor / service role.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  -- Keep the legacy is_admin flag consistent with role (role wins).
  IF TG_OP = 'UPDATE'
     AND NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND NEW.role IS NOT DISTINCT FROM OLD.role THEN
    NEW.role := CASE WHEN NEW.is_admin THEN 'admin'
                     WHEN OLD.role = 'admin' THEN 'member'
                     ELSE NEW.role END;
  ELSIF TG_OP = 'INSERT' AND NEW.is_admin IS TRUE AND COALESCE(NEW.role, 'member') = 'member' THEN
    NEW.role := 'admin';
  END IF;
  NEW.role := COALESCE(NEW.role, 'member');
  NEW.is_admin := (NEW.role = 'admin');

  -- Only admins (or the SQL editor / service role) may grant privileges,
  -- change account status, or move a profile to another id.
  IF current_user IN ('anon', 'authenticated') AND NOT public.has_role('admin') THEN
    IF TG_OP = 'INSERT' AND NEW.role <> 'member' THEN
      RAISE EXCEPTION 'only an admin can create a privileged profile' USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' AND (NEW.role IS DISTINCT FROM OLD.role
                                OR NEW.is_active IS DISTINCT FROM OLD.is_active
                                OR NEW.id IS DISTINCT FROM OLD.id) THEN
      RAISE EXCEPTION 'only an admin can change role, status or id' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS guard_profile_privileges ON public.profiles;
CREATE TRIGGER guard_profile_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

-- 6. Replace every policy on the two most sensitive tables.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
            WHERE schemaname = 'public' AND tablename IN ('profiles', 'financial_transactions')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Members see their own profile; staff see the directory. No one deletes
-- profiles through the API (deactivate with is_active = false instead).
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid())
         OR (SELECT public.has_role('admin', 'elder', 'ministry_leader', 'finance')));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.has_role('admin')))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.has_role('admin')));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin')));

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Finance data: admin/elder/finance read everything; a member sees only their own giving.
CREATE POLICY financial_select ON public.financial_transactions FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'elder', 'finance'))
         OR member_id = (SELECT auth.uid()));
CREATE POLICY financial_insert ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'finance')));
CREATE POLICY financial_update ON public.financial_transactions FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'finance')))
  WITH CHECK ((SELECT public.has_role('admin', 'finance')));
CREATE POLICY financial_delete ON public.financial_transactions FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin')));

-- migrate:down
DO $$
BEGIN
  IF coalesce(current_setting('lkhc.allow_insecure_downgrade', true), '') <> 'on' THEN
    RAISE EXCEPTION 'Refusing to roll back a security migration: it would re-open %. If you really mean it (dev/test only): ALTER DATABASE <db> SET lkhc.allow_insecure_downgrade = on; reconnect, run again, then RESET it.', 'anonymous data access and self-promotion to admin';
  END IF;
END
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename IN ('profiles', 'financial_transactions')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- policies as they were before this migration
CREATE POLICY allow_financial_insert ON public.financial_transactions AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_financial_select ON public.financial_transactions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY financial_insert_admin ON public.financial_transactions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((COALESCE(( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())), false) = true));
CREATE POLICY allow_profiles_delete ON public.profiles AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = id));
CREATE POLICY allow_profiles_insert ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY allow_profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY profiles_insert_admin ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK ((COALESCE(( SELECT profiles_1.is_admin
   FROM profiles profiles_1
  WHERE (profiles_1.id = auth.uid())), false) = true));

DROP TRIGGER IF EXISTS guard_profile_privileges ON public.profiles;
DROP FUNCTION IF EXISTS public.guard_profile_privileges();

-- previous sign-up function (legacy 002): copies is_admin from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    is_admin
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', 'Member'),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    COALESCE((new.raw_user_meta_data ->> 'is_admin')::boolean, FALSE)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP FUNCTION IF EXISTS public.has_role(text[]);
DROP FUNCTION IF EXISTS public.current_app_role();
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
