// Member registration form, mirroring the lebu-form register the church already uses:
// same field keys, Amharic/English labels, options and rules, so lebu-form records import 1:1
// (scripts/import-lebu-form.mjs) and staff see the form they know. Client-safe (no server imports).
import { z } from 'zod'

export type Opt = readonly [value: string, am: string, en: string]

export const DEPARTMENTS: readonly Opt[] = [
  ['choir', 'መዘምራን', 'Choir'], ['worship', 'የአምልኮ ቡድን', 'Worship team'],
  ['children', 'የሕፃናት ክፍል', "Children's ministry"], ['youth', 'ወጣቶች', 'Youth'],
  ['women', 'ሴቶች', "Women's ministry"], ['men', 'ወንዶች', "Men's ministry"],
  ['teaching', 'አስተምህሮ', 'Teaching'], ['prayer', 'ጸሎት', 'Prayer'],
  ['evangelism', 'ወንጌል ስርጭት', 'Evangelism'], ['ushering', 'አቀባበልና ጽዳት', 'Ushering & hospitality'],
  ['media', 'ሚዲያና ድምፅ', 'Media & sound'], ['benevolence', 'ልማትና እርዳታ', 'Benevolence & development'],
]
/** Not a department: "I don't serve anywhere yet". Exclusive; reveals wantsDept. */
export const NOT_SERVING = 'none'
export const DEPTS_WITH_NONE: readonly Opt[] = [...DEPARTMENTS, [NOT_SERVING, 'አላገለግልም', 'Not currently serving']]

export const SECTIONS = [
  { id: 'personal', am: 'የግል መረጃ', en: 'Personal details', note: 'Write the Amharic name as it should appear on the ID card.' },
  { id: 'contact', am: 'አድራሻና ስልክ', en: 'Address & contact', note: 'Addis Ababa addresses follow sub-city → woreda → house number.' },
  { id: 'church', am: 'መንፈሳዊ መረጃ', en: 'Church & spiritual life', note: '' },
  { id: 'work', am: 'ትምህርትና ሥራ', en: 'Education & work', note: '' },
  { id: 'emergency', am: 'የአደጋ ጊዜ ተጠሪ', en: 'Emergency contact', note: 'Someone we can reach if the member needs help.' },
] as const
export type SectionId = (typeof SECTIONS)[number]['id']

export type FieldType = 'text' | 'radio' | 'date' | 'select' | 'number' | 'tel' | 'email' | 'textarea' | 'multi' | 'kids' | 'people'
export interface FieldDef {
  k: RegistrationKey
  sec: SectionId
  am: string
  en: string
  t: FieldType
  req?: boolean
  opts?: readonly Opt[]
  /** shown only while field [0] equals (or, for lists, contains) value [1] */
  showIf?: readonly [RegistrationKey, string]
  min?: number
  max?: number
  ph?: string
  /** show the Ethiopian-calendar date under the input */
  ec?: boolean
  /** span the full row */
  wide?: boolean
  /** suggest existing members while typing */
  ac?: boolean
}

