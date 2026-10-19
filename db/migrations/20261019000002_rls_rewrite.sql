-- migrate:up
-- Row-level security rewritten from the role matrix (remediation step 1.3, findings F-05..F-07), plus the private
-- documents bucket and its storage policies.

-- 1. Drop every existing policy in public (the repo and the live DB have drifted;
--    starting from zero is the only way to know what is in force).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END
$$;

-- 2. Turn RLS on for every table in public. No policy = no access.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

-- 3. Grouped policies.
DO $$
DECLARE
  staff     constant text := '(SELECT public.has_role(''admin'', ''elder'', ''ministry_leader''))';
  pastoral  constant text := '(SELECT public.has_role(''admin'', ''elder''))';
  any_user  constant text := '(SELECT public.current_app_role()) IS NOT NULL';

  -- Readable by every active signed-in user; written by staff.
  member_readable text[] := ARRAY[
    'events', 'ministries', 'announcements', 'worship_events', 'spiritual_services',
    'women_meetings', 'women_activities', 'women_trainings', 'mission_trips',
    'marriage_seminars', 'prayer_groups', 'teaching_materials', 'youth_programs',
    'education_programs', 'health_programs', 'community_projects', 'facilities',
    'spiritual_classes', 'children_classes', 'children_curriculum', 'choir_schedule',
    'choir_songs', 'worship_teams', 'committees', 'translations'];

  -- Operational data about people (attendance, rosters, children): staff only.
  staff_only text[] := ARRAY[
    'ministry_members', 'attendance_records', 'children_attendance', 'children_class_teachers',
    'spiritual_candidates', 'spiritual_class_attendance', 'baptisms', 'youth_mentorship',
    'mission_trip_participants', 'mission_reports', 'worship_team_members', 'worship_equipment',
    'worship_rehearsals', 'choir_members', 'admin_tasks', 'message_templates',
    'committee_meetings', 'committee_members', 'facility_bookings', 'facility_maintenance',
    'music_team_members', 'education_enrollments', 'community_volunteers', 'media_content',
    'custom_reports', 'monthly_statistics'];

  -- Pastoral care, aid and money given to people: admin + elder only.
  confidential text[] := ARRAY[
    'counseling_services', 'deacon_care_visits', 'deacon_support_cases', 'charity_aid_requests',
    'charity_distributions', 'workers_aid_beneficiaries', 'workers_aid_disbursements',
    'prayer_requests', 'spiritual_follow_ups'];

  t text;
BEGIN
  FOREACH t IN ARRAY member_readable LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)', t || '_select', t, any_user);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', t || '_insert', t, staff);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', t || '_update', t, staff, staff);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', t || '_delete', t, staff);
  END LOOP;

  FOREACH t IN ARRAY staff_only LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', t || '_staff_all', t, staff, staff);
  END LOOP;

  FOREACH t IN ARRAY confidential LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', t || '_pastoral_all', t, pastoral, pastoral);
  END LOOP;
END
$$;

-- 4. Per-person exceptions on confidential tables: the assigned carer sees their own cases.
DO $$
BEGIN
  IF to_regclass('public.counseling_services') IS NOT NULL THEN
    CREATE POLICY counseling_services_counselor ON public.counseling_services FOR SELECT TO authenticated
      USING (counselor_id = (SELECT auth.uid()));
    CREATE POLICY counseling_services_counselor_update ON public.counseling_services FOR UPDATE TO authenticated
      USING (counselor_id = (SELECT auth.uid())) WITH CHECK (counselor_id = (SELECT auth.uid()));
  END IF;
  IF to_regclass('public.deacon_care_visits') IS NOT NULL THEN
    CREATE POLICY deacon_care_visits_visitor ON public.deacon_care_visits FOR SELECT TO authenticated
      USING (visitor_id = (SELECT auth.uid()));
  END IF;
  IF to_regclass('public.deacon_support_cases') IS NOT NULL THEN
    CREATE POLICY deacon_support_cases_assigned ON public.deacon_support_cases FOR SELECT TO authenticated
      USING (assigned_deacon_id = (SELECT auth.uid()));
  END IF;
  IF to_regclass('public.prayer_requests') IS NOT NULL THEN
    CREATE POLICY prayer_requests_own ON public.prayer_requests FOR SELECT TO authenticated
      USING (requested_by_id = (SELECT auth.uid()));
    CREATE POLICY prayer_requests_create_own ON public.prayer_requests FOR INSERT TO authenticated
      WITH CHECK (requested_by_id = (SELECT auth.uid()));
  END IF;
