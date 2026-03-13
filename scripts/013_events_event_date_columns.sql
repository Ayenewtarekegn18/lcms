-- Add event_date and event_time to events for calendar/events UI compatibility.
-- If your table already has start_date only, this adds the new columns.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS event_time TEXT;

-- Backfill from start_date if needed (optional)
UPDATE public.events
SET event_date = (start_date AT TIME ZONE 'UTC')::date,
    event_time = to_char(start_date AT TIME ZONE 'UTC', 'HH24:MI')
WHERE event_date IS NULL AND start_date IS NOT NULL;

-- Allow organizer_id to be nullable for simpler inserts (optional; skip if you want NOT NULL)
-- ALTER TABLE public.events ALTER COLUMN organizer_id DROP NOT NULL;
