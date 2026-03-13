-- Phase 2: Extended Ministry Modules Tables

-- Spiritual Services Module
CREATE TABLE IF NOT EXISTS public.spiritual_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT NOT NULL,
  location TEXT,
  pastor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  attendees_count INTEGER,
  sermon_topic TEXT,
  sermon_notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Counseling Services Module
CREATE TABLE IF NOT EXISTS public.counseling_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  session_type TEXT NOT NULL,
  duration_minutes INTEGER,
  session_notes TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Youth Ministry Module
CREATE TABLE IF NOT EXISTS public.youth_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  age_range TEXT,
  program_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  max_participants INTEGER,
  participants_count INTEGER,
  program_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Education & Training Module
CREATE TABLE IF NOT EXISTS public.education_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_weeks INTEGER,
  location TEXT,
  max_capacity INTEGER,
  program_type TEXT,
  curriculum_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Education Enrollment
CREATE TABLE IF NOT EXISTS public.education_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.education_programs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  status TEXT DEFAULT 'active',
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, member_id)
);

-- Worship & Music Module
CREATE TABLE IF NOT EXISTS public.worship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  worship_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  worship_type TEXT,
  description TEXT,
  location TEXT,
  songs_list TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Music Team Members
CREATE TABLE IF NOT EXISTS public.music_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL,
  skill_level TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, instrument)
);

-- Communications & Media Module
CREATE TABLE IF NOT EXISTS public.media_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  description TEXT,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  media_url TEXT,
  thumbnail_url TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health & Wellness Module
CREATE TABLE IF NOT EXISTS public.health_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  program_date TIMESTAMP WITH TIME ZONE NOT NULL,
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_type TEXT,
  location TEXT,
  max_participants INTEGER,
  participants_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Service Module
CREATE TABLE IF NOT EXISTS public.community_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_status TEXT DEFAULT 'planning',
  start_date DATE NOT NULL,
  end_date DATE,
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_beneficiaries INTEGER,
  location TEXT,
  budget DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community Project Volunteers
CREATE TABLE IF NOT EXISTS public.community_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.community_projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  volunteer_date DATE,
  hours_contributed DECIMAL(5, 2),
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, member_id)
);

-- Facility Management Module
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  building_number TEXT,
  capacity INTEGER,
  description TEXT,
  location TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Facility Bookings
CREATE TABLE IF NOT EXISTS public.facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  booked_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  purpose TEXT,
  expected_attendees INTEGER,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Facility Maintenance
CREATE TABLE IF NOT EXISTS public.facility_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  contractor_name TEXT,
  cost DECIMAL(10, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Committees & Leadership Module
CREATE TABLE IF NOT EXISTS public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  chairman_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vice_chairman_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  secretary_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  established_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Committee Members
CREATE TABLE IF NOT EXISTS public.committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(committee_id, member_id)
);

-- Committee Meetings
CREATE TABLE IF NOT EXISTS public.committee_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  agenda TEXT,
  minutes TEXT,
  attendees_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on new tables
ALTER TABLE public.spiritual_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youth_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Spiritual Services
CREATE POLICY "spiritual_services_select_all" ON public.spiritual_services FOR SELECT USING (TRUE);
CREATE POLICY "spiritual_services_insert_admin" ON public.spiritual_services FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
CREATE POLICY "spiritual_services_update_admin" ON public.spiritual_services FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- RLS Policies for Counseling Services (confidential)
CREATE POLICY "counseling_select_own_or_admin" ON public.counseling_services FOR SELECT USING (
  member_id = auth.uid() OR
  counselor_id = auth.uid() OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
CREATE POLICY "counseling_insert_counselor" ON public.counseling_services FOR INSERT WITH CHECK (
  counselor_id = auth.uid() OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- RLS Policies for Youth Programs
CREATE POLICY "youth_programs_select_all" ON public.youth_programs FOR SELECT USING (is_active = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "youth_programs_insert_admin" ON public.youth_programs FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Education Programs
CREATE POLICY "education_programs_select_all" ON public.education_programs FOR SELECT USING (is_active = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "education_enrollments_select_own" ON public.education_enrollments FOR SELECT USING (member_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "education_enrollments_insert_admin" ON public.education_enrollments FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Worship Events
CREATE POLICY "worship_events_select_all" ON public.worship_events FOR SELECT USING (TRUE);
CREATE POLICY "worship_events_insert_admin" ON public.worship_events FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Music Team
CREATE POLICY "music_team_select_all" ON public.music_team_members FOR SELECT USING (is_active = TRUE OR member_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "music_team_insert_admin" ON public.music_team_members FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Media Content
CREATE POLICY "media_content_select_published" ON public.media_content FOR SELECT USING (is_published = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "media_content_insert_admin" ON public.media_content FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Health Programs
CREATE POLICY "health_programs_select_all" ON public.health_programs FOR SELECT USING (is_active = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "health_programs_insert_admin" ON public.health_programs FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Community Projects
CREATE POLICY "community_projects_select_all" ON public.community_projects FOR SELECT USING (is_active = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "community_projects_insert_admin" ON public.community_projects FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Community Volunteers
CREATE POLICY "community_volunteers_select_own" ON public.community_volunteers FOR SELECT USING (member_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "community_volunteers_insert_admin" ON public.community_volunteers FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Facilities
CREATE POLICY "facilities_select_all" ON public.facilities FOR SELECT USING (is_active = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "facility_bookings_select_own" ON public.facility_bookings FOR SELECT USING (booked_by_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "facility_bookings_insert_user" ON public.facility_bookings FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "facility_maintenance_select_admin" ON public.facility_maintenance FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "facility_maintenance_insert_admin" ON public.facility_maintenance FOR INSERT WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);

-- RLS Policies for Committees
CREATE POLICY "committees_select_all" ON public.committees FOR SELECT USING (is_active = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "committee_members_select_all" ON public.committee_members FOR SELECT USING (is_active = TRUE OR member_id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "committee_meetings_select_all" ON public.committee_meetings FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE OR (SELECT COUNT(*) FROM committee_members WHERE committee_id = committee_meetings.committee_id AND member_id = auth.uid()) > 0);

-- Create indexes for performance
CREATE INDEX idx_spiritual_services_date ON public.spiritual_services(service_date);
CREATE INDEX idx_counseling_member ON public.counseling_services(member_id);
CREATE INDEX idx_counseling_counselor ON public.counseling_services(counselor_id);
CREATE INDEX idx_youth_programs_date ON public.youth_programs(program_date);
CREATE INDEX idx_education_programs_dates ON public.education_programs(start_date, end_date);
CREATE INDEX idx_education_enrollments_program ON public.education_enrollments(program_id);
CREATE INDEX idx_education_enrollments_member ON public.education_enrollments(member_id);
CREATE INDEX idx_worship_events_date ON public.worship_events(event_date);
CREATE INDEX idx_music_team_member ON public.music_team_members(member_id);
CREATE INDEX idx_media_content_created ON public.media_content(created_by_id);
CREATE INDEX idx_health_programs_date ON public.health_programs(program_date);
CREATE INDEX idx_community_projects_status ON public.community_projects(project_status);
CREATE INDEX idx_community_volunteers_project ON public.community_volunteers(project_id);
CREATE INDEX idx_community_volunteers_member ON public.community_volunteers(member_id);
CREATE INDEX idx_facility_bookings_date ON public.facility_bookings(booking_date);
CREATE INDEX idx_committee_members_committee ON public.committee_members(committee_id);
CREATE INDEX idx_committee_meetings_date ON public.committee_meetings(meeting_date);
