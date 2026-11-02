import { z } from 'zod'
import { opt, text, uuid, date, time, count } from '@/lib/api/validation'
import { MINISTRY_ROLES } from '@/lib/ministries/workspace'
import { CHOIR_SCHEDULE_TYPES, VOICE_PARTS } from '@/lib/ministries/choir'
import { amount } from '@/lib/api/validation'
import { SUPPORT_CASE_STATUSES } from '@/lib/ministries/deacons'
import { BENEFICIARY_STATUSES } from '@/lib/ministries/workers-aid'

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

// ── Administration and Charity (ministry workspaces) ─────────────────────────────────────────────
import { amount } from '@/lib/api/validation'
import { TASK_STATUSES } from '@/lib/ministries/administration'
import { AID_STATUSES } from '@/lib/ministries/charity'

/** Birr amounts in DECIMAL(10,2) columns. */
const birr = amount.max(99_999_999.99)

const adminTaskFields = {
  title: text(200),
  assigned_to_id: opt(uuid),
  due_date: opt(date),
  status: z.enum(TASK_STATUSES).optional(),
  notes: opt(notes),
}
/** POST /api/admin-tasks */
export const adminTaskCreate = z.object(adminTaskFields).strict()
/** PATCH /api/admin-tasks/[id] */
export const adminTaskUpdate = z.object(adminTaskFields).partial().strict()

const charityAidRequestFields = {
  member_id: uuid,
  request_date: opt(date),
  amount_requested: opt(birr),
  reason: opt(notes),
  status: z.enum(AID_STATUSES).optional(),
}
/** POST /api/charity-aid-requests; reviewed_by_id and reviewed_at are set by the server, never sent. */
export const charityAidRequestCreate = z.object(charityAidRequestFields).strict()
/** PATCH /api/charity-aid-requests/[id]: the member can't change, the rest can. */
export const charityAidRequestUpdate = z.object(charityAidRequestFields).omit({ member_id: true }).partial().strict()

const charityDistributionFields = {
  request_id: uuid,
  distributed_date: date,
  amount: birr,
  notes: opt(notes),
}
/** POST /api/charity-distributions (the request must be approved or paid). */
export const charityDistributionCreate = z.object(charityDistributionFields).strict()
/** PATCH /api/charity-distributions/[id]: the request can't change, the rest can. */
export const charityDistributionUpdate = z.object(charityDistributionFields).omit({ request_id: true }).partial().strict()

// Children's Ministry and Youth Ministry (docs/MINISTRY_WORKSPACES.md) ------------------------------
// (imports kept with this block so the ministries' additions don't collide at the top of the file)
import { ATTENDANCE_STATUSES, TEACHER_ROLES } from '@/lib/ministries/children'
import { YOUTH_PROGRAM_TYPES } from '@/lib/ministries/youth'

const childrenClassFields = {
  name: text(200),
  age_group: opt(z.string().trim().max(50)),
  schedule_text: opt(z.string().trim().max(200)),
  location: opt(z.string().trim().max(200)),
}
export const childrenClassCreate = z.object(childrenClassFields).strict()
export const childrenClassUpdate = z.object(childrenClassFields).partial().strict()

/** POST /api/children-class-teachers (one row per person and class: (class_id, member_id) is unique). */
export const childrenTeacherCreate = z
  .object({ class_id: uuid, member_id: uuid, role: opt(z.enum(TEACHER_ROLES)) })
  .strict()
/** PATCH /api/children-class-teachers/[id]: the person can't change; the class and role can. */
export const childrenTeacherUpdate = z
  .object({ class_id: uuid, role: opt(z.enum(TEACHER_ROLES)) })
  .partial()
  .strict()

const childrenCurriculumFields = {
  class_id: opt(uuid),
  title: text(200),
  description: opt(notes),
  url: opt(z.string().trim().url().max(500)),
}
export const childrenCurriculumCreate = z.object(childrenCurriculumFields).strict()
export const childrenCurriculumUpdate = z.object(childrenCurriculumFields).partial().strict()

/** POST /api/children-attendance: mark a child on a day (marking again changes the mark). */
export const childrenAttendanceCreate = z
  .object({ class_id: uuid, member_id: uuid, attendance_date: date, status: z.enum(ATTENDANCE_STATUSES).default('present') })
  .strict()
/** PATCH /api/children-attendance/[id]: only the mark changes. */
export const childrenAttendanceUpdate = z.object({ status: z.enum(ATTENDANCE_STATUSES) }).strict()

const youthProgramFields = {
  name: text(200),
  description: opt(notes),
  age_range: opt(z.string().trim().max(50)),
  program_date: date,
  location: opt(z.string().trim().max(200)),
  leader_id: opt(uuid),
  max_participants: opt(z.number().int().min(1).max(100_000)),
  program_type: opt(z.enum(YOUTH_PROGRAM_TYPES)),
  is_active: z.boolean().optional(),
}
export const youthProgramCreate = z.object(youthProgramFields).strict()
export const youthProgramUpdate = z.object(youthProgramFields).partial().strict()

