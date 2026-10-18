-- =============================================================================
-- 02_rls_rewrite.sql                              Remediation Guide: Phase 1, Step 1.3
-- -----------------------------------------------------------------------------
-- Replaces EVERY row-level-security policy in the public schema with a policy
-- set derived from the intended role matrix (docs/ROLES_AND_ACCESS.md).
-- Fixes F-05 (all members can read pastoral/charity data), F-06 (any leader can
-- write every ministry table, "true" policies on 30+ tables), F-07 (document
-- access_level never enforced, no storage policies).
--
-- Requires 01_emergency_lockdown.sql (profiles.role, has_role()).
-- Idempotent and state-agnostic: tables that do not exist are skipped, and any
-- public table not listed below ends up with RLS ON and NO policies (= deny all),
-- which is reported at the end so you can classify it deliberately.
--
-- Role groups
--   staff        = admin, elder, ministry_leader
--   pastoral     = admin, elder                (confidential care data)
--   finance      = admin, elder (read), finance
-- Next refinement (Phase 2, Step 2.6): scope ministry_leader to their own ministry.
-- =============================================================================

BEGIN;

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

COMMIT;

-- 7. Report: tables that are now deny-all because no group above covers them.
SELECT c.relname AS table_without_policies
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname)
 ORDER BY 1;
