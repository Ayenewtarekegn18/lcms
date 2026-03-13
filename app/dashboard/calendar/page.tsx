'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Plus, Clock, MapPin } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { toast } from 'sonner'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  ministry: string
  description?: string
  event_date?: string
  event_time?: string
}

function normalizeEvent(row: Record<string, unknown>): CalendarEvent {
  const start = row.start_date ? new Date(row.start_date as string) : null
  const date = (row.event_date as string) || (start ? start.toISOString().split('T')[0] : '')
  const time = (row.event_time as string) || (start ? start.toTimeString().slice(0, 5) : '—')
  return {
    id: row.id as string,
    title: (row.title as string) || '',
    date,
    time,
    location: (row.location as string) || '—',
    ministry: (row.ministry as string) || '—',
    description: row.description as string | undefined,
    event_date: date,
    event_time: time,
  }
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '09:00',
    location: '',
    description: '',
    ministry: '',
  })
  const supabase = createClient()

  const loadEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')

      if (error) throw error
      const mapped: CalendarEvent[] = (data || []).map((row) => normalizeEvent(row as Record<string, unknown>))
      mapped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setEvents(mapped)
    } catch (err) {
      const msg = (err as Error)?.message ?? JSON.stringify(err)
      console.error('Error loading events:', msg)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-200 rounded" />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const dateStr = date.toISOString().split('T')[0]
      const dayEvents = events.filter((e) => e.date === dateStr)
      days.push(
        <div
          key={day}
          className="h-24 border border-slate-200 rounded bg-white hover:bg-slate-50 p-2 cursor-pointer transition-colors"
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-sm font-semibold text-slate-900">{day}</div>
          <div className="mt-1 space-y-0.5">
            {dayEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 truncate">
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && <div className="text-xs text-slate-500 px-2">+{dayEvents.length - 2} more</div>}
          </div>
        </div>
      )
    }
    return days
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10)

  const openAddModal = () => {
    setFormData({
      title: '',
      event_date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      event_time: '09:00',
      location: '',
      description: '',
      ministry: '',
    })
    setModalOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!formData.title?.trim()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        event_date: formData.event_date,
        event_time: formData.event_time,
        event_type: 'event',
        location: formData.location || null,
        description: formData.description || null,
        ministry: formData.ministry || null,
      }
      if (user) payload.organizer_id = user.id
      const { data: inserted, error } = await supabase.from('events').insert([payload]).select('id').single()
      if (error) throw error
      await logAudit({ action: 'create', resource_type: 'event', resource_id: inserted?.id, details: { title: formData.title } })
      setModalOpen(false)
      loadEvents()
    } catch (err) {
      const msg = (err as Error)?.message ?? JSON.stringify(err)
      console.error('Error saving event:', msg)
      toast.error(msg || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Calendar & Events</h1>
          <p className="text-slate-500 mt-2">View the calendar and upcoming events</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Calendar */}
      <Card className="bg-white border-slate-200 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {loading ? (
              <div className="col-span-7 py-12 text-center text-slate-500">Loading calendar...</div>
            ) : (
              renderCalendarDays()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events below calendar */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Upcoming Events</CardTitle>
          <CardDescription>Next scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-500 py-6 text-center">No upcoming events. Click Add Event to create one.</p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    {event.ministry && event.ministry !== '—' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.ministry}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </div>
                    {event.location && event.location !== '—' && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>Schedule a new church event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-700">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sunday Service"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Date</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-700">Time</Label>
                <Input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-700">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Location"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-700">Ministry (optional)</Label>
              <select
                value={formData.ministry}
                onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
              >
                <option value="">None</option>
                <option value="Spiritual Service">Spiritual Service</option>
                <option value="Teaching & Seminar">Teaching & Seminar</option>
                <option value="Youth Ministry">Youth Ministry</option>
                <option value="Worship">Worship</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-700">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} disabled={saving || !formData.title?.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving...' : 'Add Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
