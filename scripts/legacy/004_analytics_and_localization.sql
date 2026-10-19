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