END
$$;

-- 5. Tables with their own rules.

-- profiles (same as 01, recreated because step 1 dropped everything)
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid())
         OR (SELECT public.has_role('admin', 'elder', 'ministry_leader', 'finance')));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.has_role('admin')))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.has_role('admin')));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin')));

-- financial_transactions
CREATE POLICY financial_select ON public.financial_transactions FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'elder', 'finance')) OR member_id = (SELECT auth.uid()));
CREATE POLICY financial_insert ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin', 'finance')));
CREATE POLICY financial_update ON public.financial_transactions FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin', 'finance'))) WITH CHECK ((SELECT public.has_role('admin', 'finance')));
CREATE POLICY financial_delete ON public.financial_transactions FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin')));

DO $$
BEGIN
  -- audit_log: read by admin/elder; written only by the trigger in 03 (no INSERT policy).
  IF to_regclass('public.audit_log') IS NOT NULL THEN
    CREATE POLICY audit_log_select ON public.audit_log FOR SELECT TO authenticated
      USING ((SELECT public.has_role('admin', 'elder')));
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_log FROM anon, authenticated;
  END IF;

  -- documents: access_level values used by the UI are 'Public', 'Staff Only', 'Leadership Only'.
  --   admin/elder: everything · ministry_leader: Public + Staff Only · members: Public
  IF to_regclass('public.documents') IS NOT NULL THEN
    CREATE POLICY documents_select ON public.documents FOR SELECT TO authenticated
      USING ((SELECT public.has_role('admin', 'elder'))
             OR (access_level IN ('Public', 'Staff Only') AND (SELECT public.has_role('ministry_leader')))
             OR (access_level = 'Public' AND (SELECT public.current_app_role()) IS NOT NULL));
    CREATE POLICY documents_insert ON public.documents FOR INSERT TO authenticated
      WITH CHECK ((SELECT public.has_role('admin', 'elder'))
                  OR (access_level IN ('Public', 'Staff Only') AND (SELECT public.has_role('ministry_leader'))));
    CREATE POLICY documents_update ON public.documents FOR UPDATE TO authenticated
      USING ((SELECT public.has_role('admin', 'elder'))
             OR (access_level IN ('Public', 'Staff Only') AND (SELECT public.has_role('ministry_leader'))))
      WITH CHECK ((SELECT public.has_role('admin', 'elder'))
                  OR (access_level IN ('Public', 'Staff Only') AND (SELECT public.has_role('ministry_leader'))));
    CREATE POLICY documents_delete ON public.documents FOR DELETE TO authenticated
      USING ((SELECT public.has_role('admin', 'elder')));
  END IF;

  -- user_preferences: each user their own row.
  IF to_regclass('public.user_preferences') IS NOT NULL THEN
    CREATE POLICY user_preferences_own ON public.user_preferences FOR ALL TO authenticated
      USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  -- analytics_events: users record their own events; admins read.
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    CREATE POLICY analytics_events_insert_own ON public.analytics_events FOR INSERT TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()));
    CREATE POLICY analytics_events_select_admin ON public.analytics_events FOR SELECT TO authenticated
      USING ((SELECT public.has_role('admin')));
  END IF;
END
$$;

