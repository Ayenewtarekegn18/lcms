'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Calendar, Clock, ListChecks, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EventFormDialog } from '@/components/events/event-form-dialog'
import { errorMessage, eventsApi } from '@/lib/events/client'
import type { EventItem } from '@/lib/events/schema'
import {
  dayKey, formatDayLabel, formatEventDate, formatEventTime, formatMonth, fromDayKey, groupByDay,
  monthWindow, startOfDay, startOfMonth, weekdayNames,
} from '@/lib/events/time'
import { cn } from '@/lib/utils'

/** Month grid, the selected day's events and the next events, all read through /api/events. */
export function CalendarView({ canEdit }: { canEdit: boolean }) {
  // Set after mount, so the month and "today" are the user's (time zone and locale), not the server's.
  const [month, setMonth] = useState<Date | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [monthEvents, setMonthEvents] = useState<EventItem[]>([])
  const [loadingMonth, setLoadingMonth] = useState(true)
  const [monthFailed, setMonthFailed] = useState(false)
  const [upcoming, setUpcoming] = useState<EventItem[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [upcomingFailed, setUpcomingFailed] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formDate, setFormDate] = useState<string | null>(null)
  const latestMonth = useRef(0)

  useEffect(() => {
    const now = new Date()
    setMonth(startOfMonth(now))
    setSelected(dayKey(now))
  }, [])

  const loadMonth = useCallback(async (m: Date) => {
    const request = ++latestMonth.current // a slower answer for a month we've left is ignored
    setLoadingMonth(true)
    setMonthFailed(false)
    try {
      const events = await eventsApi.list({ ...monthWindow(m), order: 'asc', limit: '500' })
      if (request === latestMonth.current) setMonthEvents(events)
    } catch (err) {
      if (request !== latestMonth.current) return
      setMonthEvents([])
      setMonthFailed(true)
      toast.error('Could not load the calendar', { description: errorMessage(err) })
    } finally {
      if (request === latestMonth.current) setLoadingMonth(false)
    }
  }, [])

  const loadUpcoming = useCallback(async () => {
    setLoadingUpcoming(true)
    setUpcomingFailed(false)
    try {
      setUpcoming(await eventsApi.list({ from: startOfDay(new Date()).toISOString(), order: 'asc', limit: '10' }))
    } catch (err) {
      setUpcomingFailed(true)
      toast.error('Could not load the upcoming events', { description: errorMessage(err) })
    } finally {
      setLoadingUpcoming(false)
    }
  }, [])

  useEffect(() => {
    if (month) loadMonth(month)
  }, [month, loadMonth])

  useEffect(() => {
    loadUpcoming()
  }, [loadUpcoming])

  const byDay = useMemo(() => groupByDay(monthEvents), [monthEvents])

  const goTo = (m: Date) => {
    setMonth(m)
    setSelected(null)
  }
  const goToday = () => {
    const now = new Date()
    setMonth(startOfMonth(now))
    setSelected(dayKey(now))
  }
  const openAdd = (day: string | null) => {
    setFormDate(day)
    setFormOpen(true)
  }
  // Show the new event: its month, with its day selected.
  const onSaved = (saved: { start_date: string }) => {
    const start = new Date(saved.start_date)
    setMonth(startOfMonth(start))
    setSelected(dayKey(start))
    loadUpcoming()
  }

  const selectedEvents = selected ? byDay.get(selected) ?? [] : []

  const renderDays = (m: Date) => {
    const todayKey = dayKey(new Date())
    const cells = []
    const leading = new Date(m.getFullYear(), m.getMonth(), 1).getDay()
    for (let i = 0; i < leading; i++) {
      cells.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-200 rounded" />)
    }
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
    for (let day = 1; day <= days; day++) {
      const date = new Date(m.getFullYear(), m.getMonth(), day)
      const key = dayKey(date)
      const list = byDay.get(key) ?? []
      const isSelected = key === selected
      cells.push(
        <button
          key={key}
          type="button"
          data-day={key}
          aria-pressed={isSelected}
          aria-label={`${formatDayLabel(date)}${list.length ? `, ${list.length} event${list.length > 1 ? 's' : ''}` : ''}`}
          onClick={() => setSelected(key)}
          className={cn(
            'h-24 min-w-0 overflow-hidden border rounded bg-white hover:bg-slate-50 p-2 text-left align-top transition-colors flex flex-col',
            isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200',
          )}
        >
          <span className={cn('text-sm font-semibold', key === todayKey
            ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
            : 'text-slate-900')}>
            {day}
          </span>
          <span className="mt-1 block w-full space-y-0.5">
            {list.slice(0, 2).map((event) => (
              <span key={event.id} className="block text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 truncate">
                {event.title}
              </span>
            ))}
            {list.length > 2 && <span className="block text-xs text-slate-500 px-2">+{list.length - 2} more</span>}
          </span>
        </button>,
      )
    }
    return cells
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Calendar & Events</h1>
          <p className="text-slate-500 mt-2">View the calendar and upcoming events</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/events">
                <ListChecks className="w-4 h-4 mr-2" />
                Manage events
              </Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => openAdd(selected)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-white border-slate-200 mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-slate-900" aria-live="polite">{month ? formatMonth(month) : ' '}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!month}
                onClick={() => month && goTo(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={!month} onClick={goToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" disabled={!month}
                onClick={() => month && goTo(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {month && (
            <div className="grid grid-cols-7 gap-2 mb-2" aria-hidden>
              {weekdayNames().map((name) => (
                <div key={name} className="text-center font-semibold text-sm text-slate-600 py-2">{name}</div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-7 gap-2">
            {!month || loadingMonth ? (
              <div className="col-span-7 py-12 text-center text-slate-500">Loading calendar...</div>
            ) : monthFailed ? (
              <div className="col-span-7 py-12 text-center">
                <p className="text-slate-600">The calendar could not be loaded.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => loadMonth(month)}>Try again</Button>
              </div>
            ) : (
              renderDays(month)
            )}
          </div>
        </CardContent>
      </Card>

      {month && selected && !loadingMonth && !monthFailed && (
        <Card className="bg-white border-slate-200 mb-8" data-testid="selected-day">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-slate-900">{formatDayLabel(fromDayKey(selected))}</CardTitle>
                <CardDescription>
                  {selectedEvents.length === 0 ? 'No events on this day' : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}`}
                </CardDescription>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => openAdd(selected)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add event on this day
                </Button>
              )}
            </div>
          </CardHeader>
          {selectedEvents.length > 0 && (
            <CardContent>
              <div className="space-y-4">
                {selectedEvents.map((event) => <EventSummary key={event.id} event={event} />)}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Upcoming Events</CardTitle>
          <CardDescription>Today and the next scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUpcoming ? (
            <p className="text-slate-500 py-6 text-center">Loading upcoming events...</p>
          ) : upcomingFailed ? (
            <div className="py-6 text-center">
              <p className="text-slate-600">The upcoming events could not be loaded.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadUpcoming}>Try again</Button>
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-slate-500 py-6 text-center">
              No upcoming events.{canEdit ? ' Click Add Event to create one.' : ''}
            </p>
          ) : (
            <div className="space-y-4">
              {upcoming.map((event) => <EventSummary key={event.id} event={event} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <EventFormDialog open={formOpen} onOpenChange={setFormOpen} defaultDate={formDate} onSaved={onSaved} />
      )}
    </div>
  )
}

function EventSummary({ event }: { event: EventItem }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-900">{event.title}</h3>
        {event.ministry && (
          <span className="inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {event.ministry.name}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 shrink-0" />
          {formatEventDate(event.start_date)}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          {formatEventTime(event.start_date, event.end_date)}
        </div>
        {event.location && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <MapPin className="w-4 h-4 shrink-0" />
            {event.location}
          </div>
        )}
      </div>
    </div>
  )
}
