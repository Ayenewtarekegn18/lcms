'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ethiopianLabel } from '@/lib/ethiopian-calendar'
import { NOT_SERVING, type FieldDef, type Opt } from '@/lib/members/registration'

export const selectClass =
  'border-input h-9 w-full rounded-md border bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive'

/** "ስም · First name *", the bilingual label style the lebu-form register uses. */
export function FieldLabel({ f, htmlFor }: { f: FieldDef; htmlFor?: string }) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <Tag htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
      {f.am} <span className="font-normal text-slate-500">· {f.en}</span>
      {f.req && <span className="ml-0.5 text-red-600" aria-hidden>*</span>}
    </Tag>
  )
}

/** Radio/checkbox options shown as chips, like lebu-form. */
export function ChipGroup({ f, value, onChange, multiple }: { f: FieldDef; value: string | string[]; onChange: (v: string | string[]) => void; multiple?: boolean }) {
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v)
  const toggle = (v: string) => {
    if (!multiple) return onChange(v)
    const cur = Array.isArray(value) ? value : []
    if (cur.includes(v)) return onChange(cur.filter((x) => x !== v))
    // "not currently serving" excludes every real department, and vice versa
    if (v === NOT_SERVING) return onChange([NOT_SERVING])
    return onChange([...cur.filter((x) => x !== NOT_SERVING), v])
  }
  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-label={`${f.am} ${f.en}`} className="flex flex-wrap gap-2">
      {(f.opts ?? []).map(([v, am, en]: Opt) => (
        <label
          key={v}
          className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 ${
            selected(v) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
          }`}
        >
          <input
            type={multiple ? 'checkbox' : 'radio'}
            name={f.k}
            value={v}
            checked={selected(v)}
            onChange={() => toggle(v)}
            className="sr-only"
          />
          {am} <span className={selected(v) ? 'text-slate-300' : 'text-slate-500'}>· {en}</span>
        </label>
      ))}
    </div>
  )
}

/** Existing-member suggestions for the spouse field (name and member number only). */
export function SpouseSuggestions({ query, onPick }: { query: string; onPick: (m: { id: string; name: string }) => void }) {
  const [matches, setMatches] = useState<{ id: string; name: string; memberNumber: string | null }[]>([])
  useEffect(() => {
    if (query.trim().length < 2) { setMatches([]); return }
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/members/search?q=${encodeURIComponent(query.trim())}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then(setMatches)
        .catch(() => {})
    }, 250)
    return () => { clearTimeout(t); ctl.abort() }
  }, [query])
  if (!matches.length) return null
  return (
    <ul className="mt-1 max-h-48 overflow-auto rounded-md border border-slate-200 bg-white text-sm shadow-sm" role="listbox" aria-label="Matching members">
      {matches.map((m) => (
        <li key={m.id}>
          <button type="button" className="flex w-full justify-between px-3 py-2 text-left hover:bg-slate-50" onClick={() => { onPick(m); setMatches([]) }}>
            <span>{m.name}</span>
            {m.memberNumber && <span className="font-mono text-xs text-slate-500">{m.memberNumber}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Plain inputs (text, tel, email, number, date, select, textarea). */
export function SimpleInput({ f, value, onChange, invalid, describedBy }: {
  f: FieldDef; value: string; onChange: (v: string) => void; invalid: boolean; describedBy?: string
}) {
  const common = { id: f.k, name: f.k, 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy }
  if (f.t === 'select') {
    return (
      <select {...common} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {(f.opts ?? []).map(([v, am, en]) => <option key={v} value={v}>{am} · {en}</option>)}
      </select>
    )
  }
  if (f.t === 'textarea') {
    return <Textarea {...common} rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="bg-white" />
  }
  const type = f.t === 'number' ? 'number' : f.t === 'date' ? 'date' : f.t === 'tel' ? 'tel' : f.t === 'email' ? 'email' : 'text'
  return (
    <>
      <Input
        {...common}
        type={type}
        inputMode={f.t === 'number' ? 'numeric' : f.t === 'tel' ? 'tel' : undefined}
        min={f.min}
        max={f.max}
        placeholder={f.ph}
        autoComplete={f.t === 'tel' ? 'tel' : f.t === 'email' ? 'email' : 'off'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white"
      />
      {f.ec && value && <p className="mt-1 text-xs text-slate-500">{ethiopianLabel(value)}</p>}
    </>
  )
}
