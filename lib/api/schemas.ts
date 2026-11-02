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

// Stage & Worship, Teaching & Seminar, Marriage & Family workspaces ---------------------------
// (imports kept with the block so the ministry blocks merge without touching the file's head)

import { EQUIPMENT_STATUS_VALUES, WORSHIP_TYPE_VALUES } from '@/lib/ministries/stage-worship'
import { ENROLLMENT_STATUS_VALUES, MATERIAL_TYPE_VALUES, PROGRAM_TYPE_VALUES } from '@/lib/ministries/teaching'

const place = z.string().trim().max(200)

const worshipTeamFields = { name: text(200), description: opt(notes) }
export const worshipTeamCreate = z.object(worshipTeamFields).strict()
export const worshipTeamUpdate = z.object(worshipTeamFields).partial().strict()

const worshipTeamMemberFields = { team_id: uuid, member_id: uuid, role: opt(z.string().trim().max(100)) }
/** POST /api/worship-team-members (one row per person and team: worship_team_members is unique on both). */
export const worshipTeamMemberCreate = z.object(worshipTeamMemberFields).strict()
/** PATCH /api/worship-team-members/[id]: the team and the person stay, the role can change. */
export const worshipTeamMemberUpdate = z.object(worshipTeamMemberFields).omit({ team_id: true, member_id: true }).partial().strict()

const worshipEventFields = {
  title: text(200),
  /** A day; worship_events.event_date is a timestamptz, stored as midnight UTC of that day. */
  event_date: date,
  worship_leader_id: opt(uuid),
  worship_type: opt(z.enum(WORSHIP_TYPE_VALUES)),
  description: opt(notes),
  location: opt(place),
  songs_list: opt(notes),
  notes: opt(notes),
}
export const worshipEventCreate = z.object(worshipEventFields).strict()
export const worshipEventUpdate = z.object(worshipEventFields).partial().strict()

const worshipRehearsalFields = { event_id: opt(uuid), rehearsal_date: date, notes: opt(notes) }
export const worshipRehearsalCreate = z.object(worshipRehearsalFields).strict()
export const worshipRehearsalUpdate = z.object(worshipRehearsalFields).partial().strict()

const worshipEquipmentFields = { name: text(200), description: opt(notes), status: opt(z.enum(EQUIPMENT_STATUS_VALUES)) }
export const worshipEquipmentCreate = z.object(worshipEquipmentFields).strict()
export const worshipEquipmentUpdate = z.object(worshipEquipmentFields).partial().strict()

const educationProgramFields = {
  title: text(200),
  description: opt(notes),
  instructor_id: opt(uuid),
  start_date: date,
  end_date: opt(date),
  duration_weeks: opt(z.number().int().min(1).max(520)),
  location: opt(place),
  max_capacity: opt(count),
  program_type: opt(z.enum(PROGRAM_TYPE_VALUES)),
  is_active: z.boolean().optional(),
}
/** Only checkable when both dates are in the request (an edit may send one of them). */
const endsAfterStart = (p: { start_date?: string | null; end_date?: string | null }) =>
  !p.start_date || !p.end_date || p.end_date >= p.start_date
const endsAfterStartIssue = { message: 'The end date is before the start date', path: ['end_date'] }
export const educationProgramCreate = z.object(educationProgramFields).strict().refine(endsAfterStart, endsAfterStartIssue)
export const educationProgramUpdate = z.object(educationProgramFields).partial().strict().refine(endsAfterStart, endsAfterStartIssue)

const teachingMaterialFields = {
  program_id: uuid,
  title: text(200),
  material_type: opt(z.enum(MATERIAL_TYPE_VALUES)),
  url: opt(z.string().trim().url().max(500)),
}
export const teachingMaterialCreate = z.object(teachingMaterialFields).strict()
export const teachingMaterialUpdate = z.object(teachingMaterialFields).partial().strict()

const educationEnrollmentFields = {
  program_id: uuid,
  member_id: uuid,
  enrollment_date: opt(date),
  status: opt(z.enum(ENROLLMENT_STATUS_VALUES)),
  completion_date: opt(date),
  grade: opt(z.string().trim().max(50)),
}
/** POST /api/education-enrollments (one row per person and program: the table is unique on both). */
export const educationEnrollmentCreate = z.object(educationEnrollmentFields).strict()
/** PATCH /api/education-enrollments/[id]: the program and the person stay, the rest can change. */
export const educationEnrollmentUpdate = z.object(educationEnrollmentFields).omit({ program_id: true, member_id: true }).partial().strict()

const marriageSeminarFields = { title: text(200), seminar_date: opt(date), location: opt(place), facilitator_id: opt(uuid) }
export const marriageSeminarCreate = z.object(marriageSeminarFields).strict()
export const marriageSeminarUpdate = z.object(marriageSeminarFields).partial().strict()
