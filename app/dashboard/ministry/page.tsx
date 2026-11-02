'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Clock, Crown, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/app/empty-state'
import { Page, PageHeader } from '@/components/app/page-header'
import { ministryIcon } from '@/components/ministry/workspace/ministry-icons'
import { readApiError } from '@/lib/api/client-errors'
import { meetingLabel, type MinistryCard } from '@/lib/ministries/workspace'

// The ministries hub: one card per ministry workspace, from GET /api/ministries/workspaces (names in
// English and Amharic, leaders, active member count, meeting time). The layout gates it to staff.

export default function MinistriesHubPage() {
  const [cards, setCards] = useState<MinistryCard[] | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const ctl = new AbortController()
    fetch('/api/ministries/workspaces', { signal: ctl.signal, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return setFailed((await readApiError(res, 'Could not load the ministries.')).message)
        setCards(await res.json())
        setFailed(null)
      })
      .catch(() => { if (!ctl.signal.aborted) setFailed('Could not load the ministries. Check your connection.') })
    return () => ctl.abort()
  }, [version])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!cards || !q) return cards ?? []
    return cards.filter((c) => [c.name, c.name_am, c.description, ...c.leaders].some((t) => t?.toLowerCase().includes(q)))
  }, [cards, search])

  return (
    <Page>
      <PageHeader title="Ministries" subtitle="አገልግሎቶች · Each ministry's members, events and work" />

      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" aria-label="Search ministries" placeholder="Search ministries or leaders…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="bg-card pl-9" />
      </div>

      {failed && !cards ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState title="The ministries could not be loaded." description={failed}
            action={<Button variant="outline" onClick={() => { setFailed(null); setVersion((v) => v + 1) }}>Try again</Button>} />
        </div>
      ) : !cards ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState title={search ? `No ministry matches “${search.trim()}”.` : 'No ministries yet.'} />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Ministries">
          {shown.map((m) => <MinistryCardLink key={m.id} ministry={m} />)}
        </ul>
      )}
    </Page>
  )
}

function MinistryCardLink({ ministry: m }: { ministry: MinistryCard }) {
  const Icon = ministryIcon(m.slug)
  const meeting = meetingLabel(m)
  return (
    <li>
      <Link
        href={`/dashboard/ministry/${m.slug}`}
        className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold leading-tight text-foreground">{m.name}</h2>
            {m.name_am && <p className="mt-0.5 text-sm text-muted-foreground">{m.name_am}</p>}
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
        </div>

        {m.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}

        <dl className="mt-auto space-y-1.5 pt-4 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Members</dt>
            <dd><span className="font-semibold tabular-nums">{m.member_count}</span> {m.member_count === 1 ? 'member' : 'members'}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <dt className="sr-only">Leaders</dt>
            <dd className="truncate text-foreground">{m.leaders.length ? m.leaders.join(', ') : <span className="text-muted-foreground">No leader yet</span>}</dd>
          </div>
          {meeting && (
            <div className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <dt className="sr-only">Meets</dt>
              <dd className="truncate text-foreground">{meeting}</dd>
            </div>
          )}
        </dl>
      </Link>
    </li>
  )
}
