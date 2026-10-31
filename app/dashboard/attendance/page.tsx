'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ATTENDANCE_STATUSES,
  STATUS_LABELS,
  applyMark,
  defaultDay,
  formatDay,
  isAttendanceStatus,
  localDay,
  type AttendanceEvent,
  type AttendanceList,
  type AttendanceRecord,
  type AttendanceStatus,
  type RosterMember,
} from '@/lib/attendance'

// Attendance per event (remediation step 2.5, finding F-21): pick an event and day, mark members present,
// absent or late, save, and see the saved records with the per-event count. Reads and writes go through
// /api/attendance/** only.

const PAGE_SIZE = 50

const STATUS_STYLES: Record<AttendanceStatus, { badge: string; active: string }> = {
  present: { badge: 'bg-green-100 text-green-800', active: 'bg-green-600 text-white hover:bg-green-700' },
  absent: { badge: 'bg-red-100 text-red-800', active: 'bg-red-600 text-white hover:bg-red-700' },
  late: { badge: 'bg-yellow-100 text-yellow-800', active: 'bg-yellow-500 text-white hover:bg-yellow-600' },
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || res.statusText || 'Request failed')
  return body as T
}

const failed = (what: string) => (error: unknown) =>
  toast.error(`${what}: ${error instanceof Error ? error.message : 'request failed'}`)

