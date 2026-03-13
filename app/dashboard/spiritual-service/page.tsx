'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Calendar, MapPin, User } from 'lucide-react'

interface SpiritualService {
  id: string
  service_type: string
  title: string
  description: string
  date: string
  duration_minutes: number
  location: string
  facilitator: string
  notes: string
  status: string
  created_at: string
}

const SERVICE_TYPES = [
  'Prayer Session',
  'Bible Study',
  'Meditation',
  'Worship',
  'Counseling',
  'Confession',
  'Baptism',
  'Communion',
  'Other',
]

const STATUS_OPTIONS = ['scheduled', 'ongoing', 'completed', 'cancelled']

export default function SpiritualServicesPage() {
  const [services, setServices] = useState<SpiritualService[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    service_type: '',
    title: '',
    description: '',
    date: '',
    duration_minutes: 60,
    location: '',
    facilitator: '',
    notes: '',
    status: 'scheduled',
  })

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    try {
      const response = await fetch('/api/spiritual-service')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/spiritual-service', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          service_type: '',
          title: '',
          description: '',
          date: '',
          duration_minutes: 60,
          location: '',
          facilitator: '',
          notes: '',
          status: 'scheduled',
        })
        setEditingId(null)
        setOpen(false)
        await fetchServices()
      }
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  function handleEdit(service: SpiritualService) {
    setFormData({
      service_type: service.service_type,
      title: service.title,
      description: service.description,
      date: service.date,
      duration_minutes: service.duration_minutes,
      location: service.location,
      facilitator: service.facilitator,
      notes: service.notes,
      status: service.status,
    })
    setEditingId(service.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await fetch(`/api/spiritual-service?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchServices()
        }
      } catch (error) {
        console.error('Error deleting service:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Spiritual Services & Counseling</h1>
          <p className="text-muted-foreground mt-2">
            Manage prayer sessions, counseling, and spiritual activities
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  service_type: '',
                  title: '',
                  description: '',
                  date: '',
                  duration_minutes: 60,
                  location: '',
                  facilitator: '',
                  notes: '',
                  status: 'scheduled',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Service' : 'Create New Service'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update service details' : 'Add a new spiritual service or counseling session'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type</Label>
                <Select value={formData.service_type} onValueChange={(v) =>
                  setFormData({ ...formData, service_type: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Service title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service details"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                    }
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Location or room"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilitator">Facilitator/Leader</Label>
                <Input
                  id="facilitator"
                  value={formData.facilitator}
                  onChange={(e) => setFormData({ ...formData, facilitator: e.target.value })}
                  placeholder="Name of facilitator"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) =>
                  setFormData({ ...formData, status: v })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Update Service' : 'Create Service'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {services.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No spiritual services scheduled yet. Click &quot;New Service&quot; to get started.
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.service_type}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.description && (
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {service.date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      <span>{new Date(service.date).toLocaleString()}</span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span>{service.location}</span>
                    </div>
                  )}
                  {service.facilitator && (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      <span>{service.facilitator}</span>
                    </div>
                  )}
                  {service.duration_minutes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Duration: </span>
                      <span>{service.duration_minutes} minutes</span>
                    </div>
                  )}
                </div>

                {service.notes && (
                  <div className="text-sm bg-muted p-2 rounded">
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{service.notes}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
