import type { Tables } from '@/lib/database.types'

// The members directory (members page, member pickers): one definition for what GET /api/members
// selects and what the browser receives. No server code here, so client components can import it.

/** The profile, its registry record (lebu-form register) and its ministry memberships. */
export const DIRECTORY_SELECT =
  '*, member_details!member_details_member_id_fkey(member_number, spouse_name, children_count, emergency_name, emergency_phone, emergency_relationship), ministry_members!ministry_members_member_id_fkey(is_active, ministry:ministries(name))'

type Registry = Pick<
  Tables<'member_details'>,
  'member_number' | 'spouse_name' | 'children_count' | 'emergency_name' | 'emergency_phone' | 'emergency_relationship'
>

export type DirectoryMember = Tables<'profiles'> & {
  /** null for people who were never registered, and for readers RLS hides the registry from (finance). */
  member_details: Registry | null
  ministry_members: { is_active: boolean | null; ministry: { name: string } | null }[]
}

export const DIRECTORY_PAGE_SIZE = 50

const SEARCH_COLUMNS = ['first_name', 'last_name', 'email', 'phone'] as const
const MAX_SEARCH_WORDS = 5

/**
 * PostgREST `or` filters for a directory search, one per word; the API applies them all, so every
 * word must match a name, the email or the phone ("abeba 0911" finds Abeba with that number).
 * Pass text already cleaned by cleanSearch (lib/api/validation.ts), which drops , ( ) % and *.
 */
export function directoryFilters(search: string | null | undefined): string[] {
  const words = (search ?? '').split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_WORDS)
  return words.map((word) => SEARCH_COLUMNS.map((column) => `${column}.ilike.%${word}%`).join(','))
}

export const memberName = (m: Pick<Tables<'profiles'>, 'first_name' | 'last_name'>) =>
  [m.first_name, m.last_name].map((s) => s?.trim()).filter(Boolean).join(' ') || 'Unnamed member'

/** Names of the ministries the member currently serves in. */
export const activeMinistries = (m: Pick<DirectoryMember, 'ministry_members'>) =>
  (m.ministry_members ?? []).flatMap((mm) => (mm.is_active !== false && mm.ministry ? [mm.ministry.name] : []))

/** Footer text such as "1–50 of 123". */
export function rangeLabel(offset: number, shown: number, total: number) {
  if (shown === 0) return `0 of ${total}`
  return `${offset + 1}–${offset + shown} of ${Math.max(total, offset + shown)}`
}

/** A date column (YYYY-MM-DD) as "12 Mar 1990", the same day in every time zone. */
export function formatDate(value: string | null | undefined) {
  if (!value) return null
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(d)
}

/** Profile fields the edit dialog changes; all of them are in profileUpdate (lib/api/schemas.ts). */
export const EDIT_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'address'] as const
export type EditField = (typeof EDIT_FIELDS)[number]
export type EditValues = Record<EditField, string>

export const toEditValues = (m: Pick<Tables<'profiles'>, EditField>): EditValues =>
  Object.fromEntries(EDIT_FIELDS.map((k) => [k, m[k] ?? ''])) as EditValues

/** Only the fields the user changed (trimmed), so saving never rewrites a field nobody touched. */
export function changedFields(before: EditValues, after: EditValues): Partial<EditValues> {
  const changes: Partial<EditValues> = {}
  for (const k of EDIT_FIELDS) {
    if (after[k].trim() !== before[k].trim()) changes[k] = after[k].trim()
  }
  return changes
}
