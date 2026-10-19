-- Documents and archive management

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  content_type TEXT,
  uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  access_level TEXT DEFAULT 'Staff Only',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_documents_select" ON public.documents FOR SELECT USING (true);
CREATE POLICY "allow_documents_insert" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_documents_update" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "allow_documents_delete" ON public.documents FOR DELETE USING (true);

CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- Create storage bucket via Supabase Dashboard or: insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
