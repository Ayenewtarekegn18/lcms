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
import { Plus, Edit2, Trash2, Users } from 'lucide-react'

interface WorshipService {
  id: string
  service_date: string
  service_type: string
  theme: string
  speaker: string
  sermon_title: string
  readings: string
  attendance: number
  notes: string
  created_at: string
}

const SERVICE_TYPES = ['Sunday Service', 'Weekday Service', 'Special Worship', 'Holiday Service']

export default function WorshipPage() {
  const [services, setServices] = useState<WorshipService[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    service_date: '',
    service_type: '',
    theme: '',
    speaker: '',
    sermon_title: '',
    readings: '',
    attendance: 0,
    notes: '',
  })

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    try {
      const response = await fetch('/api/worship')
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

      const response = await fetch('/api/worship', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          service_date: '',
          service_type: '',
          theme: '',
          speaker: '',
          sermon_title: '',
          readings: '',
          attendance: 0,
          notes: '',
        })
        setEditingId(null)
        setOpen(false)
        await fetchServices()
      }
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  function handleEdit(service: WorshipService) {
    setFormData({
      service_date: service.service_date,
      service_type: service.service_type,
      theme: service.theme,
      speaker: service.speaker,
      sermon_title: service.sermon_title,
      readings: service.readings,
      attendance: service.attendance,
      notes: service.notes,
    })
    setEditingId(service.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        const response = await fetch(`/api/worship?id=${id}`, {
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

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Worship Services</h1>
          <p className="text-muted-foreground mt-2">Record and manage church worship services</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  service_date: '',
                  service_type: '',
                  theme: '',
                  speaker: '',
                  sermon_title: '',
                  readings: '',
                  attendance: 0,
                  notes: '',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Service' : 'Record New Service'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update service details' : 'Record a worship service'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Service Date</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.service_date}
                  onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Service Type</Label>
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
                <Label htmlFor="theme">Service Theme</Label>
                <Input
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  placeholder="e.g., Grace and Mercy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker">Speaker/Preacher</Label>
                <Input
                  id="speaker"
                  value={formData.speaker}
                  onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  placeholder="Speaker name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sermon">Sermon Title</Label>
                <Input
                  id="sermon"
                  value={formData.sermon_title}
                  onChange={(e) => setFormData({ ...formData, sermon_title: e.target.value })}
                  placeholder="Sermon title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readings">Scripture Readings</Label>
                <Input
                  id="readings"
                  value={formData.readings}
                  onChange={(e) => setFormData({ ...formData, readings: e.target.value })}
                  placeholder="e.g., John 3:16"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance">Attendance</Label>
                <Input
                  id="attendance"
                  type="number"
                  value={formData.attendance}
                  onChange={(e) =>
                    setFormData({ ...formData, attendance: parseInt(e.target.value) })
                  }
                  min="0"
                />
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
                {editingId ? 'Update Service' : 'Record Service'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {services.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No services recorded yet. Click &quot;New Service&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.service_type}</CardTitle>
                    {service.theme && <CardDescription>{service.theme}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span>{new Date(service.service_date).toLocaleString()}</span>
                  </div>
                  {service.speaker && (
                    <div>
                      <span className="text-muted-foreground">Speaker: </span>
                      <span>{service.speaker}</span>
                    </div>
                  )}
                  {service.sermon_title && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Sermon: </span>
                      <span>{service.sermon_title}</span>
                    </div>
                  )}
                  {service.readings && (
                    <div>
                      <span className="text-muted-foreground">Readings: </span>
                      <span>{service.readings}</span>
                    </div>
                  )}
                  {service.attendance > 0 && (
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-muted-foreground" />
                      <span>{service.attendance} attended</span>
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