const SEX: readonly Opt[] = [['male', 'ወንድ', 'Male'], ['female', 'ሴት', 'Female']]
const MARITAL: readonly Opt[] = [['single', 'ያላገባ/ች', 'Single'], ['married', 'ያገባ/ች', 'Married'], ['widowed', 'በሞት የተለየ/ች', 'Widowed'], ['divorced', 'የተፋታ/ች', 'Divorced']]
const BLOOD: readonly Opt[] = (['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const).map((b) => [b, b, b] as const)
const SUBCITIES: readonly Opt[] = [['nifas-silk', 'ንፋስ ስልክ ላፍቶ', 'Nifas Silk-Lafto'], ['akaki', 'አቃቂ ቃሊቲ', 'Akaki Kality'], ['bole', 'ቦሌ', 'Bole'],
  ['kirkos', 'ቂርቆስ', 'Kirkos'], ['lideta', 'ልደታ', 'Lideta'], ['addis-ketema', 'አዲስ ከተማ', 'Addis Ketema'],
  ['arada', 'አራዳ', 'Arada'], ['gulele', 'ጉለሌ', 'Gulele'], ['kolfe', 'ኮልፌ ቀራኒዮ', 'Kolfe Keranio'],
  ['yeka', 'የካ', 'Yeka'], ['lemi-kura', 'ለሚ ኩራ', 'Lemi Kura'], ['other', 'ሌላ', 'Other / outside Addis']]
const YES_NO_BAPTIZED: readonly Opt[] = [['yes', 'ተጠምቋል/ተጠምቃለች', 'Yes'], ['no', 'አልተጠመቀም/ችም', 'No']]
const STANDING: readonly Opt[] = [['member', 'አባል', 'Member'], ['deacon', 'ዲያቆን', 'Deacon'], ['elder', 'ሽማግሌ', 'Elder'], ['teacher', 'አስተማሪ', 'Teacher'],
  ['evangelist', 'ወንጌላዊ', 'Evangelist'], ['pastor', 'ፓስተር', 'Pastor'], ['board', 'የቦርድ አባል', 'Board member']]
const STATUS: readonly Opt[] = [['active', 'ንቁ', 'Active'], ['inactive', 'ንቁ ያልሆነ', 'Inactive']]
const EDUCATION: readonly Opt[] = [['primary', 'አንደኛ ደረጃ', 'Primary'], ['secondary', 'ሁለተኛ ደረጃ', 'Secondary'], ['tvet', 'ቴክኒክና ሙያ', 'TVET / Diploma'],
  ['degree', 'ዲግሪ', "Bachelor's degree"], ['masters', 'ማስተርስ', "Master's degree"], ['phd', 'ዶክትሬት', 'Doctorate'],
  ['none', 'መደበኛ ትምህርት የለም', 'No formal schooling']]

export const FIELDS: readonly FieldDef[] = [
  { k: 'firstNameAm', sec: 'personal', am: 'ስም', en: 'First name', t: 'text', req: true },
  { k: 'fatherNameAm', sec: 'personal', am: 'የአባት ስም', en: "Father's name", t: 'text', req: true },
  { k: 'gfNameAm', sec: 'personal', am: 'የአያት ስም', en: "Grandfather's name", t: 'text' },
  { k: 'sex', sec: 'personal', am: 'ጾታ', en: 'Sex', t: 'radio', req: true, opts: SEX },
  { k: 'dob', sec: 'personal', am: 'የትውልድ ቀን', en: 'Date of birth', t: 'date', ec: true },
  { k: 'marital', sec: 'personal', am: 'የጋብቻ ሁኔታ', en: 'Marital status', t: 'select', opts: MARITAL },
  { k: 'spouse', sec: 'personal', am: 'የትዳር አጋር ስም', en: "Spouse's name", t: 'text', showIf: ['marital', 'married'], ac: true },
  { k: 'spouseAge', sec: 'personal', am: 'የትዳር አጋር ዕድሜ', en: "Spouse's age", t: 'number', min: 0, max: 120, showIf: ['marital', 'married'] },
  { k: 'spousePhone', sec: 'personal', am: 'የትዳር አጋር ስልክ', en: "Spouse's phone", t: 'tel', showIf: ['marital', 'married'] },
  { k: 'children', sec: 'personal', am: 'የልጆች ብዛት', en: 'Number of children', t: 'number', min: 0, max: 30 },
  { k: 'childrenList', sec: 'personal', am: 'የልጆች ዝርዝር', en: 'Children', t: 'kids', wide: true },
  { k: 'household', sec: 'personal', am: 'አብሮ የሚኖር የቤተ ክርስቲያን አባል', en: 'Church member living with the family', t: 'people', wide: true },
  { k: 'blood', sec: 'personal', am: 'የደም ዓይነት', en: 'Blood group', t: 'select', opts: BLOOD },

  { k: 'phone', sec: 'contact', am: 'ስልክ ቁጥር', en: 'Mobile phone', t: 'tel', req: true, ph: '09xx xxx xxx' },
  { k: 'phone2', sec: 'contact', am: 'ሌላ ስልክ', en: 'Alternate phone', t: 'tel' },
  { k: 'email', sec: 'contact', am: 'ኢሜይል', en: 'Email', t: 'email' },
  { k: 'subcity', sec: 'contact', am: 'ክፍለ ከተማ', en: 'Sub-city', t: 'select', opts: SUBCITIES },
  { k: 'woreda', sec: 'contact', am: 'ወረዳ', en: 'Woreda', t: 'text' },
  { k: 'house', sec: 'contact', am: 'የቤት ቁጥር', en: 'House no.', t: 'text' },
  { k: 'area', sec: 'contact', am: 'አካባቢ / መለያ', en: 'Area or landmark', t: 'text', ph: 'e.g. Lebu Mebrat Hail' },

  { k: 'memberSince', sec: 'church', am: 'የአባልነት ቀን', en: 'Member since', t: 'date', ec: true },
  { k: 'baptized', sec: 'church', am: 'ጥምቀት', en: 'Baptized', t: 'radio', opts: YES_NO_BAPTIZED },
  { k: 'baptismDate', sec: 'church', am: 'የጥምቀት ቀን', en: 'Baptism date', t: 'date', ec: true, showIf: ['baptized', 'yes'] },
  { k: 'prevChurch', sec: 'church', am: 'የቀድሞ ቤተ ክርስቲያን', en: 'Previous church', t: 'text' },
  { k: 'role', sec: 'church', am: 'የአገልግሎት ኃላፊነት', en: 'Standing', t: 'select', opts: STANDING },
  { k: 'depts', sec: 'church', am: 'የአገልግሎት ክፍል', en: 'Ministry departments', t: 'multi', wide: true, opts: DEPTS_WITH_NONE },
  { k: 'wantsDept', sec: 'church', am: 'ማገልገል የሚፈልጉት ክፍል', en: 'Department they would like to join', t: 'select', opts: DEPARTMENTS, showIf: ['depts', NOT_SERVING] },
  { k: 'status', sec: 'church', am: 'የአባልነት ሁኔታ', en: 'Membership status', t: 'radio', opts: STATUS },

  { k: 'education', sec: 'work', am: 'የትምህርት ደረጃ', en: 'Education level', t: 'select', opts: EDUCATION },
  { k: 'occupation', sec: 'work', am: 'ሙያ / ሥራ', en: 'Occupation', t: 'text' },
  { k: 'workplace', sec: 'work', am: 'የሥራ ቦታ', en: 'Workplace', t: 'text' },

  { k: 'emgName', sec: 'emergency', am: 'ስም', en: 'Contact name', t: 'text' },
  { k: 'emgPhone', sec: 'emergency', am: 'ስልክ', en: 'Contact phone', t: 'tel' },
  { k: 'emgRel', sec: 'emergency', am: 'ዝምድና', en: 'Relationship', t: 'text', ph: 'e.g. brother, neighbour' },
  { k: 'notes', sec: 'emergency', am: 'ተጨማሪ ማስታወሻ', en: 'Notes', t: 'textarea', wide: true },
]

export const CHILD_EDUCATION: readonly Opt[] = [
  ['none', 'ትምህርት ያልጀመረ', 'Not yet in school'], ['kg', 'ኪንደርጋርተን', 'Kindergarten'], ['primary', 'አንደኛ ደረጃ', 'Primary'],
  ['secondary', 'ሁለተኛ ደረጃ', 'Secondary'], ['tvet', 'ቴክኒክና ሙያ', 'TVET / Diploma'], ['degree', 'ዲግሪና በላይ', 'Degree or higher'],
]
export const ROSTER_LIMITS = { childrenList: 20, household: 10 } as const

const values = (opts: readonly Opt[]) => opts.map((o) => o[0]) as [string, ...string[]]
const FIELD: Record<string, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.k, f]))
export const fieldDef = (k: RegistrationKey): FieldDef => FIELD[k]

