-- migrate:up
-- Baseline: the schema every existing project already has (legacy scripts 001, 002, 003, 004 and 008, in that order).
-- Existing databases: db/scripts/adopt_existing_database.sql marks this as applied instead of running it.

-- ---- from scripts/001_create_church_schema.sql ----
-- Create profiles table for members and admins
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  profile_photo_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ministries table
CREATE TABLE IF NOT EXISTS public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  meeting_day TEXT,
  meeting_time TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ministry members junction table
CREATE TABLE IF NOT EXISTS public.ministry_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ministry_id, member_id)
);

-- Create financial transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  recorded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  notes TEXT,
  recorded_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, event_type, attendance_date)
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  max_attendees INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
) WITH CHECK (
  auth.uid() = id OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Ministries RLS Policies (read-only for regular users)
CREATE POLICY "ministries_select_all" ON public.ministries FOR SELECT USING (
  is_active = TRUE OR 
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "ministries_insert_admin" ON public.ministries FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "ministries_update_admin" ON public.ministries FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
) WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Ministry Members RLS Policies
CREATE POLICY "ministry_members_select_all" ON public.ministry_members FOR SELECT USING (
  is_active = TRUE OR
  member_id = auth.uid() OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "ministry_members_insert_admin" ON public.ministry_members FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "ministry_members_update_admin" ON public.ministry_members FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
) WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Financial Transactions RLS Policies
CREATE POLICY "financial_select_admin" ON public.financial_transactions FOR SELECT USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE OR
  member_id = auth.uid()
);

CREATE POLICY "financial_insert_admin" ON public.financial_transactions FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Attendance Records RLS Policies
CREATE POLICY "attendance_select_own_or_admin" ON public.attendance_records FOR SELECT USING (
  member_id = auth.uid() OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "attendance_insert_admin" ON public.attendance_records FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Events RLS Policies
CREATE POLICY "events_select_active" ON public.events FOR SELECT USING (
  is_active = TRUE OR
  organizer_id = auth.uid() OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "events_insert_user" ON public.events FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX idx_ministry_members_ministry_id ON public.ministry_members(ministry_id);
CREATE INDEX idx_ministry_members_member_id ON public.ministry_members(member_id);
CREATE INDEX idx_financial_transactions_member_id ON public.financial_transactions(member_id);
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_attendance_records_member_id ON public.attendance_records(member_id);
CREATE INDEX idx_attendance_records_date ON public.attendance_records(attendance_date);
CREATE INDEX idx_events_start_date ON public.events(start_date);

-- ---- from scripts/002_profile_trigger.sql ----
-- Create function to handle new user signup
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---- from scripts/003_phase2_ministry_modules.sql ----
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

-- ---- from scripts/004_analytics_and_localization.sql ----
-- Phase 2: Analytics and Multi-Language Support Tables

-- System Analytics & Reports
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom Reports
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  filters JSONB,
  generated_date TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Statistics
CREATE TABLE IF NOT EXISTS public.monthly_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_members INTEGER,
  active_members INTEGER,
  total_donations DECIMAL(10, 2),
  total_expenses DECIMAL(10, 2),
  average_attendance INTEGER,
  new_members_count INTEGER,
  events_held INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, month)
);

-- Multi-Language Support
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  module_type TEXT NOT NULL,
  key TEXT NOT NULL,
  translation_text TEXT NOT NULL,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(language_code, module_type, key)
);

-- User Language Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics
CREATE POLICY "analytics_select_admin" ON public.analytics_events FOR SELECT USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
CREATE POLICY "analytics_insert_system" ON public.analytics_events FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for Reports
CREATE POLICY "custom_reports_select_admin" ON public.custom_reports FOR SELECT USING (
  created_by_id = auth.uid() OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
CREATE POLICY "custom_reports_insert_admin" ON public.custom_reports FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- RLS Policies for Monthly Statistics
CREATE POLICY "monthly_statistics_select_admin" ON public.monthly_statistics FOR SELECT USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
CREATE POLICY "monthly_statistics_insert_admin" ON public.monthly_statistics FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- RLS Policies for Translations
CREATE POLICY "translations_select_all" ON public.translations FOR SELECT USING (is_approved = TRUE OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "translations_insert_admin" ON public.translations FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);
CREATE POLICY "translations_update_admin" ON public.translations FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- RLS Policies for User Preferences
CREATE POLICY "user_preferences_select_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_analytics_events_date ON public.analytics_events(event_date);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_custom_reports_created_by ON public.custom_reports(created_by_id);
CREATE INDEX idx_translations_language ON public.translations(language_code);
CREATE INDEX idx_translations_module ON public.translations(module_type);
CREATE INDEX idx_user_preferences_language ON public.user_preferences(preferred_language);

-- Insert default translations for English and Amharic
INSERT INTO public.translations (language_code, module_type, key, translation_text, is_approved) VALUES
('en', 'common', 'dashboard', 'Dashboard', TRUE),
('en', 'common', 'members', 'Members', TRUE),
('en', 'common', 'financial', 'Financial', TRUE),
('en', 'common', 'attendance', 'Attendance', TRUE),
('en', 'common', 'events', 'Events', TRUE),
('en', 'common', 'ministries', 'Ministries', TRUE),
('en', 'common', 'logout', 'Logout', TRUE),
('en', 'common', 'settings', 'Settings', TRUE),
('am', 'common', 'dashboard', 'ዳሰውስ', TRUE),
('am', 'common', 'members', 'አባላት', TRUE),
('am', 'common', 'financial', '재정', TRUE),
('am', 'common', 'attendance', 'ሕضሪ', TRUE),
('am', 'common', 'events', 'ዝግጅቶች', TRUE),
('am', 'common', 'ministries', 'ሚኒስትሪዎች', TRUE),
('am', 'common', 'logout', 'ወደ ውጪ ውጣ', TRUE),
('am', 'common', 'settings', 'ቅንብሮች', TRUE);

-- ---- from scripts/008_simplify_rls_policies.sql ----
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

-- migrate:down
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS
  public.user_preferences,
  public.translations,
  public.monthly_statistics,
  public.custom_reports,
  public.analytics_events,
  public.committee_meetings,
  public.committee_members,
  public.committees,
  public.facility_maintenance,
  public.facility_bookings,
  public.facilities,
  public.community_volunteers,
  public.community_projects,
  public.health_programs,
  public.media_content,
  public.music_team_members,
  public.worship_events,
  public.education_enrollments,
  public.education_programs,
  public.youth_programs,
  public.counseling_services,
  public.spiritual_services,
  public.events,
  public.attendance_records,
  public.financial_transactions,
  public.ministry_members,
  public.ministries,
  public.profiles
  CASCADE;
