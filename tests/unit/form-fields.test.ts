import { describe, expect, it } from 'vitest'
import { formSchema, initialValues, optionsOf, toPayload, visibleFields, type FieldConfig } from '@/lib/forms/fields'

const ID = '00000000-0000-4000-8000-000000000001'
const fields: FieldConfig[] = [
  { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true },
  { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 10 },
  { name: 'voice_part', label: 'Voice part', type: 'select', options: ['Alto', { value: 'bass', label: 'Bass' }] },
  { name: 'count', label: 'Count', type: 'number', min: 1, max: 5 },
  { name: 'day', label: 'Day', type: 'date' },
  { name: 'at', label: 'At', type: 'time' },
  { name: 'link', label: 'Link', type: 'url' },
  { name: 'is_active', label: 'Active', type: 'checkbox', defaultValue: true },
]

describe('field config', () => {
  it('normalizes options and hides create-only fields when editing', () => {
    expect(optionsOf(fields[2])).toEqual([{ value: 'Alto', label: 'Alto' }, { value: 'bass', label: 'Bass' }])
    expect(visibleFields(fields, 'edit').map((f) => f.name)).not.toContain('member_id')
    expect(visibleFields(fields, 'create').map((f) => f.name)).toContain('member_id')
  })

  it('starts a new row from defaults and an edited row from its values', () => {
    expect(initialValues(fields, 'create')).toMatchObject({ member_id: '', title: '', is_active: true })
    const row = { title: 'Hymn', count: 3, at: '15:00:00', is_active: false, day: null }
    expect(initialValues(fields, 'edit', row)).toEqual({ title: 'Hymn', voice_part: '', count: '3', day: '', at: '15:00', link: '', is_active: false })
  })

  it('checks each type in the browser', () => {
    const schema = formSchema(fields, 'create')
    const ok = { member_id: ID, title: 'Hymn', voice_part: 'bass', count: '2', day: '2026-11-01', at: '09:30', link: 'https://example.org', is_active: true }
    expect(schema.safeParse(ok).success).toBe(true)
    const bad = schema.safeParse({ ...ok, member_id: '', title: 'x'.repeat(11), voice_part: 'Tenor', count: '2.5', day: 'today', at: '9', link: 'example', is_active: true })
    expect(bad.success).toBe(false)
    const problems = Object.fromEntries(bad.error!.issues.map((i) => [i.path[0], i.message]))
    expect(problems).toEqual({
      member_id: 'Member is required',
      title: 'Use at most 10 characters',
      voice_part: 'Choose one of the options',
      count: 'Enter a whole number',
      day: 'Enter a date',
      at: 'Enter a time',
      link: 'Enter a full web address (https://…)',
    })
    expect(schema.safeParse({ ...ok, count: '9' }).success).toBe(false)
  })

  it('builds the payload: numbers as numbers, empty inputs left out when adding and cleared when editing', () => {
    const values = { member_id: ID, title: ' Hymn ', voice_part: '', count: '2', day: '', at: '', link: '', is_active: false }
    expect(toPayload(fields, 'create', values)).toEqual({ member_id: ID, title: 'Hymn', count: 2, is_active: false })
    expect(toPayload(fields, 'edit', values)).toEqual({ title: 'Hymn', voice_part: null, count: 2, day: null, at: null, link: null, is_active: false })
  })
})
