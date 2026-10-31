import { z } from 'zod'

// Field configuration for EntityFormDialog (components/app/entity-form-dialog.tsx): one list of fields
// describes the inputs, the browser-side checks and the payload sent to the API. The API's strict zod
// schema stays the authority; these checks only catch mistakes before a round trip.

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'url' | 'select' | 'member' | 'checkbox'
export type FieldOption = { value: string; label: string }

export type FieldConfig = {
  /** The API field (column) name. */
  name: string
  label: string
  type: FieldType
  required?: boolean
  /** select: the choices; plain strings are used as both value and label. */
  options?: readonly (FieldOption | string)[]
  placeholder?: string
  /** A hint under the input. */
  help?: string
  /** text/textarea/url: longest accepted text (default 200, textarea 5000). */
  maxLength?: number
  /** number: whole numbers only unless `step` allows decimals. */
  min?: number
  max?: number
  step?: number
  /** Shown only when adding (e.g. the member a row is about, who can't change afterwards). */
  createOnly?: boolean
  /** Value for a new row. */
  defaultValue?: string | boolean
  /** 'half' fields sit two to a row from the sm breakpoint. */
  width?: 'full' | 'half'
}

export type FormMode = 'create' | 'edit'
export type FormValues = Record<string, string | boolean>

export const optionsOf = (f: Pick<FieldConfig, 'options'>): FieldOption[] =>
  (f.options ?? []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))

export const visibleFields = (fields: readonly FieldConfig[], mode: FormMode) =>
  fields.filter((f) => mode === 'create' || !f.createOnly)

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}(:\d{2})?$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function fieldSchema(f: FieldConfig): z.ZodTypeAny {
  if (f.type === 'checkbox') return z.boolean()
  const max = f.maxLength ?? (f.type === 'textarea' ? 5000 : 200)
  const base = z.string().trim().max(max, `Use at most ${max} characters`)
  const filled = f.required ? base.min(1, `${f.label} is required`) : base
  return filled.superRefine((v, ctx) => {
    if (!v) return
    const problem = (message: string) => ctx.addIssue({ code: 'custom', message })
    switch (f.type) {
      case 'number': {
        const n = Number(v)
        if (!Number.isFinite(n)) return problem('Enter a number')
        if (!f.step && !Number.isInteger(n)) return problem('Enter a whole number')
        if (f.min !== undefined && n < f.min) return problem(`Enter ${f.min} or more`)
        if (f.max !== undefined && n > f.max) return problem(`Enter ${f.max} or less`)
        return
      }
      case 'date': return DATE.test(v) ? undefined : problem('Enter a date')
      case 'time': return TIME.test(v) ? undefined : problem('Enter a time')
      case 'url': return z.string().url().safeParse(v).success ? undefined : problem('Enter a full web address (https://…)')
      case 'member': return UUID.test(v) ? undefined : problem('Choose a member from the list')
      case 'select': return optionsOf(f).some((o) => o.value === v) ? undefined : problem('Choose one of the options')
    }
  })
}

/** The browser-side schema for the fields shown in this mode. */
export function formSchema(fields: readonly FieldConfig[], mode: FormMode) {
  return z.object(Object.fromEntries(visibleFields(fields, mode).map((f) => [f.name, fieldSchema(f)])))
}

/** Initial input values: the row's values when editing, defaults when adding. */
export function initialValues(fields: readonly FieldConfig[], mode: FormMode, row?: Record<string, unknown> | null): FormValues {
  const values: FormValues = {}
  for (const f of visibleFields(fields, mode)) {
    const current = mode === 'edit' ? row?.[f.name] : undefined
    if (f.type === 'checkbox') values[f.name] = typeof current === 'boolean' ? current : f.defaultValue === true
    else if (current === null || current === undefined) values[f.name] = mode === 'create' && typeof f.defaultValue === 'string' ? f.defaultValue : ''
    else values[f.name] = f.type === 'time' ? String(current).slice(0, 5) : String(current)
  }
  return values
}

/**
 * Input values → the API payload: trimmed text, numbers as numbers. An empty input is left out when
 * adding (so the column's default applies, e.g. join_date = today) and sent as null when editing (clears it).
 */
export function toPayload(fields: readonly FieldConfig[], mode: FormMode, values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const f of visibleFields(fields, mode)) {
    const v = values[f.name]
    if (f.type === 'checkbox') { payload[f.name] = v === true; continue }
    const s = typeof v === 'string' ? v.trim() : ''
    if (s === '') { if (mode === 'edit') payload[f.name] = null; continue }
    payload[f.name] = f.type === 'number' ? Number(s) : s
  }
  return payload
}
