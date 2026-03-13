-- Sample Data for Testing
-- This script populates the database with realistic sample data

-- Insert Ministries
INSERT INTO public.ministries (
  id, name, description, leader_id, meeting_day, meeting_time, location, is_active
) VALUES
('20000000-0000-0000-0000-000000000001', 'Worship & Praise', 
 'Ministry focused on leading worship services and praise sessions', 
 '10000000-0000-0000-0000-000000000002', 'Sunday', '09:00 AM', 'Main Sanctuary', TRUE),

('20000000-0000-0000-0000-000000000002', 'Youth Ministry', 
 'Engaging young people in spiritual growth and fellowship', 
 '10000000-0000-0000-0000-000000000005', 'Friday', '05:00 PM', 'Youth Center', TRUE),

('20000000-0000-0000-0000-000000000003', 'Counseling Services', 
 'Spiritual counseling and pastoral care for members', 
 '10000000-0000-0000-0000-000000000004', 'Wednesday', '02:00 PM', 'Counseling Room', TRUE),

('20000000-0000-0000-0000-000000000004', 'Sunday School', 
 'Educational programs for children and teenagers', 
 '10000000-0000-0000-0000-000000000009', 'Sunday', '10:30 AM', 'Education Wing', TRUE),

('20000000-0000-0000-0000-000000000005', 'Community Outreach', 
 'Service and support to the community', 
 '10000000-0000-0000-0000-000000000007', 'Saturday', '08:00 AM', 'Community Center', TRUE),

('20000000-0000-0000-0000-000000000006', 'Music Ministry', 
 'Choir and instrumental music for worship', 
 '10000000-0000-0000-0000-000000000008', 'Tuesday', '07:00 PM', 'Music Room', TRUE),

('20000000-0000-0000-0000-000000000007', 'Health & Wellness', 
 'Health education and wellness programs', 
 '10000000-0000-0000-0000-000000000003', 'Thursday', '06:00 PM', 'Fellowship Hall', TRUE),

('20000000-0000-0000-0000-000000000008', 'Men''s Fellowship', 
 'Fellowship and spiritual development for men', 
 '10000000-0000-0000-0000-000000000002', 'Monday', '07:00 PM', 'Meeting Room A', TRUE),

('20000000-0000-0000-0000-000000000009', 'Women''s Ministry', 
 'Support and empowerment for women in the church', 
 '10000000-0000-0000-0000-000000000007', 'Wednesday', '04:00 PM', 'Meeting Room B', TRUE),

('20000000-0000-0000-0000-000000000010', 'Media & Communications', 
 'Managing church media and communications', 
 '10000000-0000-0000-0000-000000000006', 'Daily', 'Varies', 'Media Center', TRUE)

ON CONFLICT (id) DO NOTHING;

-- Insert Ministry Members
INSERT INTO public.ministry_members (
  id, ministry_id, member_id, role, joined_date, is_active
) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 
 '10000000-0000-0000-0000-000000000002', 'Leader', '2023-01-15', TRUE),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 
 '10000000-0000-0000-0000-000000000003', 'Member', '2023-06-20', TRUE),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 
 '10000000-0000-0000-0000-000000000005', 'Leader', '2023-02-10', TRUE),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 
 '10000000-0000-0000-0000-000000000008', 'Member', '2023-07-05', TRUE),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 
 '10000000-0000-0000-0000-000000000004', 'Leader', '2023-03-01', TRUE),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 
 '10000000-0000-0000-0000-000000000009', 'Leader', '2023-04-12', TRUE),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', 
 '10000000-0000-0000-0000-000000000007', 'Leader', '2023-05-08', TRUE),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', 
 '10000000-0000-0000-0000-000000000008', 'Leader', '2023-02-20', TRUE),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000007', 
 '10000000-0000-0000-0000-000000000003', 'Leader', '2023-06-15', TRUE),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000009', 
 '10000000-0000-0000-0000-000000000007', 'Leader', '2023-03-25', TRUE)

ON CONFLICT (id) DO NOTHING;

-- Insert Events
INSERT INTO public.events (
  id, title, description, event_type, start_date, end_date, location, organizer_id, max_attendees, is_active
) VALUES
('40000000-0000-0000-0000-000000000001', 'Sunday Worship Service', 
 'Weekly main worship service for all members', 'Worship', 
 CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '9 hours', 
 CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '11 hours', 
 'Main Sanctuary', '10000000-0000-0000-0000-000000000002', 500, TRUE),

('40000000-0000-0000-0000-000000000002', 'Youth Fellowship Night', 
 'Social gathering and Bible study for youth', 'Fellowship', 
 CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '5 hours', 
 CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '7 hours', 
 'Youth Center', '10000000-0000-0000-0000-000000000005', 150, TRUE),

