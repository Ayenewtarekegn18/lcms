-- Demo Accounts Setup Script
-- This script creates demo users with specific credentials for testing
-- Note: Auth users must be created via Supabase Auth API, this only sets up profiles

-- Demo User IDs (these should be replaced with actual auth user IDs after creation via Supabase)
-- We'll use placeholder UUIDs that need to be replaced

-- Accounts: admin@church.local, leader@church.local, member@church.local, counselor@church.local
-- Passwords are not stored in the repo. Create the auth users with scripts/setup-demo-accounts.js,
-- which reads DEMO_ADMIN_PASSWORD / DEMO_USER_PASSWORD from .env.local (see docs/DEMO_SETUP.md).
-- DEV/DEMO ONLY: never run this file against a production project.

-- Create demo profiles (these UUIDs are placeholders - use actual auth.users IDs)
-- You'll need to manually create these auth users in Supabase and note their IDs

INSERT INTO public.profiles (
  id, first_name, last_name, email, phone, date_of_birth, gender, 
  address, city, country, is_admin, is_active
) VALUES
-- Admin User
('10000000-0000-0000-0000-000000000001', 'Admin', 'Church', 'admin@church.local', '+251911234567', 
 '1985-01-15', 'Male', '123 Church St', 'Addis Ababa', 'Ethiopia', TRUE, TRUE),

-- Senior Ministry Leader
('10000000-0000-0000-0000-000000000002', 'David', 'Bekele', 'leader@church.local', '+251922345678', 
 '1980-03-20', 'Male', '456 Ministry Ave', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

-- Regular Member
('10000000-0000-0000-0000-000000000003', 'Hiwot', 'Hailu', 'member@church.local', '+251933456789', 
 '1990-07-10', 'Female', '789 Community Ln', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

-- Counselor
('10000000-0000-0000-0000-000000000004', 'Yohannes', 'Tamrat', 'counselor@church.local', '+251944567890', 
 '1982-05-25', 'Male', '321 Care St', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

-- Youth Leader
('10000000-0000-0000-0000-000000000005', 'Abeba', 'Solomon', 'youth@church.local', '+251955678901', 
 '1992-11-08', 'Female', '654 Youth Way', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

-- Treasurer
('10000000-0000-0000-0000-000000000006', 'Tadesse', 'Mengistu', 'treasurer@church.local', '+251966789012', 
 '1975-09-30', 'Male', '987 Finance Dr', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

-- Additional Members for Testing
('10000000-0000-0000-0000-000000000007', 'Almaz', 'Tekle', 'almaz@church.local', '+251977890123', 
 '1988-02-14', 'Female', '111 Hope St', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

('10000000-0000-0000-0000-000000000008', 'Getnet', 'Abebe', 'getnet@church.local', '+251988901234', 
 '1995-08-22', 'Male', '222 Grace Ave', 'Addis Ababa', 'Ethiopia', FALSE, TRUE),

('10000000-0000-0000-0000-000000000009', 'Marta', 'Yilma', 'marta@church.local', '+251999012345', 
 '1991-04-16', 'Female', '333 Blessing Ln', 'Addis Ababa', 'Ethiopia', FALSE, TRUE)

ON CONFLICT (id) DO NOTHING;
