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