function StatusBadge({ status }: { status: string | null }) {
  const known = isAttendanceStatus(status) ? status : null
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${known ? STATUS_STYLES[known].badge : 'bg-slate-100 text-slate-700'}`}
    >
      {known ? STATUS_LABELS[known] : status || '—'}
    </span>
  )
}

export default function AttendancePage() {
  const [events, setEvents] = useState<AttendanceEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventId, setEventId] = useState('')
  const [day, setDay] = useState('')

  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [rosterTotal, setRosterTotal] = useState(0)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)

  const [list, setList] = useState<AttendanceList | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [toDelete, setToDelete] = useState<AttendanceRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId])

  useEffect(() => {
    api<AttendanceEvent[]>('/api/attendance/events')
      .then(setEvents)
      .catch(failed('Could not load events'))
      .finally(() => setEventsLoading(false))
  }, [])

  // search as you type, without a request per key press
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim())
      setOffset(0)
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  const loadRoster = useCallback(async () => {
    if (!eventId || !day) return
    setRosterLoading(true)
    try {
      const params = new URLSearchParams({ event_id: eventId, date: day, limit: String(PAGE_SIZE), offset: String(offset) })
      if (query) params.set('search', query)
      const data = await api<{ members: RosterMember[]; total: number }>(`/api/attendance/members?${params}`)
      setRoster(data.members)
      setRosterTotal(data.total)
    } catch (error) {
      failed('Could not load members')(error)
    } finally {
      setRosterLoading(false)
    }
  }, [eventId, day, offset, query])

  const loadRecords = useCallback(async () => {
    if (!eventId || !day) return
    setListLoading(true)
    try {
      const params = new URLSearchParams({ event_id: eventId, date: day, limit: '200' })
      setList(await api<AttendanceList>(`/api/attendance?${params}`))
    } catch (error) {
      failed('Could not load attendance records')(error)
    } finally {
      setListLoading(false)
    }
  }, [eventId, day])

  useEffect(() => {
    loadRoster()
  }, [loadRoster])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const pickEvent = (id: string) => {
    const next = events.find((e) => e.id === id)
    if (!next) return
    setEventId(id)
    setDay(defaultDay(next, localDay()))
    setMarks({})
    setOffset(0)
    setList(null)
  }

  const pickDay = (value: string) => {
    if (!event || !value || value < event.first || value > event.last) return
    setDay(value)
    setMarks({})
  }

  const mark = (member: RosterMember, status: AttendanceStatus) =>
    setMarks((m) => applyMark(m, member.id, status, member.record?.status))

  const markAllPresent = () =>
    setMarks((m) => roster.reduce((acc, member) => applyMark(acc, member.id, 'present', member.record?.status), m))

  const pending = Object.keys(marks).length

  const save = async () => {
    if (!eventId || pending === 0) return
    setSaving(true)
    try {
      const records = Object.entries(marks).map(([member_id, status]) => ({ member_id, status }))
      const result = await api<{ saved: number }>('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, attendance_date: day, records }),
      })
      toast.success(`Attendance saved for ${result.saved} member${result.saved === 1 ? '' : 's'}`)
      setMarks({})
      await Promise.all([loadRoster(), loadRecords()])
    } catch (error) {
      failed('Could not save attendance')(error)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api(`/api/attendance/${toDelete.id}`, { method: 'DELETE' })
      toast.success('Attendance record removed')
      setToDelete(null)
      await Promise.all([loadRoster(), loadRecords()])
    } catch (error) {
      failed('Could not remove the record')(error)
    } finally {
      setDeleting(false)
    }
  }

  const counts = list?.counts

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500 mt-2">Take attendance for an event and see who came</p>
      </div>

      <Card className="bg-white border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-slate-900">Event</CardTitle>
          <CardDescription>Choose the event and day to take attendance for</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="attendance-event">Event</Label>
            {eventsLoading ? (
              <p className="text-sm text-slate-500">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-slate-500">No events yet. Create one on the events page first.</p>
            ) : (
              <Select value={eventId} onValueChange={pickEvent}>
                <SelectTrigger id="attendance-event" aria-label="Event" className="w-full">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} ({formatDay(e.first)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {event && (
            <div className="grid gap-2">
              <Label htmlFor="attendance-day">Day</Label>
              {event.first === event.last ? (
                <p id="attendance-day" className="text-sm text-slate-700 py-2">{formatDay(day)}</p>
              ) : (
                <Input
                  id="attendance-day"
                  type="date"
                  min={event.first}
                  max={event.last}
                  value={day}
                  onChange={(e) => pickDay(e.target.value)}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {event && (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6" data-testid="attendance-counts">
            {(['total', ...ATTENDANCE_STATUSES] as const).map((key) => (
              <Card key={key} className="bg-white border-slate-200">
                <CardHeader className="pb-2">
                  <CardDescription>{key === 'total' ? 'Recorded' : STATUS_LABELS[key]}</CardDescription>
                  <CardTitle className="text-3xl text-slate-900" data-testid={`count-${key}`}>
                    {counts ? (key === 'total' ? list.total : counts[key]) : '—'}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="bg-white border-slate-200 mb-6">
            <CardHeader>
              <CardTitle className="text-slate-900">Members</CardTitle>
              <CardDescription>
                Mark each member, then save. {pending > 0 ? `${pending} unsaved change${pending === 1 ? '' : 's'}.` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <Input
                  aria-label="Search members"
                  placeholder="Search by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" onClick={markAllPresent} disabled={roster.length === 0 || saving}>
                  Mark all present
                </Button>
                <Button onClick={save} disabled={pending === 0 || saving}>
                  {saving ? 'Saving...' : 'Save attendance'}
                </Button>
              </div>

              {rosterLoading && roster.length === 0 ? (
                <p className="text-center py-8 text-slate-500">Loading members...</p>
              ) : roster.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No members found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Member</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Number</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((member) => {
                        const current = marks[member.id] ?? member.record?.status ?? null
                        return (
                          <tr key={member.id} className="border-b border-slate-200" data-testid="roster-row">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                              {member.name}
                              {marks[member.id] && <span className="ml-2 text-xs text-amber-600">unsaved</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{member.memberNumber ?? '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2" role="group" aria-label={`Status for ${member.name}`}>
                                {ATTENDANCE_STATUSES.map((status) => (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant="outline"
                                    aria-pressed={current === status}
                                    className={current === status ? STATUS_STYLES[status].active : ''}
                                    onClick={() => mark(member, status)}
                                    disabled={saving}
                                  >
                                    {STATUS_LABELS[status]}
                                  </Button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {rosterTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                  <span>
                    {offset + 1}–{Math.min(offset + PAGE_SIZE, rosterTotal)} of {rosterTotal}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0 || rosterLoading}
                      onClick={() => setOffset((o) => Math.max(o - PAGE_SIZE, 0))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset + PAGE_SIZE >= rosterTotal || rosterLoading}
                      onClick={() => setOffset((o) => o + PAGE_SIZE)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Saved records</CardTitle>
              <CardDescription>
                {event.title} · {formatDay(day)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listLoading && !list ? (
                <p className="text-center py-8 text-slate-500">Loading records...</p>
              ) : !list || list.records.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No attendance recorded for this day yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Member</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Recorded by</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {list.records.map((record) => (
                        <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50" data-testid="record-row">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{record.member_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <StatusBadge status={record.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{record.recorded_by_name ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setToDelete(record)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {list.total > list.records.length && (
                    <p className="text-xs text-slate-500 mt-3">
                      Showing {list.records.length} of {list.total} records
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove attendance record</DialogTitle>
            <DialogDescription>
              Remove {toDelete?.member_name}&apos;s record for {toDelete?.event_title ?? 'this event'} on{' '}
              {toDelete ? formatDay(toDelete.attendance_date) : ''}? The change is kept in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
