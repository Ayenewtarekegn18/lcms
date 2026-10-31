import { DEFAULT_EVENT_TYPE, eventCreate, type EventItem, type EventPayload } from '@/lib/events/schema'
import { toFormParts, toInstant } from '@/lib/events/time'

// The add/edit event form (events page and calendar). Values are what the inputs hold; the payload
// is what the API takes, checked with the API's own schema before it's sent.

export type EventFormValues = {
  title: string
  event_type: string
  date: string
  time: string
  end_date: string
  end_time: string
  location: string
  ministry_id: string
  max_attendees: string
  description: string
}
export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>

export const FIELD_LIMITS = { title: 200, location: 200, description: 5000 } as const

export function emptyEventForm(date: string): EventFormValues {
  return {
    title: '', event_type: 'Service', date, time: '09:00', end_date: '', end_time: '',
    location: '', ministry_id: '', max_attendees: '', description: '',
  }
}

/** An event → form values in the user's time zone. An end on the start day leaves "End date" empty. */
export function eventToForm(e: EventItem): EventFormValues {
  const start = toFormParts(e.start_date)
  const end = toFormParts(e.end_date)
  return {
    title: e.title,
    event_type: e.event_type || DEFAULT_EVENT_TYPE,
    date: start.date,
    time: start.time,
    end_date: end.date && end.date !== start.date ? end.date : '',
    end_time: end.time,
    location: e.location ?? '',
    ministry_id: e.ministry_id ?? '',
    max_attendees: e.max_attendees == null ? '' : String(e.max_attendees),
    description: e.description ?? '',
  }
}

// Where an API field's problem shows on the form, and in what words.
const FIELDS: Partial<Record<string, [keyof EventFormValues, string]>> = {
  title: ['title', `Enter a title (at most ${FIELD_LIMITS.title} characters)`],
  event_type: ['event_type', 'Choose a type'],
  start_date: ['date', 'Enter a valid date and time'],
  location: ['location', `Use at most ${FIELD_LIMITS.location} characters`],
  ministry_id: ['ministry_id', 'Choose a ministry from the list'],
  max_attendees: ['max_attendees', 'Enter a whole number from 1 to 100,000'],
  description: ['description', `Use at most ${FIELD_LIMITS.description} characters`],
}

/** Form values → API payload, or the problems to show next to the fields. */
export function formToPayload(v: EventFormValues): { payload: EventPayload; errors: null } | { payload: null; errors: EventFormErrors } {
  const errors: EventFormErrors = {}
  if (!v.date) errors.date = 'Choose a date'
  if (!v.time) errors.time = 'Choose a start time'
  const start = v.date && v.time ? toInstant(v.date, v.time) : null
  if (v.date && v.time && !start) errors.date = 'Enter a valid date and time'

  // An end time alone ends the event on its start day; an end date needs a time.
  let end: string | null = null
  if (v.end_date && !v.end_time) errors.end_time = 'Choose an end time'
  else if (v.end_time && v.date) {
    end = toInstant(v.end_date || v.date, v.end_time)
    if (!end) errors.end_time = 'Enter a valid end date and time'
  }

  const max = v.max_attendees.trim()
  if (max && !/^\d+$/.test(max)) errors.max_attendees = 'Enter a whole number'

  const payload = {
    title: v.title.trim(),
    event_type: v.event_type.trim() || DEFAULT_EVENT_TYPE,
    start_date: start ?? '',
    end_date: end,
    location: v.location.trim() || null,
    ministry_id: v.ministry_id || null,
    max_attendees: max ? Number(max) : null,
    description: v.description.trim() || null,
  }
  const parsed = eventCreate.safeParse(payload)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      // the end rule's own message ("The end can't be before the start"), shown under the end time
      const [field, message] = key === 'end_date' ? ['end_time' as const, issue.message] : FIELDS[key] ?? []
      if (field && message && !errors[field]) errors[field] = message
    }
  }
  return Object.keys(errors).length ? { payload: null, errors } : { payload, errors: null }
}
