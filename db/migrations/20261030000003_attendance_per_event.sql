-- migrate:up
-- Attendance is taken per event (remediation step 2.5, finding F-21). The baseline's
-- UNIQUE (member_id, event_type, attendance_date) predates attendance_records.event_id (20261019000005):
-- two events of the same type on one day share a single record per member, so saving the second event
-- would overwrite the first one's record or be refused. Every event the calendar creates has the type
-- 'event', so this happens whenever two events fall on the same day.
-- Now a member has one record per event and day (a multi-day event takes attendance on each of its days),
-- which is also what POST /api/attendance upserts on. Records without an event keep the old rule.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.attendance_records WHERE event_id IS NOT NULL
              GROUP BY event_id, attendance_date, member_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'attendance_records has more than one record per member, event and day: merge them first';
  END IF;
END
$$;
ALTER TABLE public.attendance_records DROP CONSTRAINT attendance_records_member_id_event_type_attendance_date_key;
ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_event_day_member_key UNIQUE (event_id, attendance_date, member_id);
CREATE UNIQUE INDEX attendance_records_no_event_key
  ON public.attendance_records (member_id, event_type, attendance_date) WHERE event_id IS NULL;

-- migrate:down
-- Fails if a member now has records for two events of the same type on one day: remove one of them first.
DROP INDEX IF EXISTS public.attendance_records_no_event_key;
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_event_day_member_key;
ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_member_id_event_type_attendance_date_key UNIQUE (member_id, event_type, attendance_date);