-- 6. Storage: the private "documents" bucket follows the documents table rules.
DO $$
BEGIN
  -- needs both: the bucket policies are defined in terms of the documents table (012)
  IF to_regclass('storage.objects') IS NOT NULL AND to_regclass('public.documents') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
      ON CONFLICT (id) DO NOTHING;
    DROP POLICY IF EXISTS documents_bucket_staff_read ON storage.objects;
    DROP POLICY IF EXISTS documents_bucket_staff_write ON storage.objects;
    DROP POLICY IF EXISTS documents_bucket_read ON storage.objects;
    DROP POLICY IF EXISTS documents_bucket_upload ON storage.objects;
    DROP POLICY IF EXISTS documents_bucket_delete ON storage.objects;
    -- A file is readable exactly when its documents row is visible to the caller
    -- (the sub-select runs under the documents policies above).
    CREATE POLICY documents_bucket_read ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'documents'
             AND EXISTS (SELECT 1 FROM public.documents d WHERE d.file_path = storage.objects.name));
    CREATE POLICY documents_bucket_upload ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'documents' AND (SELECT public.has_role('admin', 'elder', 'ministry_leader')));
    CREATE POLICY documents_bucket_delete ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'documents' AND (SELECT public.has_role('admin', 'elder')));
  END IF;
END
$$;

-- migrate:down
DO $$
BEGIN
  IF coalesce(current_setting('lkhc.allow_insecure_downgrade', true), '') <> 'on' THEN
    RAISE EXCEPTION 'Refusing to roll back a security migration: it would re-open %. If you really mean it (dev/test only): ALTER DATABASE <db> SET lkhc.allow_insecure_downgrade = on; reconnect, run again, then RESET it.', 'broad read/write access granted by the old policies';
  END IF;
END
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename IS NOT NULL
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP POLICY IF EXISTS documents_bucket_read ON storage.objects;
    DROP POLICY IF EXISTS documents_bucket_upload ON storage.objects;
    DROP POLICY IF EXISTS documents_bucket_delete ON storage.objects;
  END IF;
  IF to_regclass('public.audit_log') IS NOT NULL THEN
    GRANT INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_log TO authenticated;
  END IF;
END
$$;

-- every public policy as it was before this migration
CREATE POLICY allow_all_admin_tasks ON public.admin_tasks AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_admin_tasks ON public.admin_tasks AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY analytics_insert_system ON public.analytics_events AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY analytics_select_admin ON public.analytics_events AS PERMISSIVE FOR SELECT TO public USING ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY allow_announcements_delete ON public.announcements AS PERMISSIVE FOR DELETE TO public USING (true);
CREATE POLICY allow_announcements_insert ON public.announcements AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_announcements_select ON public.announcements AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_announcements_update ON public.announcements AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY allow_attendance_insert ON public.attendance_records AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_attendance_select ON public.attendance_records AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_attendance_update ON public.attendance_records AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY allow_audit_insert_authenticated ON public.audit_log AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY allow_audit_select_admin ON public.audit_log AS PERMISSIVE FOR SELECT TO public USING ((COALESCE(( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())), false) = true));
CREATE POLICY allow_all_baptisms ON public.baptisms AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_baptisms ON public.baptisms AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_charity_aid_requests ON public.charity_aid_requests AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_charity_aid_requests ON public.charity_aid_requests AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_charity_distributions ON public.charity_distributions AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_charity_distributions ON public.charity_distributions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_children_attendance ON public.children_attendance AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_children_attendance ON public.children_attendance AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_children_class_teachers ON public.children_class_teachers AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_children_class_teachers ON public.children_class_teachers AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_children_classes ON public.children_classes AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_children_classes ON public.children_classes AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_children_curriculum ON public.children_curriculum AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_children_curriculum ON public.children_curriculum AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_choir_members ON public.choir_members AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_choir_members ON public.choir_members AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_choir_schedule ON public.choir_schedule AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_choir_schedule ON public.choir_schedule AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_choir_songs ON public.choir_songs AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_choir_songs ON public.choir_songs AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY committee_meetings_select_all ON public.committee_meetings AS PERMISSIVE FOR SELECT TO public USING (((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true) OR (( SELECT count(*) AS count
   FROM committee_members
  WHERE ((committee_members.committee_id = committee_meetings.committee_id) AND (committee_members.member_id = auth.uid()))) > 0)));