// ---------------------------------------------------------------------------------------------
// Validation (same messages as lebu-form). Form values are strings; '' means "not filled in".

export const MSG = {
  required: 'This one is required.',
  email: 'Check the email address.',
  phone: 'That phone number looks too short.',
  future: 'That date is in the future.',
  date: 'Use a valid date.',
  choice: 'Pick one of the options.',
  number: 'Enter a number in range.',
} as const

const todayISO = () => new Date().toISOString().slice(0, 10)
// An optional field: empty is fine, anything else must pass `schema`, and its own message is shown.
// (A plain `z.literal('').or(schema)` reports only a generic "Invalid input" in Zod 4.)
function blankOr<T extends z.ZodType>(schema: T) {
  return z.string().transform((value, ctx): '' | z.output<T> => {
    if (value === '') return ''
    const result = schema.safeParse(value)
    if (result.success) return result.data
    for (const issue of result.error.issues) ctx.addIssue({ code: 'custom', message: issue.message })
    return z.NEVER
  })
}
const text = (max: number) => z.string().trim().max(max)
const required = (max: number) => z.string().trim().min(1, MSG.required).max(max)
const phone = z.string().trim().refine((v) => v.replace(/\D/g, '').length >= 7, MSG.phone).pipe(z.string().max(30))
const optPhone = blankOr(phone)
const choice = (opts: readonly Opt[], message: string = MSG.choice) => z.enum(values(opts), { error: () => message })
const optChoice = (opts: readonly Opt[]) => blankOr(choice(opts))
const pastDate = z.string().date(MSG.date).refine((v) => v <= todayISO(), MSG.future)
const optPastDate = blankOr(pastDate)
const optNumber = (min: number, max: number) =>
  blankOr(z.string().regex(/^\d+$/, MSG.number).refine((v) => Number(v) >= min && Number(v) <= max, MSG.number))