/** POST /api/youth-mentorship (one mentor per young person: youth_mentorship.mentee_id is unique). */
export const youthMentorshipCreate = z
  .object({ mentee_id: uuid, mentor_id: uuid, start_date: opt(date), notes: opt(notes), is_active: z.boolean().optional() })
  .strict()
  .refine((m) => m.mentee_id !== m.mentor_id, { message: 'Choose someone other than the mentee', path: ['mentor_id'] })
/** PATCH /api/youth-mentorship/[id]: the pair can't change; the start date, notes and active flag can. */
export const youthMentorshipUpdate = z
  .object({ start_date: opt(date), notes: opt(notes), is_active: z.boolean() })
  .partial()
  .strict()

// ── Deacons and Monthly Workers Aid (confidential tables: admin and elder only) ──────────────────────

const careVisitFields = {
  member_id: uuid,
  visit_date: date,
  notes: opt(notes),
}
/** POST /api/deacon-care-visits; visitor_id is the signed-in user (set by the route, never sent). */
export const deaconCareVisitCreate = z.object(careVisitFields).strict()
/** PATCH /api/deacon-care-visits/[id]: who was visited stays; date and notes can change. */
export const deaconCareVisitUpdate = z.object(careVisitFields).omit({ member_id: true }).partial().strict()

const supportCaseFields = {
  member_id: uuid,
  case_type: opt(z.string().trim().max(100)),
  description: text(5000),
  status: opt(z.enum(SUPPORT_CASE_STATUSES)),
  assigned_deacon_id: opt(uuid),
}
export const deaconSupportCaseCreate = z.object(supportCaseFields).strict()
export const deaconSupportCaseUpdate = z.object(supportCaseFields).omit({ member_id: true }).partial().strict()

const beneficiaryFields = {
  member_id: uuid,
  monthly_amount: amount,
  start_date: opt(date),
  status: opt(z.enum(BENEFICIARY_STATUSES)),
  notes: opt(notes),
}
/** POST /api/workers-aid-beneficiaries (one row per person: member_id is unique). */
export const workersAidBeneficiaryCreate = z.object(beneficiaryFields).strict()
export const workersAidBeneficiaryUpdate = z
  .object({ ...beneficiaryFields, start_date: date })
  .omit({ member_id: true })
  .partial()
  .strict()

const disbursementFields = {
  beneficiary_id: uuid,
  disbursement_date: date,
  amount,
  notes: opt(notes),
}
export const workersAidDisbursementCreate = z.object(disbursementFields).strict()
export const workersAidDisbursementUpdate = z.object(disbursementFields).omit({ beneficiary_id: true }).partial().strict()
/** POST /api/workers-aid-disbursements/months: pay every active beneficiary not yet paid in that date's month. */
export const workersAidMonthlyRun = z.object({ disbursement_date: date }).strict()

// ---- Mission and Prayer Groups ministries (app/dashboard/ministry/mission, …/prayer-groups) ----
// The imports sit with this block so it merges cleanly beside the other ministries' blocks.
import { MISSION_TRIP_STATUSES } from '@/lib/ministries/mission'
import { PRAYER_REQUEST_STATUSES } from '@/lib/ministries/prayer'

const missionTripFields = {
  title: text(200),
  trip_date: opt(date),
  location: opt(z.string().trim().max(200)),
  description: opt(notes),
  status: opt(z.enum(MISSION_TRIP_STATUSES)),
}
/** POST /api/mission-trips (status defaults to 'planned'). */
export const missionTripCreate = z.object(missionTripFields).strict()
export const missionTripUpdate = z.object(missionTripFields).partial().strict()

/** POST /api/mission-trip-participants: one row per person and trip (trip_id, member_id is unique). */
export const missionParticipantCreate = z
  .object({ trip_id: uuid, member_id: uuid, role: opt(z.string().trim().max(100)) })
  .strict()
/** PATCH /api/mission-trip-participants/[id]: the trip and the person can't change, their role can. */
export const missionParticipantUpdate = z.object({ role: opt(z.string().trim().max(100)) }).strict()

const missionReportFields = { trip_id: uuid, report_text: text(20000), report_date: opt(date) }
/** POST /api/mission-reports (created_by_id is the signed-in user; report_date defaults to today). */
export const missionReportCreate = z.object(missionReportFields).strict()
export const missionReportUpdate = z.object(missionReportFields).partial().strict()

const prayerGroupFields = {
  name: text(200),
  description: opt(notes),
  meeting_schedule: opt(z.string().trim().max(200)),
}
export const prayerGroupCreate = z.object(prayerGroupFields).strict()
export const prayerGroupUpdate = z.object(prayerGroupFields).partial().strict()

/** POST /api/prayer-requests (requested_by_id is the signed-in user; a new request is open). */
export const prayerRequestCreate = z
  .object({
    group_id: opt(uuid),
    request_text: text(5000),
    status: z.enum(PRAYER_REQUEST_STATUSES).default('open'),
  })
  .strict()
/** PATCH /api/prayer-requests/[id] (pastors and elders only). */
export const prayerRequestUpdate = z
  .object({ group_id: opt(uuid), request_text: text(5000), status: z.enum(PRAYER_REQUEST_STATUSES) })
  .partial()
  .strict()
