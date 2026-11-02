// Teaching & Seminar values shared by the API schemas (lib/api/schemas.ts) and the teaching page. No server code here.

import { choiceValues } from './options'

export const PROGRAM_TYPES = [
  { value: 'course', label: 'Course' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'bible_study', label: 'Bible study' },
] as const
export const PROGRAM_TYPE_VALUES = choiceValues(PROGRAM_TYPES)

export const MATERIAL_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'link', label: 'Link' },
] as const
export const MATERIAL_TYPE_VALUES = choiceValues(MATERIAL_TYPES)

/** education_enrollments.status; the column defaults to 'active'. */
export const ENROLLMENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
] as const
export const ENROLLMENT_STATUS_VALUES = choiceValues(ENROLLMENT_STATUSES)
