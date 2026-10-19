-- migrate:up
-- Member registry matching the lebu-form register (Lebu Kale Hiwot member form), so the app collects the
-- same data the church already collects and existing records import with their LKH-0001 numbers.
--   profiles        name (ስም / የአባት ስም), sex, date of birth, phone, email: the identity used across the app
--   member_details  everything else on the form, staff-only, one row per registered person
--   church_settings card/registry settings from lebu-form (member-number prefix, church name, address…)
--   register_member(payload) creates both rows in one transaction; member_number comes from a sequence,
--   so two registrations at the same moment can never get the same number.

CREATE TABLE public.church_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.church_settings (key, value) VALUES
  ('member_prefix', 'LKH'),
  ('church_name_am', 'የለቡ ቃለ ሕይወት ቤተ ክርስቲያን'),
  ('church_name_en', 'Lebu Kale Hiwot Church'),
  ('address_am', 'ንፋስ ስልክ ላፍቶ ክ/ከተማ፣ ለቡ፣ አዲስ አበባ'),
  ('address_en', 'Nifas Silk-Lafto, Lebu, Addis Ababa'),
  ('church_phone', ''),
  ('card_valid_years', '2'),
  ('card_motto', 'ቃለ ሕይወት ይሰጠን · The Word of Life be given to us');
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY church_settings_select ON public.church_settings FOR SELECT TO authenticated
  USING ((SELECT public.current_app_role()) IS NOT NULL);
CREATE POLICY church_settings_write ON public.church_settings FOR ALL TO authenticated
  USING ((SELECT public.has_role('admin'))) WITH CHECK ((SELECT public.has_role('admin')));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.church_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE SEQUENCE public.member_number_seq;

-- LKH-0001, LKH-0002, … (prefix from church_settings; never truncated past 9999)
CREATE FUNCTION public.next_member_number()
RETURNS text
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT coalesce(nullif(upper(regexp_replace(
           (SELECT s.value FROM public.church_settings s WHERE s.key = 'member_prefix'), '[^A-Za-z0-9]', '', 'g')), ''), 'LKH')
         || '-' || lpad(n::text, greatest(4, length(n::text)), '0')
    FROM (SELECT nextval('public.member_number_seq') AS n) seq
$$;
REVOKE ALL ON FUNCTION public.next_member_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_member_number() TO authenticated, service_role;