('40000000-0000-0000-0000-000000000003', 'Community Service Day', 
 'Outreach and service to the community', 'Outreach', 
 CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '8 hours', 
 CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '2 hours', 
 'Community Center', '10000000-0000-0000-0000-000000000007', 200, TRUE),

('40000000-0000-0000-0000-000000000004', 'Choir Rehearsal', 
 'Music ministry choir practice session', 'Practice', 
 CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '7 hours', 
 CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '9 hours', 
 'Music Room', '10000000-0000-0000-0000-000000000008', 100, TRUE),

('40000000-0000-0000-0000-000000000005', 'Prayer Meeting', 
 'Mid-week prayer and intercession session', 'Prayer', 
 CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '7 hours', 
 CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '8 hours', 
 'Fellowship Hall', '10000000-0000-0000-0000-000000000002', 200, TRUE)

ON CONFLICT (id) DO NOTHING;

-- Insert Financial Transactions
INSERT INTO public.financial_transactions (
  id, transaction_type, amount, currency, description, member_id, 
  transaction_date, recorded_by_id, notes
) VALUES
('50000000-0000-0000-0000-000000000001', 'Tithe', 500.00, 'USD', 'Weekly tithe offering', 
 '10000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '7 days', 
 '10000000-0000-0000-0000-000000000006', 'Electronic transfer'),

('50000000-0000-0000-0000-000000000002', 'Donation', 250.00, 'USD', 'General offering', 
 '10000000-0000-0000-0000-000000000007', CURRENT_DATE - INTERVAL '6 days', 
 '10000000-0000-0000-0000-000000000006', 'Cash donation'),

('50000000-0000-0000-0000-000000000003', 'Tithe', 750.00, 'USD', 'Weekly tithe offering', 
 '10000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '5 days', 
 '10000000-0000-0000-0000-000000000006', 'Mobile money'),

('50000000-0000-0000-0000-000000000004', 'Donation', 1000.00, 'USD', 'Youth ministry donation', 
 '10000000-0000-0000-0000-000000000009', CURRENT_DATE - INTERVAL '4 days', 
 '10000000-0000-0000-0000-000000000006', 'Bank transfer'),

('50000000-0000-0000-0000-000000000005', 'Expense', -300.00, 'USD', 'Office supplies', 
 NULL, CURRENT_DATE - INTERVAL '3 days', 
 '10000000-0000-0000-0000-000000000001', 'Purchase receipt'),

('50000000-0000-0000-0000-000000000006', 'Expense', -500.00, 'USD', 'Maintenance and repairs', 
 NULL, CURRENT_DATE - INTERVAL '2 days', 
 '10000000-0000-0000-0000-000000000001', 'Service invoice'),

('50000000-0000-0000-0000-000000000007', 'Tithe', 600.00, 'USD', 'Weekly tithe offering', 
 '10000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', 
 '10000000-0000-0000-0000-000000000006', 'Online giving'),

('50000000-0000-0000-0000-000000000008', 'Donation', 150.00, 'USD', 'Special project donation', 
 '10000000-0000-0000-0000-000000000008', CURRENT_DATE, 
 '10000000-0000-0000-0000-000000000006', 'Cash')

ON CONFLICT (id) DO NOTHING;

-- Insert Attendance Records
INSERT INTO public.attendance_records (
  id, member_id, event_type, attendance_date, status, recorded_by_id
) VALUES
('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 
 'Sunday Worship', CURRENT_DATE - INTERVAL '7 days', 'present', '10000000-0000-0000-0000-000000000001'),

('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 
 'Sunday Worship', CURRENT_DATE - INTERVAL '7 days', 'present', '10000000-0000-0000-0000-000000000001'),

('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 
 'Sunday Worship', CURRENT_DATE - INTERVAL '7 days', 'late', '10000000-0000-0000-0000-000000000001'),

('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', 
 'Sunday Worship', CURRENT_DATE - INTERVAL '7 days', 'absent', '10000000-0000-0000-0000-000000000001'),

('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 
 'Youth Fellowship', CURRENT_DATE - INTERVAL '5 days', 'present', '10000000-0000-0000-0000-000000000005'),

('60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000008', 
 'Youth Fellowship', CURRENT_DATE - INTERVAL '5 days', 'present', '10000000-0000-0000-0000-000000000005'),

('60000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 
 'Sunday Worship', CURRENT_DATE - INTERVAL '0 days', 'present', '10000000-0000-0000-0000-000000000001'),

('60000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000007', 
 'Sunday Worship', CURRENT_DATE - INTERVAL '0 days', 'present', '10000000-0000-0000-0000-000000000001')

ON CONFLICT (id) DO NOTHING;
