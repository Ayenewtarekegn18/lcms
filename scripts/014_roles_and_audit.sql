-- Module 9: Access Control & Security
-- Add role to profiles and create audit_log table.

-- Role: 'admin' | 'elder' | 'ministry_leader' | 'finance' | 'member' (default)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Backfill: existing is_admin = true -> role = 'admin'
UPDATE public.profiles SET role = 'admin' WHERE is_admin = TRUE AND (role IS NULL OR role = 'member');

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_audit_select_admin" ON public.audit_log FOR SELECT USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'elder'
);

CREATE POLICY "allow_audit_insert_authenticated" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
