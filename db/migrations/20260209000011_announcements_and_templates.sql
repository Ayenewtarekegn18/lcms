-- migrate:up
-- Announcements and message templates (legacy script 011).

-- ---- from scripts/011_announcements_and_templates.sql ----
-- Announcements and message templates for Communications module

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recipients TEXT DEFAULT 'All Members',
  channels TEXT[] DEFAULT ARRAY['Email'],
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  status TEXT DEFAULT 'Published',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_announcements_select" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "allow_announcements_insert" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_announcements_update" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "allow_announcements_delete" ON public.announcements FOR DELETE USING (true);

CREATE POLICY "allow_templates_select" ON public.message_templates FOR SELECT USING (true);
CREATE POLICY "allow_templates_insert" ON public.message_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_templates_update" ON public.message_templates FOR UPDATE USING (true);
CREATE POLICY "allow_templates_delete" ON public.message_templates FOR DELETE USING (true);

CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX idx_message_templates_name ON public.message_templates(name);

-- migrate:down
DROP TABLE IF EXISTS
  public.message_templates,
  public.announcements
  CASCADE;
