'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { readApiError } from '@/lib/api/client-errors'
import { memberName } from '@/lib/members/directory'

type Found = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null }

type MemberPickerProps = {
  id: string
  /** The chosen member's id ('' for none). */
  value: string
  onChange: (id: string) => void
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}

const RESULTS = 8

/**
 * Choose a person from the member register: type part of a name, email or phone, pick from the
 * matches (GET /api/members?search=…&order=name). Staff and finance may search the register.
 */
export function MemberPicker({ id, value, onChange, invalid, describedBy, disabled }: MemberPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Found[]>([])
  const [loading, setLoading] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [chosen, setChosen] = useState<Found | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); setProblem(null); return }
    const ctl = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/members?${new URLSearchParams({ search: q, order: 'name', limit: String(RESULTS) })}`, { signal: ctl.signal })
        if (!res.ok) { setProblem((await readApiError(res, 'Could not search the members.')).message); return }
        setResults(await res.json())
        setProblem(null)
      } catch {
        if (!ctl.signal.aborted) setProblem('Could not search the members. Check your connection.')
      } finally {
        if (!ctl.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(timer); ctl.abort() }
  }, [query])

  if (value && chosen?.id === value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{memberName(chosen)}</p>
          {(chosen.email || chosen.phone) && <p className="truncate text-xs text-muted-foreground">{chosen.email || chosen.phone}</p>}
        </div>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { onChange(''); setChosen(null) }} aria-label="Choose someone else">
          <X aria-hidden /> Change
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={id}
          type="search"
          autoComplete="off"
          placeholder="Type a name, email or phone…"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
        {loading && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />}
      </div>
      {problem && <p className="text-xs text-destructive">{problem}</p>}
      {query.trim() && !loading && !problem && results.length === 0 && (
        <p className="text-xs text-muted-foreground">No active member matches “{query.trim()}”.</p>
      )}
      {results.length > 0 && (
        <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border" aria-label="Matching members">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => { setChosen(m); onChange(m.id); setQuery(''); setResults([]) }}
              >
                <span className="text-sm font-medium text-foreground">{memberName(m)}</span>
                {(m.email || m.phone) && <span className="text-xs text-muted-foreground">{m.email || m.phone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