-- The number the next registration will probably get (shown on the form; doesn't consume it).
CREATE FUNCTION public.peek_next_member_number()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT coalesce(nullif(upper(regexp_replace(
           (SELECT s.value FROM public.church_settings s WHERE s.key = 'member_prefix'), '[^A-Za-z0-9]', '', 'g')), ''), 'LKH')
         || '-' || lpad(n::text, greatest(4, length(n::text)), '0')
    FROM (SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END AS n FROM public.member_number_seq) seq
$$;
REVOKE ALL ON FUNCTION public.peek_next_member_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.peek_next_member_number() TO authenticated, service_role;

CREATE TABLE public.member_details (
  member_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_number text NOT NULL UNIQUE DEFAULT public.next_member_number(),
  grandfather_name text,
  marital_status text CHECK (marital_status IN ('single', 'married', 'widowed', 'divorced')),
  spouse_name text,
  spouse_age integer CHECK (spouse_age BETWEEN 0 AND 120),
  spouse_phone text,
  spouse_member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  children_count integer CHECK (children_count BETWEEN 0 AND 30),
  children jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(children) = 'array'),
  household jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(household) = 'array'),
  blood_group text CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  phone2 text,
  subcity text CHECK (subcity IN ('nifas-silk', 'akaki', 'bole', 'kirkos', 'lideta', 'addis-ketema',
                                  'arada', 'gulele', 'kolfe', 'yeka', 'lemi-kura', 'other')),
  woreda text,
  house_number text,
  area text,
  member_since date,
  baptized boolean,
  baptism_date date,
  previous_church text,
  church_standing text NOT NULL DEFAULT 'member'
    CHECK (church_standing IN ('member', 'deacon', 'elder', 'teacher', 'evangelist', 'pastor', 'board')),
  departments text[] NOT NULL DEFAULT '{}'
    CHECK (departments <@ ARRAY['choir', 'worship', 'children', 'youth', 'women', 'men', 'teaching', 'prayer',
                                'evangelism', 'ushering', 'media', 'benevolence', 'none']::text[]),
  wants_department text
    CHECK (wants_department IN ('choir', 'worship', 'children', 'youth', 'women', 'men', 'teaching', 'prayer',
                                'evangelism', 'ushering', 'media', 'benevolence')),
  membership_status text NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive')),
  education_level text CHECK (education_level IN ('primary', 'secondary', 'tvet', 'degree', 'masters', 'phd', 'none')),
  occupation text,
  workplace text,
  emergency_name text,
  emergency_phone text,
  emergency_relationship text,
  notes text,
  photo_path text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_member_details_spouse ON public.member_details (spouse_member_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.member_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- personal data: the audit log records which fields changed, not their values
CREATE TRIGGER audit_row_change AFTER INSERT OR UPDATE OR DELETE ON public.member_details
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change('redact');

ALTER TABLE public.member_details ENABLE ROW LEVEL SECURITY;
-- staff read the registry; a member reads their own record (for a future "My ID" card)
CREATE POLICY member_details_select ON public.member_details FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin', 'elder', 'ministry_leader')) OR member_id = (SELECT auth.uid()));
-- registrars write (keep in step with REGISTRARS in lib/auth/roles.ts)
CREATE POLICY member_details_insert ON public.member_details FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin')));
CREATE POLICY member_details_update ON public.member_details FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin'))) WITH CHECK ((SELECT public.has_role('admin')));
CREATE POLICY member_details_delete ON public.member_details FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin')));

-- Creates the profile and the registry row together. Runs as the caller, so RLS applies
-- (only registrars can insert). `memberNumber` is honoured only for the service role (imports).
CREATE FUNCTION public.register_member(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  pid uuid;
  num text;
  imported text := CASE WHEN current_user IN ('anon', 'authenticated') THEN NULL
                        ELSE nullif(payload ->> 'memberNumber', '') END;
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only registrars can register members' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.profiles (first_name, last_name, gender, date_of_birth, phone, email, is_active)
  VALUES (payload ->> 'firstNameAm',
          payload ->> 'fatherNameAm',
          payload ->> 'sex',
          nullif(payload ->> 'dob', '')::date,
          payload ->> 'phone',
          nullif(payload ->> 'email', ''),
          true)
  RETURNING id INTO pid;

  INSERT INTO public.member_details (
    member_id, member_number, grandfather_name, marital_status, spouse_name, spouse_age, spouse_phone,
    spouse_member_id, children_count, children, household, blood_group, phone2, subcity, woreda,
    house_number, area, member_since, baptized, baptism_date, previous_church, church_standing,
    departments, wants_department, membership_status, education_level, occupation, workplace,
    emergency_name, emergency_phone, emergency_relationship, notes)
  VALUES (
    pid,
    coalesce(imported, public.next_member_number()),
    nullif(payload ->> 'gfNameAm', ''),
    nullif(payload ->> 'marital', ''),
    nullif(payload ->> 'spouse', ''),
    nullif(payload ->> 'spouseAge', '')::integer,
    nullif(payload ->> 'spousePhone', ''),
    nullif(payload ->> 'spouseMemberId', '')::uuid,
    nullif(payload ->> 'children', '')::integer,
    coalesce(payload -> 'childrenList', '[]'::jsonb),
    coalesce(payload -> 'household', '[]'::jsonb),
    nullif(payload ->> 'blood', ''),
    nullif(payload ->> 'phone2', ''),
    nullif(payload ->> 'subcity', ''),
    nullif(payload ->> 'woreda', ''),
    nullif(payload ->> 'house', ''),
    nullif(payload ->> 'area', ''),
    nullif(payload ->> 'memberSince', '')::date,
    CASE payload ->> 'baptized' WHEN 'yes' THEN true WHEN 'no' THEN false END,
    nullif(payload ->> 'baptismDate', '')::date,
    nullif(payload ->> 'prevChurch', ''),
    coalesce(nullif(payload ->> 'role', ''), 'member'),
    coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(payload -> 'depts', '[]'::jsonb))), '{}'),
    nullif(payload ->> 'wantsDept', ''),
    coalesce(nullif(payload ->> 'status', ''), 'active'),
    nullif(payload ->> 'education', ''),
    nullif(payload ->> 'occupation', ''),
    nullif(payload ->> 'workplace', ''),
    nullif(payload ->> 'emgName', ''),
    nullif(payload ->> 'emgPhone', ''),
    nullif(payload ->> 'emgRel', ''),
    nullif(payload ->> 'notes', ''))
  RETURNING member_number INTO num;

  RETURN jsonb_build_object('id', pid, 'member_number', num);
END
$$;
REVOKE ALL ON FUNCTION public.register_member(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_member(jsonb) TO authenticated, service_role;

-- After importing records with their existing numbers, continue the sequence after the highest one.
CREATE FUNCTION public.sync_member_number_seq()
RETURNS bigint
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT setval('public.member_number_seq',
                greatest(coalesce((SELECT max(substring(d.member_number FROM '([0-9]+)$')::bigint)
                                     FROM public.member_details d), 0), 1),
                (SELECT count(*) > 0 FROM public.member_details))
$$;
REVOKE ALL ON FUNCTION public.sync_member_number_seq() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_member_number_seq() TO service_role;

-- Private bucket for 4:5 portrait photos, stored as <member_id>.jpg
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', false)
      ON CONFLICT (id) DO NOTHING;
    CREATE POLICY member_photos_read ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'member-photos'
             AND ((SELECT public.has_role('admin', 'elder', 'ministry_leader'))
                  OR name = (SELECT auth.uid())::text || '.jpg'));
    CREATE POLICY member_photos_insert ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'member-photos' AND (SELECT public.has_role('admin')));
    CREATE POLICY member_photos_update ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'member-photos' AND (SELECT public.has_role('admin')))
      WITH CHECK (bucket_id = 'member-photos' AND (SELECT public.has_role('admin')));
    CREATE POLICY member_photos_delete ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'member-photos' AND (SELECT public.has_role('admin')));
  END IF;
END
$$;

-- migrate:down
-- Registered people keep their profiles rows; only the registry details are removed.
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP POLICY IF EXISTS member_photos_read ON storage.objects;
    DROP POLICY IF EXISTS member_photos_insert ON storage.objects;
    DROP POLICY IF EXISTS member_photos_update ON storage.objects;
    DROP POLICY IF EXISTS member_photos_delete ON storage.objects;
  END IF;
END
$$;
DROP FUNCTION IF EXISTS public.sync_member_number_seq();
DROP FUNCTION IF EXISTS public.register_member(jsonb);
DROP TABLE IF EXISTS public.member_details;
DROP FUNCTION IF EXISTS public.peek_next_member_number();
DROP FUNCTION IF EXISTS public.next_member_number();
DROP SEQUENCE IF EXISTS public.member_number_seq;
DROP TABLE IF EXISTS public.church_settings;
