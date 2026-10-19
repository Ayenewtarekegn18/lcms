'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHILD_EDUCATION, ROSTER_LIMITS, type ChildRow, type HouseholdRow, type Opt } from '@/lib/members/registration'

const selectClass =
  'border-input h-9 w-full rounded-md border bg-white px-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none'
const SEX: readonly Opt[] = [['male', 'ወንድ', 'Male'], ['female', 'ሴት', 'Female']]

function Cell({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-slate-500 ${className}`}>
      <span className="sm:sr-only">{label}</span>
      {children}
    </label>
  )
}

/** One row per child; the number of rows follows the "Number of children" field (max 20). */
export function ChildrenRoster({ rows, onChange }: { rows: ChildRow[]; onChange: (rows: ChildRow[]) => void }) {
  const set = (i: number, key: keyof ChildRow, value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)))
  const ages = rows.filter((r) => r.age !== '').map((r) => Number(r.age))
  const under = ages.filter((a) => a < 18).length
  const over = ages.length - under

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Set the number of children above and rows will appear here.</p>
  }
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[3fr_1fr_2fr_80px] gap-2 text-xs font-medium text-slate-500 sm:grid">
        <span>ሙሉ ስም · Full name</span><span>ጾታ · Sex</span><span>የትምህርት ደረጃ · Education</span><span>ዕድሜ · Age</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-md border border-slate-100 p-2 sm:grid-cols-[3fr_1fr_2fr_80px] sm:border-0 sm:p-0">
          <Cell label="Full name" className="col-span-2 sm:col-span-1">
            <Input value={r.name} onChange={(e) => set(i, 'name', e.target.value)} aria-label={`Child ${i + 1} full name`} />
          </Cell>
          <Cell label="Sex">
            <select className={selectClass} value={r.sex} onChange={(e) => set(i, 'sex', e.target.value)} aria-label={`Child ${i + 1} sex`}>
              <option value="">—</option>
              {SEX.map(([v, am, en]) => <option key={v} value={v}>{am} · {en}</option>)}
            </select>
          </Cell>
          <Cell label="Education">
            <select className={selectClass} value={r.edu} onChange={(e) => set(i, 'edu', e.target.value)} aria-label={`Child ${i + 1} education`}>
              <option value="">—</option>
              {CHILD_EDUCATION.map(([v, am, en]) => <option key={v} value={v}>{am} · {en}</option>)}
            </select>
          </Cell>
          <Cell label="Age">
            <Input type="number" inputMode="numeric" min={0} max={120} value={r.age} onChange={(e) => set(i, 'age', e.target.value)} aria-label={`Child ${i + 1} age`} />
          </Cell>
        </div>
      ))}
      {ages.length > 0 && (
        <p className="text-xs text-slate-500">{under} under 18 · {over} 18 and over</p>
      )}
    </div>
  )
}

export const blankChild = (): ChildRow => ({ name: '', sex: '', edu: '', age: '' })
export const blankPerson = (): HouseholdRow => ({ name: '', rel: '', age: '' })

/** Church members living with the family; rows are added by hand (max 10). */
export function HouseholdRoster({ rows, onChange }: { rows: HouseholdRow[]; onChange: (rows: HouseholdRow[]) => void }) {
  const set = (i: number, key: keyof HouseholdRow, value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)))
  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-sm text-slate-500">Nobody added. Use the button below if a church member lives with this family.</p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[3fr_2fr_80px_auto]">
          <Cell label="Full name" className="col-span-2 sm:col-span-1">
            <Input value={r.name} onChange={(e) => set(i, 'name', e.target.value)} aria-label={`Person ${i + 1} full name`} placeholder="ሙሉ ስም · Full name" />
          </Cell>
          <Cell label="Relationship">
            <Input value={r.rel} onChange={(e) => set(i, 'rel', e.target.value)} aria-label={`Person ${i + 1} relationship`} placeholder="ዝምድና · Relationship" />
          </Cell>
          <Cell label="Age">
            <Input type="number" inputMode="numeric" min={0} max={120} value={r.age} onChange={(e) => set(i, 'age', e.target.value)} aria-label={`Person ${i + 1} age`} placeholder="ዕድሜ" />
          </Cell>
          <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Remove person ${i + 1}`}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ))}
      {rows.length < ROSTER_LIMITS.household && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, blankPerson()])}>
          <Plus className="mr-1 h-4 w-4" aria-hidden /> አባል ጨምር · Add person
        </Button>
      )}
    </div>
  )
}
