import { z } from 'zod'
import { opt, text, uuid, date, time, count } from '@/lib/api/validation'
import { MINISTRY_ROLES } from '@/lib/ministries/workspace'
import { CHOIR_SCHEDULE_TYPES, VOICE_PARTS } from '@/lib/ministries/choir'

// Request schemas shared by several routes. Route files may only export HTTP handlers,
// so shared schemas live here. Every object is .strict(): unknown keys are rejected.

const notes = z.string().trim().max(5000)

/** Fields a user may change on their own profile; role, is_admin, is_active and id are not among them. */
export const profileUpdate = z
  .object({
    first_name: text(100),
    last_name: z.string().trim().max(100),
    email: opt(z.string().trim().email().max(200)),
    phone: opt(z.string().trim().max(30)),
    address: opt(z.string().trim().max(300)),
    city: opt(z.string().trim().max(100)),
    country: opt(z.string().trim().max(100)),
    gender: opt(z.string().trim().max(20)),
    date_of_birth: opt(date),
  })
  .partial()
  .strict()

export const womenMeeting = z
  .object({
    title: text(200),
    meeting_date: date,
    meeting_time: opt(time),
    location: opt(z.string().trim().max(200)),
    attendees_count: opt(count),
    minutes_text: opt(z.string().trim().max(20000)),
  })
  .strict()

export const womenActivity = z
  .object({
    title: text(200),
    activity_date: opt(date),
    status: opt(z.enum(['proposed', 'planned', 'completed'])),
    volunteers_count: opt(count),
  })
  .strict()

export const womenTraining = z
  .object({
    title: text(200),
    training_date: opt(date),
    instructor_name: opt(z.string().trim().max(200)),
    description: opt(notes),
    registered_count: opt(count),
  })
  .strict()

export const spiritualClass = z
  .object({
    title: text(200),
    class_date: date,
    instructor_id: opt(uuid),
    location: opt(z.string().trim().max(200)),
    max_attendees: opt(count),
  })
  .strict()

export const spiritualFollowUp = z
  .object({
    member_id: uuid,
    follow_up_type: z.enum(['post_salvation', 'post_baptism']),
    last_contact_date: opt(date),
    notes: opt(notes),
    status: opt(z.enum(['ongoing', 'completed'])),
  })
  .strict()

export const spiritualCandidate = z
  .object({
    member_id: uuid,
    status: opt(z.enum(['salvation_candidate', 'baptism_ready', 'baptized'])),
    mentor_id: opt(uuid),
    progress_notes: opt(notes),
    joined_date: opt(date),
    baptism_date: opt(date),
  })
  .strict()

export const baptism = z
  .object({
    baptism_date: date,
    member_id: uuid,
    officiating_elder_id: opt(uuid),
    location: opt(z.string().trim().max(200)),
    notes: opt(notes),
  })
  .strict()

// Ministry workspaces (docs/MINISTRY_WORKSPACES.md) ---------------------------------------------

/** leader | co_leader | member; older spellings such as 'Member' or 'Co-Leader' are accepted. */
const ministryRole = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/[\s-]+/g, '_') : v),
  z.enum(MINISTRY_ROLES),
)

/** POST /api/ministry-members: add someone from the member register (re-adding a removed member reactivates them). */
export const ministryMembershipCreate = z
  .object({ ministry_id: uuid, member_id: uuid, role: ministryRole.default('member'), joined_date: opt(date) })
  .strict()

/** PATCH /api/ministry-members/[id] */
export const ministryMembershipUpdate = z
  .object({ role: ministryRole, joined_date: opt(date), is_active: z.boolean() })
  .partial()
  .strict()

const choirMemberFields = {
  member_id: uuid,
  voice_part: opt(z.enum(VOICE_PARTS)),
  join_date: opt(date),
  is_active: z.boolean().optional(),
}
/** POST /api/choir-members (one row per person: choir_members.member_id is unique). */
export const choirMemberCreate = z.object(choirMemberFields).strict()
/** PATCH /api/choir-members/[id]: the person can't change, the rest can. */
export const choirMemberUpdate = z.object(choirMemberFields).omit({ member_id: true }).partial().strict()

const choirSongFields = {
  title: text(200),
  composer: opt(z.string().trim().max(200)),
  lyrics_url: opt(z.string().trim().url().max(500)),
}
export const choirSongCreate = z.object(choirSongFields).strict()
export const choirSongUpdate = z.object(choirSongFields).partial().strict()

const choirScheduleFields = {
  event_date: date,
  event_type: opt(z.enum(CHOIR_SCHEDULE_TYPES)),
  location: opt(z.string().trim().max(200)),
  notes: opt(notes),
}
export const choirScheduleCreate = z.object(choirScheduleFields).strict()
export const choirScheduleUpdate = z.object(choirScheduleFields).partial().strict()
