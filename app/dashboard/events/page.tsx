'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Edit, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  event_date: string
  event_time: string
  location: string
  description: string
  ministry?: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '09:00',
    location: '',
    description: '',
    ministry: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*')
      if (error) throw error
      const rows = (data || []) as Record<string, unknown>[]
      const normalized = rows.map((row) => {
        const start = row.start_date ? new Date(row.start_date as string) : null
        const event_date = (row.event_date as string) || (start ? start.toISOString().split('T')[0] : '')
        const event_time = (row.event_time as string) || (start ? start.toTimeString().slice(0, 5) : '09:00')
        return {
          id: row.id,
          title: row.title,
          event_date,
          event_time,
          location: row.location ?? '',
          description: row.description ?? '',
          ministry: row.ministry ?? '',
        } as Event
      })
      normalized.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      setEvents(normalized)
    } catch (err) {
      const msg = (err as Error)?.message ?? JSON.stringify(err)
      console.error('Error fetching events:', msg)
    } finally {
      setLoading(false)
    }
  }

  const isUpcoming = (eventDate: string) => {
    return new Date(eventDate) >= new Date()
  }

  const upcomingEvents = events.filter((e) => isUpcoming(e.event_date))
  const pastEvents = events.filter((e) => !isUpcoming(e.event_date))

  const openAddModal = () => {
    setEditingEvent(null)
    setFormData({
      title: '',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '09:00',
      location: '',
      description: '',
      ministry: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      description: event.description,
      ministry: event.ministry || '',
    })
    setModalOpen(true)
  }

  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(formData)
          .eq('id', editingEvent.id)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const insertPayload = {
          ...formData,
          event_type: 'event',
          ...(user && { organizer_id: user.id }),
        }
        const { error } = await supabase.from('events').insert([insertPayload])
        if (error) throw error
      }
      fetchEvents()
      setModalOpen(false)
    } catch (err) {
      const msg = (err as Error)?.message ?? JSON.stringify(err)
      console.error('Error saving event:', msg)
      toast.error(msg || 'Failed to save event')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
      if (error) throw error
      fetchEvents()
    } catch (err) {
      const msg = (err as Error)?.message ?? JSON.stringify(err)
      console.error('Error deleting event:', msg)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Events</h1>
        <p className="text-slate-500 mt-2">Manage and schedule church events</p>
      </div>

      <div className="mb-6">
        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Event
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Loading events...</p>
        </div>
      ) : (
        <>
          {/* Upcoming Events */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <Card className="bg-white border-slate-200">
                <CardContent className="py-12">
                  <p className="text-center text-slate-500">No upcoming events scheduled</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white border-slate-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Event</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Time</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Location</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingEvents.map((event) => (
                          <tr key={event.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{event.title}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(event.event_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{event.event_time}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{event.location}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => openEditModal(event)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
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
            )}
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Past Events</h2>
              <Card className="bg-white border-slate-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Event</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Time</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Location</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastEvents.map((event) => (
                          <tr key={event.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{event.title}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(event.event_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{event.event_time}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{event.location}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Event Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Schedule New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update event details' : 'Create a new church event'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-slate-700">
                Event Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sunday Service, Bible Study"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-slate-700">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-slate-700">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-slate-700">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Church location or address"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ministry" className="text-slate-700">
                Ministry (optional)
              </Label>
              <select
                id="ministry"
                value={formData.ministry}
                onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">None</option>
                <option value="Spiritual Service">Spiritual Service</option>
                <option value="Teaching & Seminar">Teaching & Seminar</option>
                <option value="Youth Ministry">Youth Ministry</option>
                <option value="Worship">Worship</option>
              </select>
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details about this event..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingEvent ? 'Update Event' : 'Schedule Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
