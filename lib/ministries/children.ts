// Children's Ministry values shared by the API schemas (lib/api/schemas.ts) and the children page,
// plus the class register helper. No server code here.

export const TEACHER_ROLES = ['lead', 'assistant', 'helper'] as const
export type TeacherRole = (typeof TEACHER_ROLES)[number]
const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = { lead: 'Lead teacher', assistant: 'Assistant', helper: 'Helper' }
export const TEACHER_ROLE_OPTIONS = TEACHER_ROLES.map((value) => ({ value, label: TEACHER_ROLE_LABELS[value] }))
/** A teacher's role in words; values typed in before the list existed are shown as they are. */
export const teacherRoleLabel = (role: string | null | undefined) =>
  role ? TEACHER_ROLE_LABELS[role as TeacherRole] ?? role : null

export const ATTENDANCE_STATUSES = ['present', 'absent'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

type Person = { id: string; first_name: string; last_name: string }
/** A children_attendance row as GET /api/children-attendance returns it (with the child's name). */
export type AttendanceRow = {
  id: string
  class_id: string
  member_id: string
  attendance_date: string
  status: string | null
  member: Person | null
}

/** One child on the register for a day: their mark, or none yet. */
export type RegisterEntry = {
  member: Person
  /** The children_attendance row for this day, if the child has been marked. */
  record: { id: string; status: AttendanceStatus } | null
  /** The last day before this one the child was marked in this class. */
  lastSeen: string | null
}

const sortName = (p: Person) => `${p.first_name} ${p.last_name}`.toLocaleLowerCase()

/**
 * The register for one class on one day, from that class's attendance rows: every child marked on the
 * day, plus every child marked on an earlier day (not yet marked, so the class list carries over
 * from week to week). Sorted by name. Rows for other classes are ignored.
 */
export function buildRegister(rows: readonly AttendanceRow[], classId: string, date: string): RegisterEntry[] {
  const byMember = new Map<string, RegisterEntry>()
  for (const row of rows) {
    if (row.class_id !== classId || !row.member) continue
    const entry = byMember.get(row.member_id) ?? { member: row.member, record: null, lastSeen: null }
    if (row.attendance_date === date) {
      entry.record = { id: row.id, status: row.status === 'absent' ? 'absent' : 'present' }
    } else if (row.attendance_date < date && (!entry.lastSeen || row.attendance_date > entry.lastSeen)) {
      entry.lastSeen = row.attendance_date
    }
    byMember.set(row.member_id, entry)
  }
  // A child first marked after this day isn't on this day's list unless marked on it.
  return [...byMember.values()]
    .filter((e) => e.record || e.lastSeen)
    .sort((a, b) => sortName(a.member).localeCompare(sortName(b.member)))
}

/** Present / absent / not yet marked, for the register's summary line. */
export function registerCounts(entries: readonly RegisterEntry[]) {
  let present = 0
  let absent = 0
  for (const e of entries) {
    if (e.record?.status === 'present') present++
    else if (e.record?.status === 'absent') absent++
  }
  return { present, absent, unmarked: entries.length - present - absent }
}

/** Today as YYYY-MM-DD in the browser's time zone (a class meets on a local day). */
export function localToday(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
