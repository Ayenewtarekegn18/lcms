'use client'

import type { ReactNode } from 'react'
import { CalendarDays, ChevronRight, Clock, Crown, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/app/empty-state'
import { useApiList } from '@/components/app/use-api'
import type { EventItem } from '@/lib/events/schema'
import { formatEventDate, formatEventTime } from '@/lib/events/time'
import { meetingLabel } from '@/lib/ministries/workspace'
import { MinistryRoleBadge } from './members-tab'
import type { WorkspaceContext } from './types'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

/** About the ministry, its leaders and its next events. */
export function OverviewTab({ ctx }: { ctx: WorkspaceContext }) {
  const { ministry, data } = ctx
  const params = { ministry_id: ministry.id, upcoming: 'true' }
  const next = useApiList<EventItem>('/api/events', { params, pageSize: 3, failure: 'Could not load the next events.' })
  const meeting = meetingLabel(ministry)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Panel title="About">
          <p className="text-sm leading-relaxed text-foreground">
            {ministry.description || <span className="text-muted-foreground">No description yet.</span>}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div><dt className="text-muted-foreground">Meets</dt><dd className="text-foreground">{meeting ?? 'Not set'}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div><dt className="text-muted-foreground">Location</dt><dd className="text-foreground">{ministry.location || 'Not set'}</dd></div>
            </div>
          </dl>
        </Panel>

        <Panel title="Next events" action={<Button variant="ghost" size="sm" onClick={() => ctx.openTab('events')}>All events <ChevronRight aria-hidden /></Button>}>
          {next.loading && next.rows.length === 0 ? (
            <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
          ) : next.rows.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming events." className="py-6" />
          ) : (
            <ul className="divide-y divide-border">
              {next.rows.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-foreground">
                    <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                      {new Date(e.start_date).toLocaleString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-base font-bold leading-tight">{new Date(e.start_date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatEventDate(e.start_date)} · {formatEventTime(e.start_date, e.end_date)}{e.location ? ` · ${e.location}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Leaders" action={<Button variant="ghost" size="sm" onClick={() => ctx.openTab('members')}>All members <ChevronRight aria-hidden /></Button>}>
        {data.leaders.length === 0 ? (
          <EmptyState icon={Crown} title="No leaders yet." description="Give a member the Leader role in the Members tab." className="py-6" />
        ) : (
          <ul className="space-y-3">
            {data.leaders.map((l) => (
              <li key={l.member_id} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground" aria-hidden>
                  {initials(l.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{l.name}</span>
                <MinistryRoleBadge role={l.role} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
