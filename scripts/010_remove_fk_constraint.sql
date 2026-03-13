-- Temporarily disable foreign key constraint on profiles to allow demo data insertion
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Note: The trigger on_auth_user_created will handle auto-creation of profiles for new auth users
-- For demo purposes, we insert profiles directly with specific UUIDs for testing
