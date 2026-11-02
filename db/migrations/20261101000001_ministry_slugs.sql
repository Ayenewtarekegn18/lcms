-- migrate:up
-- Ministry workspaces (docs/MINISTRY_WORKSPACES.md): each ministry page under app/dashboard/ministry/<slug>
-- finds its ministries row by a stable slug instead of matching on the (editable, bilingual) name.
--   slug     lower-case kebab, unique, the page's folder name (NULL for ministries without a workspace)
--   name_am  the Amharic name shown next to the English one
-- The 14 ministries the app has pages for are created, or given their slug and Amharic name when a row
-- with the same English name already exists. Expand only: nothing reads these columns before this release.

ALTER TABLE public.ministries
  ADD COLUMN slug text CONSTRAINT ministries_slug_key UNIQUE
    CONSTRAINT ministries_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD COLUMN name_am text;

-- Amharic names are a first draft, to be reviewed by a native speaker (they can be edited in the app's
-- ministries page later; the slug is what the code relies on).
INSERT INTO public.ministries (name, name_am, slug, description, is_active) VALUES
  ('Administration',      'አስተዳደር',                    'administration',    'Handles organizational operations and documentation', true),
  ('Charity Ministry',    'የበጎ አድራጎት አገልግሎት',          'charity',           'Provides aid and support to members in need', true),
  ('Children Ministry',   'የሕፃናት አገልግሎት',               'children',          'Manages children classes, teachers, and lesson plans', true),
  ('Neftalem Choir',      'ንፍታሌም መዘምራን',               'choir',             'Manages choir operations, rehearsals, and performances', true),
  ('Deacons',             'ዲያቆናት',                      'deacons',           'Provides pastoral care, logistics, and member support', true),
  ('Marriage & Family',   'የጋብቻና የቤተሰብ አገልግሎት',        'marriage-family',   'Supports marriages and family life through counseling', true),
  ('Mission Ministry',    'የሚሲዮን አገልግሎት',               'mission',           'Manages outreach, evangelism, and mission activities', true),
  ('Prayer Groups',       'የጸሎት ቡድኖች',                  'prayer-groups',     'Coordinates prayer meetings and spiritual requests', true),
  ('Spiritual Service',   'መንፈሳዊ አገልግሎት',               'spiritual-service', 'Oversees spiritual care, salvation preparation, and baptism readiness', true),
  ('Stage & Worship',     'የመድረክና የአምልኮ አገልግሎት',        'stage-worship',     'Manages worship services and stage operations', true),
  ('Teaching & Seminar',  'የትምህርትና የሴሚናር አገልግሎት',       'teaching',          'Organizes doctrinal teaching, seminars, and structured learning', true),
  ('Women''s Ministry',   'የሴቶች አገልግሎት',                'women',             'Coordinates spiritual growth, fellowship, and service', true),
  ('Monthly Workers Aid', 'ወርሃዊ የአገልጋዮች ድጋፍ',           'workers-aid',       'Manages regular aid to church workers', true),
  ('Youth Ministry',      'የወጣቶች አገልግሎት',               'youth',             'Engages youth through teaching, mentorship, and programs', true)
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, name_am = EXCLUDED.name_am;

-- migrate:down
-- The ministries rows stay (they may have members and events by now); only the two columns go.
ALTER TABLE public.ministries DROP COLUMN IF EXISTS name_am;
ALTER TABLE public.ministries DROP COLUMN IF EXISTS slug;
