'use client'

import { useEffect, useState } from 'react'
import { Banknote, HandCoins, Hourglass } from 'lucide-react'
import { StatCard } from '@/components/app/stat-card'
import { formatBirr } from '@/lib/financial/summary'
import type { CharityTotals as Totals } from '@/lib/ministries/charity'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// Birr amounts are long ("ETB 1,234,567.50"): a size smaller than the card's figure so two fit side by side on a phone.
const money = (amount: number) => <span className="block break-words text-lg sm:text-2xl lg:text-3xl">{formatBirr(amount)}</span>

/**
 * The charity figures from GET /api/charity-aid-requests/summary: amount requested, requests waiting
 * for a decision, amount paid out. `version` changes after every add, edit or delete, to reload them.
 */
export function CharityTotals({ version }: { version: number }) {
  const [totals, setTotals] = useState<Totals | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ctl = new AbortController()
    fetch('/api/charity-aid-requests/summary', { signal: ctl.signal, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        setTotals((await res.json()) as Totals)
        setFailed(false)
      })
      .catch(() => { if (!ctl.signal.aborted) setFailed(true) })
    return () => ctl.abort()
  }, [version])

  // A ministry leader may open the page but not read confidential rows (RLS): no figures then.
  if (failed && !totals) return null
  return (
    <section aria-label="Charity totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatCard
        label="Requested"
        value={totals ? money(totals.requested) : null}
        icon={HandCoins}
        hint={totals && plural(totals.requests, 'request')}
        className="min-w-0"
      />
      <StatCard
        label="Paid out"
        value={totals ? money(totals.paid) : null}
        icon={Banknote}
        hint={totals && plural(totals.distributions, 'distribution')}
        className="min-w-0"
      />
      <StatCard
        label="Awaiting decision"
        value={totals?.pending ?? null}
        icon={Hourglass}
        hint={totals && (totals.pending === 1 ? 'request pending' : 'requests pending')}
        className="col-span-2 min-w-0 sm:col-span-1"
      />
    </section>
  )
}
