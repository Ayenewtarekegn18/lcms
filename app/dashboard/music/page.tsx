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

interface MusicMinistry {
  id: string
  ensemble_name: string
  type: string
  director: string
  members_count: number
  rehearsal_day: string
  rehearsal_time: string
  repertoire: string
  status: string
  created_at: string
}

const ENSEMBLE_TYPES = ['Choir', 'Band', 'Worship Team', 'Orchestra', 'Other']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const STATUS_OPTIONS = ['active', 'inactive', 'seasonal']

export default function MusicPage() {
  const [ensembles, setEnsembles] = useState<MusicMinistry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ensemble_name: '',
    type: '',
    director: '',
    members_count: 0,
    rehearsal_day: '',
    rehearsal_time: '',
    repertoire: '',
    status: 'active',
  })

  useEffect(() => {
    fetchEnsembles()
  }, [])

  async function fetchEnsembles() {
    try {
      const response = await fetch('/api/music')
      if (response.ok) {
        const data = await response.json()
        setEnsembles(data)
      }
    } catch (error) {
      console.error('Error fetching ensembles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/music', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          ensemble_name: '',
          type: '',
          director: '',
          members_count: 0,
          rehearsal_day: '',
          rehearsal_time: '',
          repertoire: '',
          status: 'active',
        })
        setEditingId(null)
        setOpen(false)
        await fetchEnsembles()
      }
    } catch (error) {
      console.error('Error saving ensemble:', error)
    }
  }

  function handleEdit(ensemble: MusicMinistry) {
    setFormData({
      ensemble_name: ensemble.ensemble_name,
      type: ensemble.type,
      director: ensemble.director,
      members_count: ensemble.members_count,
      rehearsal_day: ensemble.rehearsal_day,
      rehearsal_time: ensemble.rehearsal_time,
      repertoire: ensemble.repertoire,
      status: ensemble.status,
    })
    setEditingId(ensemble.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this ensemble?')) {
      try {
        const response = await fetch(`/api/music?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchEnsembles()
        }
      } catch (error) {
        console.error('Error deleting ensemble:', error)
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
          <h1 className="text-3xl font-bold text-foreground">Music Ministry</h1>
          <p className="text-muted-foreground mt-2">Manage choirs, bands, and music ensembles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  ensemble_name: '',
                  type: '',
                  director: '',
                  members_count: 0,
                  rehearsal_day: '',
                  rehearsal_time: '',
                  repertoire: '',
                  status: 'active',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Ensemble
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Ensemble' : 'Create New Ensemble'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update ensemble details' : 'Add a new music ensemble'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ensemble Name</Label>
                <Input
                  id="name"
                  value={formData.ensemble_name}
                  onChange={(e) =>
                    setFormData({ ...formData, ensemble_name: e.target.value })
                  }
                  placeholder="e.g., Gospel Choir"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(v) =>
                  setFormData({ ...formData, type: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENSEMBLE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="director">Director</Label>
                <Input
                  id="director"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  placeholder="Director name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="members">Members</Label>
                <Input
                  id="members"
                  type="number"
                  value={formData.members_count}
                  onChange={(e) =>
                    setFormData({ ...formData, members_count: parseInt(e.target.value) })
                  }
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="day">Rehearsal Day</Label>
                  <Select value={formData.rehearsal_day} onValueChange={(v) =>
                    setFormData({ ...formData, rehearsal_day: v })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Rehearsal Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.rehearsal_time}
                    onChange={(e) =>
                      setFormData({ ...formData, rehearsal_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repertoire">Repertoire</Label>
                <Textarea
                  id="repertoire"
                  value={formData.repertoire}
                  onChange={(e) => setFormData({ ...formData, repertoire: e.target.value })}
                  placeholder="Hymns and songs performed"
                  rows={3}
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

              <Button type="submit" className="w-full">
                {editingId ? 'Update Ensemble' : 'Create Ensemble'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {ensembles.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No ensembles yet. Click &quot;New Ensemble&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          ensembles.map((ensemble) => (
            <Card key={ensemble.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ensemble.ensemble_name}</CardTitle>
                    <CardDescription>{ensemble.type}</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      ensemble.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : ensemble.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ensemble.status.charAt(0).toUpperCase() + ensemble.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {ensemble.director && (
                    <div>
                      <span className="text-muted-foreground">Director: </span>
                      <span>{ensemble.director}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{ensemble.members_count} members</span>
                  </div>
                  {ensemble.rehearsal_day && (
                    <div>
                      <span className="text-muted-foreground">Rehearsal: </span>
                      <span>
                        {ensemble.rehearsal_day} at {ensemble.rehearsal_time}
                      </span>
                    </div>
                  )}
                </div>

                {ensemble.repertoire && (
                  <div className="text-sm bg-muted p-2 rounded">
                    <span className="text-muted-foreground">Repertoire: </span>
                    <span>{ensemble.repertoire}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ensemble)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(ensemble.id)}
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
