'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ClipboardCheck, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable, type Column } from '@/components/app/data-table'
import { RowActions } from '@/components/app/row-actions'
import { useApiList, useApiMutation } from '@/components/app/use-api'
import { EventFormDialog } from '@/components/events/event-form-dialog'
import { PAGE_ACCESS } from '@/lib/auth/roles'
import type { EventItem } from '@/lib/events/schema'
import { formatEventDate, formatEventTime } from '@/lib/events/time'
import { cn } from '@/lib/utils'
import type { WorkspaceContext } from './types'

type When = 'upcoming' | 'past'

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }

const columns: Column<EventItem>[] = [
  {
    key: 'title',
    header: 'Event',
    primary: true,
    cell: (e) => (
      <span className="inline-flex flex-wrap items-center gap-2">
        {e.title}
        {e.event_type && <Badge variant="secondary" className="font-normal">{e.event_type}</Badge>}
      </span>
    ),
  },
  { key: 'date', header: 'Date', cell: (e) => formatEventDate(e.start_date) },
  { key: 'time', header: 'Time', cell: (e) => formatEventTime(e.start_date, e.end_date) },
  { key: 'location', header: 'Location' },
]

/**
 * This ministry's events, through the events API (GET /api/events?ministry_id=…). Staff add, edit and
 * delete them with the same form as the events page, with this ministry chosen.
 */
export function EventsTab({ ctx }: { ctx: WorkspaceContext }) {
  const [when, setWhen] = useState<When>('upcoming')
  const ministryId = ctx.ministry.id
  const params = useMemo(() => {
    const range: Record<string, string> = when === 'upcoming' ? { upcoming: 'true' } : { to: startOfToday(), order: 'desc' }
    return { ministry_id: ministryId, ...range }
  }, [when, ministryId])
  const list = useApiList<EventItem>('/api/events', { params, pageSize: 20, failure: 'Could not load the events.' })
  const { mutate } = useApiMutation()
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<EventItem | null>(null)
  const canWrite = PAGE_ACCESS.events.includes(ctx.role)

  const changed = () => { list.reload(); ctx.refresh() }
  const remove = async () => {
    if (!deleting) return false
    const r = await mutate(`/api/events/${deleting.id}`, { method: 'DELETE', success: 'Event deleted', failure: 'Could not delete the event.' })
    if (r.ok) changed()
    return r.ok
  }

  const toggle = (
    <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label="Which events">
      {(['upcoming', 'past'] as const).map((w) => (
        <button
          key={w}
          type="button"
          aria-pressed={when === w}
          onClick={() => setWhen(w)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
            when === w ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {w}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {toggle}
        {canWrite && <Button onClick={() => setAdding(true)}><Plus aria-hidden /> Add event</Button>}
      </div>
      <DataTable
        label={when === 'upcoming' ? 'Upcoming events' : 'Past events'}
        list={list}
        columns={columns}
        actions={(e) => (
          <RowActions
            name={e.title}
            onEdit={canWrite ? () => setEditing(e) : undefined}
            onDelete={canWrite ? () => setDeleting(e) : undefined}
          >
            {/* The attendance page has no event parameter yet: it opens on its own event picker. */}
            <Button asChild variant="ghost" size="icon" title="Take attendance">
              <Link href="/dashboard/attendance" aria-label={`Take attendance for ${e.title}`}>
                <ClipboardCheck aria-hidden />
              </Link>
            </Button>
          </RowActions>
        )}
        empty={{
          icon: CalendarDays,
          title: when === 'upcoming' ? 'No upcoming events.' : 'No past events.',
          description: when === 'upcoming' ? 'Plan a meeting, rehearsal or service for this ministry.' : undefined,
        }}
      />

      <EventFormDialog
        open={adding || editing !== null}
        onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null) } }}
        event={editing}
        defaultMinistryId={ministryId}
        onSaved={changed}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Delete this event?"
        description={deleting && <>“{deleting.title}” is removed from the calendar, with any attendance taken for it. This cannot be undone.</>}
        confirmLabel="Delete event"
        onConfirm={remove}
      />
    </>
  )
}
