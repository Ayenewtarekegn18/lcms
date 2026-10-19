-- Drop problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Create simple policies for profiles
CREATE POLICY "allow_profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "allow_profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "allow_profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "allow_profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Drop and recreate attendance policies
DROP POLICY IF EXISTS "attendance_select_all" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_insert_own" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_update_own" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_select_own_or_admin" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_insert_admin" ON public.attendance_records;

CREATE POLICY "allow_attendance_select" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "allow_attendance_insert" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_attendance_update" ON public.attendance_records FOR UPDATE USING (true);

-- Drop and recreate financial policies
DROP POLICY IF EXISTS "financial_select_admin" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_insert_admin" ON public.financial_transactions;

CREATE POLICY "allow_financial_select" ON public.financial_transactions FOR SELECT USING (true);
CREATE POLICY "allow_financial_insert" ON public.financial_transactions FOR INSERT WITH CHECK (true);

-- Drop and recreate event policies
DROP POLICY IF EXISTS "events_select_all" ON public.events;
DROP POLICY IF EXISTS "events_insert_admin" ON public.events;
DROP POLICY IF EXISTS "events_select_active" ON public.events;
DROP POLICY IF EXISTS "events_insert_user" ON public.events;

CREATE POLICY "allow_events_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "allow_events_insert" ON public.events FOR INSERT WITH CHECK (true);

-- Drop and recreate ministry policies
DROP POLICY IF EXISTS "ministries_select_all" ON public.ministries;
DROP POLICY IF EXISTS "ministries_insert_admin" ON public.ministries;
DROP POLICY IF EXISTS "ministries_update_admin" ON public.ministries;

CREATE POLICY "allow_ministries_select" ON public.ministries FOR SELECT USING (true);
CREATE POLICY "allow_ministries_insert" ON public.ministries FOR INSERT WITH CHECK (true);

-- Drop and recreate ministry_members policies
DROP POLICY IF EXISTS "ministry_members_select_all" ON public.ministry_members;
DROP POLICY IF EXISTS "ministry_members_insert_admin" ON public.ministry_members;
DROP POLICY IF EXISTS "ministry_members_update_admin" ON public.ministry_members;

CREATE POLICY "allow_ministry_members_select" ON public.ministry_members FOR SELECT USING (true);
CREATE POLICY "allow_ministry_members_insert" ON public.ministry_members FOR INSERT WITH CHECK (true);
