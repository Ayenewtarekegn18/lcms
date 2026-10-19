-- migrate:up
-- The 34 PRD ministry tables (legacy script 015, with the parenthesis fix).

-- ---- from scripts/015_ministry_modules_prd.sql ----
-- Module 10: All 14 ministry modules – PRD-aligned tables
-- Run after 001, 002, 003, 014. Uses profiles(id), ministries(id).

-- 1. Spiritual Service: candidates, classes, baptisms, follow-up
CREATE TABLE IF NOT EXISTS public.spiritual_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'salvation_candidate', -- salvation_candidate | baptism_ready | baptized
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  progress_notes TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  baptism_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.spiritual_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  class_date DATE NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location TEXT,
  max_attendees INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.spiritual_class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.spiritual_classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT true,
  UNIQUE(class_id, member_id)
);
CREATE TABLE IF NOT EXISTS public.baptisms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baptism_date DATE NOT NULL,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  officiating_elder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.spiritual_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  follow_up_type TEXT NOT NULL, -- post_salvation | post_baptism
  last_contact_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'ongoing', -- ongoing | completed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teaching & Seminar: courses (use education_programs), materials
CREATE TABLE IF NOT EXISTS public.teaching_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.education_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT, -- document | video | link
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Women's: meetings, activities, trainings (registry = ministry_members)
CREATE TABLE IF NOT EXISTS public.women_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  location TEXT,
  attendees_count INT DEFAULT 0,
  minutes_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.women_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  activity_date DATE,
  status TEXT DEFAULT 'proposed', -- proposed | planned | completed
  volunteers_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.women_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  training_date DATE,
  instructor_name TEXT,
  description TEXT,
  registered_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Youth: events (youth_programs), mentorship
CREATE TABLE IF NOT EXISTS public.youth_mentorship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mentee_id)
);

-- 5. Children: classes, teachers, attendance, curriculum
CREATE TABLE IF NOT EXISTS public.children_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age_group TEXT,
  schedule_text TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.children_class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.children_classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  UNIQUE(class_id, member_id)
);
CREATE TABLE IF NOT EXISTS public.children_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.children_classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  UNIQUE(class_id, member_id, attendance_date)
);
CREATE TABLE IF NOT EXISTS public.children_curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.children_classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Mission: trips, participants, reports
CREATE TABLE IF NOT EXISTS public.mission_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  trip_date DATE,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'planned', -- planned | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mission_trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.mission_trips(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  UNIQUE(trip_id, member_id)
);
CREATE TABLE IF NOT EXISTS public.mission_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.mission_trips(id) ON DELETE CASCADE,
  report_text TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Marriage & Family: premarital, counseling (counseling_services), seminars
CREATE TABLE IF NOT EXISTS public.marriage_seminars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  seminar_date DATE,
  location TEXT,
  facilitator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Prayer Groups: groups, schedules, requests
CREATE TABLE IF NOT EXISTS public.prayer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  meeting_schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.prayer_groups(id) ON DELETE SET NULL,
  requested_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_text TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active | answered | closed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Administration: meetings (committee_meetings or dedicated), tasks
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending', -- pending | in_progress | completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Deacons: care visits, support cases
CREATE TABLE IF NOT EXISTS public.deacon_care_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  visit_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.deacon_support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_type TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open | closed
  assigned_deacon_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Charity: aid requests, distribution, audit
CREATE TABLE IF NOT EXISTS public.charity_aid_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_date DATE DEFAULT CURRENT_DATE,
  amount_requested DECIMAL(10,2),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.charity_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.charity_aid_requests(id) ON DELETE CASCADE,
  distributed_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Stage & Worship: services (worship_events), teams, equipment, rehearsals
CREATE TABLE IF NOT EXISTS public.worship_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.worship_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.worship_teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  UNIQUE(team_id, member_id)
);
CREATE TABLE IF NOT EXISTS public.worship_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'available', -- available | in_use | maintenance
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.worship_rehearsals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.worship_events(id) ON DELETE SET NULL,
  rehearsal_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Neftalem Choir: members, schedule, song library
CREATE TABLE IF NOT EXISTS public.choir_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voice_part TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id)
);
CREATE TABLE IF NOT EXISTS public.choir_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  event_type TEXT, -- rehearsal | performance
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.choir_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  composer TEXT,
  lyrics_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Monthly Workers Aid: beneficiaries, disbursements
CREATE TABLE IF NOT EXISTS public.workers_aid_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  monthly_amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active', -- active | inactive
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id)
);
CREATE TABLE IF NOT EXISTS public.workers_aid_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES public.workers_aid_beneficiaries(id) ON DELETE CASCADE,
  disbursement_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: enable on all new tables; allow select for authenticated, insert/update/delete for admin/elder/ministry_leader
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'spiritual_candidates','spiritual_classes','spiritual_class_attendance','baptisms','spiritual_follow_ups',
    'teaching_materials','women_meetings','women_activities','women_trainings','youth_mentorship',
    'children_classes','children_class_teachers','children_attendance','children_curriculum',
    'mission_trips','mission_trip_participants','mission_reports','marriage_seminars',
    'prayer_groups','prayer_requests','admin_tasks','deacon_care_visits','deacon_support_cases',
    'charity_aid_requests','charity_distributions','worship_teams','worship_team_members','worship_equipment','worship_rehearsals',
    'choir_members','choir_schedule','choir_songs','workers_aid_beneficiaries','workers_aid_disbursements'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_select_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "allow_select_%s" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL TO authenticated USING (
      (SELECT COALESCE(is_admin, false) OR role IN (''admin'',''elder'',''ministry_leader'',''finance'') FROM public.profiles WHERE id = auth.uid())
    ) WITH CHECK (
      (SELECT COALESCE(is_admin, false) OR role IN (''admin'',''elder'',''ministry_leader'',''finance'') FROM public.profiles WHERE id = auth.uid())
    )', t, t);
  END LOOP;
END $$;

-- migrate:down
DROP TABLE IF EXISTS
  public.workers_aid_disbursements,
  public.workers_aid_beneficiaries,
  public.choir_songs,
  public.choir_schedule,
  public.choir_members,
  public.worship_rehearsals,
  public.worship_equipment,
  public.worship_team_members,
  public.worship_teams,
  public.charity_distributions,
  public.charity_aid_requests,
  public.deacon_support_cases,
  public.deacon_care_visits,
  public.admin_tasks,
  public.prayer_requests,
  public.prayer_groups,
  public.marriage_seminars,
  public.mission_reports,
  public.mission_trip_participants,
  public.mission_trips,
  public.children_curriculum,
  public.children_attendance,
  public.children_class_teachers,
  public.children_classes,
  public.youth_mentorship,
  public.women_trainings,
  public.women_activities,
  public.women_meetings,
  public.teaching_materials,
  public.spiritual_follow_ups,
  public.baptisms,
  public.spiritual_class_attendance,
  public.spiritual_classes,
  public.spiritual_candidates
  CASCADE;