CREATE POLICY committee_members_select_all ON public.committee_members AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (member_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY committees_select_all ON public.committees AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY community_projects_insert_admin ON public.community_projects AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY community_projects_select_all ON public.community_projects AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY community_volunteers_insert_admin ON public.community_volunteers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY community_volunteers_select_own ON public.community_volunteers AS PERMISSIVE FOR SELECT TO public USING (((member_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY counseling_insert_counselor ON public.counseling_services AS PERMISSIVE FOR INSERT TO public WITH CHECK (((counselor_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY counseling_select_own_or_admin ON public.counseling_services AS PERMISSIVE FOR SELECT TO public USING (((member_id = auth.uid()) OR (counselor_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY custom_reports_insert_admin ON public.custom_reports AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY custom_reports_select_admin ON public.custom_reports AS PERMISSIVE FOR SELECT TO public USING (((created_by_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY allow_all_deacon_care_visits ON public.deacon_care_visits AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_deacon_care_visits ON public.deacon_care_visits AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_deacon_support_cases ON public.deacon_support_cases AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_deacon_support_cases ON public.deacon_support_cases AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_documents_delete ON public.documents AS PERMISSIVE FOR DELETE TO public USING (true);
CREATE POLICY allow_documents_insert ON public.documents AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_documents_select ON public.documents AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_documents_update ON public.documents AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY education_enrollments_insert_admin ON public.education_enrollments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY education_enrollments_select_own ON public.education_enrollments AS PERMISSIVE FOR SELECT TO public USING (((member_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY education_programs_select_all ON public.education_programs AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY allow_events_insert ON public.events AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_events_select ON public.events AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY facilities_select_all ON public.facilities AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY facility_bookings_insert_user ON public.facility_bookings AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY facility_bookings_select_own ON public.facility_bookings AS PERMISSIVE FOR SELECT TO public USING (((booked_by_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY facility_maintenance_insert_admin ON public.facility_maintenance AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY facility_maintenance_select_admin ON public.facility_maintenance AS PERMISSIVE FOR SELECT TO public USING ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY financial_delete ON public.financial_transactions AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT has_role(VARIADIC ARRAY['admin'::text]) AS has_role));
CREATE POLICY financial_insert ON public.financial_transactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (( SELECT has_role(VARIADIC ARRAY['admin'::text, 'finance'::text]) AS has_role));
CREATE POLICY financial_select ON public.financial_transactions AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT has_role(VARIADIC ARRAY['admin'::text, 'elder'::text, 'finance'::text]) AS has_role) OR (member_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY financial_update ON public.financial_transactions AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT has_role(VARIADIC ARRAY['admin'::text, 'finance'::text]) AS has_role)) WITH CHECK (( SELECT has_role(VARIADIC ARRAY['admin'::text, 'finance'::text]) AS has_role));
CREATE POLICY health_programs_insert_admin ON public.health_programs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY health_programs_select_all ON public.health_programs AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY allow_all_marriage_seminars ON public.marriage_seminars AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_marriage_seminars ON public.marriage_seminars AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY media_content_insert_admin ON public.media_content AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY media_content_select_published ON public.media_content AS PERMISSIVE FOR SELECT TO public USING (((is_published = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY allow_templates_delete ON public.message_templates AS PERMISSIVE FOR DELETE TO public USING (true);
CREATE POLICY allow_templates_insert ON public.message_templates AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_templates_select ON public.message_templates AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_templates_update ON public.message_templates AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY allow_ministries_insert ON public.ministries AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_ministries_select ON public.ministries AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_ministry_members_insert ON public.ministry_members AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY allow_ministry_members_select ON public.ministry_members AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_all_mission_reports ON public.mission_reports AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_mission_reports ON public.mission_reports AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_mission_trip_participants ON public.mission_trip_participants AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_mission_trip_participants ON public.mission_trip_participants AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_mission_trips ON public.mission_trips AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_mission_trips ON public.mission_trips AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY monthly_statistics_insert_admin ON public.monthly_statistics AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY monthly_statistics_select_admin ON public.monthly_statistics AS PERMISSIVE FOR SELECT TO public USING ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY music_team_insert_admin ON public.music_team_members AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY music_team_select_all ON public.music_team_members AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (member_id = auth.uid()) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY allow_all_prayer_groups ON public.prayer_groups AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_prayer_groups ON public.prayer_groups AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_prayer_requests ON public.prayer_requests AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_prayer_requests ON public.prayer_requests AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (( SELECT has_role(VARIADIC ARRAY['admin'::text]) AS has_role));
CREATE POLICY profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT has_role(VARIADIC ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text]) AS has_role)));
CREATE POLICY profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT has_role(VARIADIC ARRAY['admin'::text]) AS has_role))) WITH CHECK (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT has_role(VARIADIC ARRAY['admin'::text]) AS has_role)));
CREATE POLICY allow_all_spiritual_candidates ON public.spiritual_candidates AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_spiritual_candidates ON public.spiritual_candidates AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_spiritual_class_attendance ON public.spiritual_class_attendance AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_spiritual_class_attendance ON public.spiritual_class_attendance AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_spiritual_classes ON public.spiritual_classes AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_spiritual_classes ON public.spiritual_classes AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_spiritual_follow_ups ON public.spiritual_follow_ups AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_spiritual_follow_ups ON public.spiritual_follow_ups AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY spiritual_services_insert_admin ON public.spiritual_services AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY spiritual_services_select_all ON public.spiritual_services AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY spiritual_services_update_admin ON public.spiritual_services AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY allow_all_teaching_materials ON public.teaching_materials AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_teaching_materials ON public.teaching_materials AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY translations_insert_admin ON public.translations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY translations_select_all ON public.translations AS PERMISSIVE FOR SELECT TO public USING (((is_approved = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
CREATE POLICY translations_update_admin ON public.translations AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY user_preferences_insert_own ON public.user_preferences AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY user_preferences_select_own ON public.user_preferences AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY user_preferences_update_own ON public.user_preferences AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY allow_all_women_activities ON public.women_activities AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_women_activities ON public.women_activities AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_women_meetings ON public.women_meetings AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_women_meetings ON public.women_meetings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_women_trainings ON public.women_trainings AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_women_trainings ON public.women_trainings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_workers_aid_beneficiaries ON public.workers_aid_beneficiaries AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_workers_aid_beneficiaries ON public.workers_aid_beneficiaries AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_workers_aid_disbursements ON public.workers_aid_disbursements AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_workers_aid_disbursements ON public.workers_aid_disbursements AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_worship_equipment ON public.worship_equipment AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_worship_equipment ON public.worship_equipment AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY worship_events_insert_admin ON public.worship_events AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY worship_events_select_all ON public.worship_events AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY allow_all_worship_rehearsals ON public.worship_rehearsals AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_worship_rehearsals ON public.worship_rehearsals AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_worship_team_members ON public.worship_team_members AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_worship_team_members ON public.worship_team_members AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_worship_teams ON public.worship_teams AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_worship_teams ON public.worship_teams AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY allow_all_youth_mentorship ON public.youth_mentorship AS PERMISSIVE FOR ALL TO authenticated USING (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid()))) WITH CHECK (( SELECT (COALESCE(profiles.is_admin, false) OR (profiles.role = ANY (ARRAY['admin'::text, 'elder'::text, 'ministry_leader'::text, 'finance'::text])))
   FROM profiles
  WHERE (profiles.id = auth.uid())));
CREATE POLICY allow_select_youth_mentorship ON public.youth_mentorship AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY youth_programs_insert_admin ON public.youth_programs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true));
CREATE POLICY youth_programs_select_all ON public.youth_programs AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR (( SELECT profiles.is_admin
   FROM profiles
  WHERE (profiles.id = auth.uid())) = true)));
