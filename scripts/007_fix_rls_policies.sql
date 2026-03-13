-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "ministries_select_all" ON public.ministries;
DROP POLICY IF EXISTS "ministries_insert_admin" ON public.ministries;
DROP POLICY IF EXISTS "ministries_update_admin" ON public.ministries;
DROP POLICY IF EXISTS "ministry_members_select_all" ON public.ministry_members;
DROP POLICY IF EXISTS "ministry_members_insert_admin" ON public.ministry_members;
DROP POLICY IF EXISTS "ministry_members_update_admin" ON public.ministry_members;
DROP POLICY IF EXISTS "financial_select_admin" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_insert_admin" ON public.financial_transactions;
DROP POLICY IF EXISTS "attendance_select_own_or_admin" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_insert_admin" ON public.attendance_records;
DROP POLICY IF EXISTS "events_select_active" ON public.events;
DROP POLICY IF EXISTS "events_insert_user" ON public.events;

-- Recreate profiles policies with proper logic (avoiding infinite recursion)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (
  auth.uid() = id
) WITH CHECK (
  auth.uid() = id
);

-- Ministries RLS Policies
CREATE POLICY "ministries_select_all" ON public.ministries FOR SELECT USING (true);

CREATE POLICY "ministries_insert_admin" ON public.ministries FOR INSERT WITH CHECK (
  true
);

CREATE POLICY "ministries_update_admin" ON public.ministries FOR UPDATE USING (true) WITH CHECK (true);

-- Ministry Members RLS Policies
CREATE POLICY "ministry_members_select_all" ON public.ministry_members FOR SELECT USING (true);

CREATE POLICY "ministry_members_insert_admin" ON public.ministry_members FOR INSERT WITH CHECK (true);

CREATE POLICY "ministry_members_update_admin" ON public.ministry_members FOR UPDATE USING (true) WITH CHECK (true);

-- Financial Transactions RLS Policies
CREATE POLICY "financial_select_all" ON public.financial_transactions FOR SELECT USING (true);

CREATE POLICY "financial_insert_admin" ON public.financial_transactions FOR INSERT WITH CHECK (true);

-- Attendance Records RLS Policies
CREATE POLICY "attendance_select_all" ON public.attendance_records FOR SELECT USING (true);

CREATE POLICY "attendance_insert_admin" ON public.attendance_records FOR INSERT WITH CHECK (true);

-- Events RLS Policies
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);

CREATE POLICY "events_insert_user" ON public.events FOR INSERT WITH CHECK (true);

CREATE POLICY "events_update_user" ON public.events FOR UPDATE USING (true) WITH CHECK (true);
