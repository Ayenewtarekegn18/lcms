// Youth Ministry values shared by the API schemas (lib/api/schemas.ts) and the youth page. No server code here.

export const YOUTH_PROGRAM_TYPES = ['bible_study', 'worship', 'fellowship', 'conference', 'retreat', 'outreach', 'sports', 'other'] as const
export type YouthProgramType = (typeof YOUTH_PROGRAM_TYPES)[number]
const PROGRAM_TYPE_LABELS: Record<YouthProgramType, string> = {
  bible_study: 'Bible study',
  worship: 'Worship',
  fellowship: 'Fellowship',
  conference: 'Conference',
  retreat: 'Retreat',
  outreach: 'Outreach',
  sports: 'Sports',
  other: 'Other',
}
export const YOUTH_PROGRAM_TYPE_OPTIONS = YOUTH_PROGRAM_TYPES.map((value) => ({ value, label: PROGRAM_TYPE_LABELS[value] }))
/** A program type in words; values typed in before the list existed are shown as they are. */
export const programTypeLabel = (type: string | null | undefined) =>
  type ? PROGRAM_TYPE_LABELS[type as YouthProgramType] ?? type : null
