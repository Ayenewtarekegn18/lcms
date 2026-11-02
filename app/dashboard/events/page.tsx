'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CalendarDays, Edit, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EventFormDialog } from '@/components/events/event-form-dialog'
import { RequestError, errorMessage, eventsApi } from '@/lib/events/client'
import type { EventItem } from '@/lib/events/schema'
import { endedBefore, formatEventDate, formatEventTime, startOfDay } from '@/lib/events/time'

const PAST_PAGE = 50

// Staff only (layout.tsx gates PAGE_ACCESS.events). Everything goes through /api/events.
export default function EventsPage() {
  const [upcoming, setUpcoming] = useState<EventItem[]>([])
  const [past, setPast] = useState<EventItem[]>([])
  const [pastOffset, setPastOffset] = useState(0)
  const [hasMorePast, setHasMorePast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [deleting, setDeleting] = useState<EventItem | null>(null)
  const [removing, setRemoving] = useState(false)
  // Upcoming = still running from the start of the user's today; past = ended before it.
  const today = useRef('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    today.current = startOfDay(new Date()).toISOString()
    try {
      const [next, earlier] = await Promise.all([
        eventsApi.list({ from: today.current, order: 'asc', limit: '200' }),
        eventsApi.list({ to: today.current, order: 'desc', limit: String(PAST_PAGE) }),
      ])
      setUpcoming(next)
      setPast(endedBefore(earlier, today.current))
      setPastOffset(earlier.length)
      setHasMorePast(earlier.length === PAST_PAGE)
    } catch (err) {
      setLoadFailed(true)
      toast.error('Could not load the events', { description: errorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadMorePast = async () => {
    setLoadingMore(true)
    try {
      const more = await eventsApi.list({ to: today.current, order: 'desc', limit: String(PAST_PAGE), offset: String(pastOffset) })
      setPast((p) => [...p, ...endedBefore(more, today.current).filter((e) => !p.some((x) => x.id === e.id))])
      setPastOffset((o) => o + more.length)
      setHasMorePast(more.length === PAST_PAGE)
    } catch (err) {
      toast.error('Could not load older events', { description: errorMessage(err) })
    } finally {
      setLoadingMore(false)
    }
  }

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (event: EventItem) => {
    setEditing(event)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setRemoving(true)
    try {
      await eventsApi.remove(deleting.id)
      toast.success('Event deleted')
      setDeleting(null)
      load()
    } catch (err) {
      toast.error('Could not delete the event', { description: errorMessage(err) })
      if (err instanceof RequestError && err.status === 404) {
        setDeleting(null)
        load()
      }
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Events</h1>
        <p className="text-muted-foreground mt-2">Manage and schedule church events</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Event
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/calendar">
            <CalendarDays className="w-4 h-4 mr-2" />
            Calendar
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : loadFailed ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">The events could not be loaded.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="mb-12" aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="text-xl font-bold text-foreground mb-6">Upcoming Events</h2>
            {upcoming.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">No upcoming events scheduled</p>
                </CardContent>
              </Card>
            ) : (
              <EventsTable label="Upcoming events" events={upcoming} onEdit={openEdit} onDelete={setDeleting} />
            )}
          </section>

          {past.length > 0 && (
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="text-xl font-bold text-foreground mb-6">Past Events</h2>
              <EventsTable label="Past events" events={past} onEdit={openEdit} onDelete={setDeleting} />
              {hasMorePast && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={loadMorePast} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Show older events'}
                  </Button>
                </div>
              )}
            </section>
          )}
        </>
      )}

      <EventFormDialog open={formOpen} onOpenChange={setFormOpen} event={editing} onSaved={() => load()} />

      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o && !removing) setDeleting(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              {deleting && (
                <>
                  “{deleting.title}” on {formatEventDate(deleting.start_date)} will be deleted for good, together with any
                  attendance recorded for it. This can&apos;t be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={removing}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={removing}>
              {removing ? 'Deleting…' : 'Delete event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EventsTable({ label, events, onEdit, onDelete }: {
  label: string
  events: EventItem[]
  onEdit: (event: EventItem) => void
  onDelete: (event: EventItem) => void
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label={label}>
            <thead>
              <tr className="border-b border-border bg-muted">
                {['Event', 'Date', 'Time', 'Ministry', 'Location'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-foreground">{h}</th>
                ))}
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-foreground">{event.title}</div>
                    <div className="text-xs text-muted-foreground">{event.event_type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{formatEventDate(event.start_date)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{formatEventTime(event.start_date, event.end_date)}</td>
                  <td className="px-6 py-4 text-sm">
                    {event.ministry ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.ministry.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{event.location || '—'}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex gap-2 justify-center">
                      <button type="button" onClick={() => onEdit(event)} aria-label={`Edit ${event.title}`}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(event)} aria-label={`Delete ${event.title}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
