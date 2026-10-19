-- Run this in Supabase SQL Editor to fix: "new row violates row-level security policy for table profiles"
-- This allows users who have is_admin = true to insert any row into profiles (e.g. when registering a new member).

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT WITH CHECK (
  COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE) = TRUE
);