export const childRow = z.object({
  name: text(150),
  sex: optChoice(SEX),
  edu: optChoice(CHILD_EDUCATION),
  age: optNumber(0, 120),
}).strict()
export const householdRow = z.object({ name: text(150), rel: text(80), age: optNumber(0, 120) }).strict()
export type ChildRow = z.input<typeof childRow>
export type HouseholdRow = z.input<typeof householdRow>

export const registrationSchema = z.object({
  firstNameAm: required(100),
  fatherNameAm: required(100),
  gfNameAm: text(100),
  sex: choice(SEX, MSG.required),
  dob: optPastDate,
  marital: optChoice(MARITAL),
  spouse: text(150),
  spouseMemberId: blankOr(z.string().uuid()),
  spouseAge: optNumber(0, 120),
  spousePhone: optPhone,
  children: optNumber(0, 30),
  childrenList: z.array(childRow).max(ROSTER_LIMITS.childrenList),
  household: z.array(householdRow).max(ROSTER_LIMITS.household),
  blood: optChoice(BLOOD),
  phone: z.string().trim().min(1, MSG.required).pipe(phone),
  phone2: optPhone,
  email: blankOr(z.string().trim().email(MSG.email).max(200)),
  subcity: optChoice(SUBCITIES),
  woreda: text(50),
  house: text(50),
  area: text(150),
  memberSince: blankOr(z.string().date(MSG.date)),
  baptized: optChoice(YES_NO_BAPTIZED),
  baptismDate: optPastDate,
  prevChurch: text(150),
  role: optChoice(STANDING),
  depts: z.array(choice(DEPTS_WITH_NONE)).max(DEPTS_WITH_NONE.length),
  wantsDept: optChoice(DEPARTMENTS),
  status: optChoice(STATUS),
  education: optChoice(EDUCATION),
  occupation: text(150),
  workplace: text(150),
  emgName: text(150),
  emgPhone: optPhone,
  emgRel: text(80),
  notes: text(2000),
}).strict()

export type RegistrationValues = z.input<typeof registrationSchema>
export type RegistrationKey = keyof RegistrationValues

export const emptyRegistration = (): RegistrationValues => ({
  firstNameAm: '', fatherNameAm: '', gfNameAm: '', sex: '' as RegistrationValues['sex'], dob: '', marital: '',
  spouse: '', spouseMemberId: '', spouseAge: '', spousePhone: '', children: '', childrenList: [], household: [],
  blood: '', phone: '', phone2: '', email: '', subcity: '', woreda: '', house: '', area: '', memberSince: '',
  baptized: '', baptismDate: '', prevChurch: '', role: '', depts: [], wantsDept: '', status: 'active',
  education: '', occupation: '', workplace: '', emgName: '', emgPhone: '', emgRel: '', notes: '',
})

/** Is a conditional field currently visible? */
export function isVisible(f: FieldDef, v: RegistrationValues): boolean {
  if (!f.showIf) return true
  const cur = v[f.showIf[0]]
  return Array.isArray(cur) ? (cur as string[]).includes(f.showIf[1]) : cur === f.showIf[1]
}

const rowEmpty = (r: ChildRow | HouseholdRow) => !Object.values(r).some((x) => String(x ?? '').trim())

/**
 * Like lebu-form's collect(): hidden conditional fields are cleared, empty roster rows dropped,
 * "not serving" excludes real departments, and status defaults to active. Run before validating.
 */
export function cleanRegistration(input: RegistrationValues): RegistrationValues {
  const v: RegistrationValues = { ...input }
  for (const f of FIELDS) {
    if (!isVisible(f, v)) (v as Record<string, unknown>)[f.k as string] = f.t === 'multi' ? [] : ''
  }
  if (v.marital !== 'married') v.spouseMemberId = ''
  const depts = v.depts ?? []
  if (depts.includes(NOT_SERVING)) v.depts = [NOT_SERVING]
  v.childrenList = (v.childrenList ?? []).filter((r: ChildRow) => !rowEmpty(r))
  v.household = (v.household ?? []).filter((r: HouseholdRow) => !rowEmpty(r))
  if (!v.status) v.status = 'active'
  return v
}
