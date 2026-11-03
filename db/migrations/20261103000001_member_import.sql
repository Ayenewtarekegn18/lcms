-- migrate:up
-- Importing lebu-form records from the app (Members → Import): an admin may register a member under
-- the number they already have (LKHC-0019), as the service role always could. The number must look
-- like PREFIX-digits, and the sequence then moves past the highest number, so registrations after an
-- import never collide with it. The function's signature is unchanged (expand only).

-- sync_member_number_seq() checks the caller itself, so register_member() (which runs as the caller)
-- can use it for admins too.
CREATE OR REPLACE FUNCTION public.sync_member_number_seq()
RETURNS bigint
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only admins can move the member-number sequence' USING ERRCODE = '42501';
  END IF;
  RETURN setval('public.member_number_seq',
                greatest(coalesce((SELECT max(substring(d.member_number FROM '([0-9]+)$')::bigint)
                                     FROM public.member_details d), 0), 1),
                (SELECT count(*) > 0 FROM public.member_details));
END
$$;
REVOKE ALL ON FUNCTION public.sync_member_number_seq() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_member_number_seq() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.register_member(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  pid uuid;
  num text;
  -- An existing number (imports from lebu-form): the service role, or an admin signed in to the app.
  imported text := nullif(upper(btrim(payload ->> 'memberNumber')), '');
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only registrars can register members' USING ERRCODE = '42501';
  END IF;
  IF imported IS NOT NULL AND imported !~ '^[A-Z0-9]+-[0-9]+$' THEN
    RAISE EXCEPTION 'member number % is not like LKH-0001', imported USING ERRCODE = '22023';
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

  -- Registrations after an import continue after the highest number.
  IF imported IS NOT NULL THEN
    PERFORM public.sync_member_number_seq();
  END IF;

  RETURN jsonb_build_object('id', pid, 'member_number', num);
END
$$;

-- migrate:down
CREATE OR REPLACE FUNCTION public.sync_member_number_seq()
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

CREATE OR REPLACE FUNCTION public.register_member(payload jsonb)
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
