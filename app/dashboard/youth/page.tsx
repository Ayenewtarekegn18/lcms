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

interface YouthProgram {
  id: string
  program_name: string
  age_group: string
  description: string
  frequency: string
  meeting_day: string
  meeting_time: string
  location: string
  leader: string
  participants_count: number
  status: string
  created_at: string
}

const AGE_GROUPS = ['6-10', '11-13', '14-17', '18-25']
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const STATUS_OPTIONS = ['active', 'inactive', 'suspended']

export default function YouthPage() {
  const [programs, setPrograms] = useState<YouthProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    program_name: '',
    age_group: '',
    description: '',
    frequency: '',
    meeting_day: '',
    meeting_time: '',
    location: '',
    leader: '',
    participants_count: 0,
    status: 'active',
  })

  useEffect(() => {
    fetchPrograms()
  }, [])

  async function fetchPrograms() {
    try {
      const response = await fetch('/api/youth')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/youth', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          program_name: '',
          age_group: '',
          description: '',
          frequency: '',
          meeting_day: '',
          meeting_time: '',
          location: '',
          leader: '',
          participants_count: 0,
          status: 'active',
        })
        setEditingId(null)
        setOpen(false)
        await fetchPrograms()
      }
    } catch (error) {
      console.error('Error saving program:', error)
    }
  }

  function handleEdit(program: YouthProgram) {
    setFormData({
      program_name: program.program_name,
      age_group: program.age_group,
      description: program.description,
      frequency: program.frequency,
      meeting_day: program.meeting_day,
      meeting_time: program.meeting_time,
      location: program.location,
      leader: program.leader,
      participants_count: program.participants_count,
      status: program.status,
    })
    setEditingId(program.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        const response = await fetch(`/api/youth?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchPrograms()
        }
      } catch (error) {
        console.error('Error deleting program:', error)
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
          <h1 className="text-3xl font-bold text-foreground">Youth Programs</h1>
          <p className="text-muted-foreground mt-2">Manage youth ministry activities and programs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  program_name: '',
                  age_group: '',
                  description: '',
                  frequency: '',
                  meeting_day: '',
                  meeting_time: '',
                  location: '',
                  leader: '',
                  participants_count: 0,
                  status: 'active',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Program' : 'Create New Program'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update program details' : 'Add a new youth program'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  placeholder="e.g., Youth Bible Study"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age Group</Label>
                <Select value={formData.age_group} onValueChange={(v) =>
                  setFormData({ ...formData, age_group: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((age) => (
                      <SelectItem key={age} value={age}>
                        {age}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Program details"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(v) =>
                    setFormData({ ...formData, frequency: v })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {freq}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">Meeting Day</Label>
                  <Select value={formData.meeting_day} onValueChange={(v) =>
                    setFormData({ ...formData, meeting_day: v })
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Meeting Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.meeting_time}
                    onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count">Participants</Label>
                  <Input
                    id="count"
                    type="number"
                    value={formData.participants_count}
                    onChange={(e) =>
                      setFormData({ ...formData, participants_count: parseInt(e.target.value) })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Program location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leader">Program Leader</Label>
                <Input
                  id="leader"
                  value={formData.leader}
                  onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                  placeholder="Leader name"
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
                {editingId ? 'Update Program' : 'Create Program'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {programs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No youth programs yet. Click &quot;New Program&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{program.program_name}</CardTitle>
                    <CardDescription>
                      Ages {program.age_group} • {program.frequency}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      program.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : program.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {program.description && (
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Meeting: </span>
                    <span>
                      {program.meeting_day} at {program.meeting_time}
                    </span>
                  </div>
                  {program.location && (
                    <div>
                      <span className="text-muted-foreground">Location: </span>
                      <span>{program.location}</span>
                    </div>
                  )}
                  {program.leader && (
                    <div>
                      <span className="text-muted-foreground">Leader: </span>
                      <span>{program.leader}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{program.participants_count} participants</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(program)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(program.id)}
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
