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
import { Plus, Edit2, Trash2, Users, Calendar } from 'lucide-react'

interface EducationProgram {
  id: string
  program_name: string
  level: string
  description: string
  duration_weeks: number
  start_date: string
  end_date: string
  instructor: string
  location: string
  enrollment_count: number
  status: string
  created_at: string
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Specialized']
const STATUS_OPTIONS = ['active', 'completed', 'suspended']

export default function EducationPage() {
  const [programs, setPrograms] = useState<EducationProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    program_name: '',
    level: '',
    description: '',
    duration_weeks: 12,
    start_date: '',
    end_date: '',
    instructor: '',
    location: '',
    enrollment_count: 0,
    status: 'active',
  })

  useEffect(() => {
    fetchPrograms()
  }, [])

  async function fetchPrograms() {
    try {
      const response = await fetch('/api/education')
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

      const response = await fetch('/api/education', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          program_name: '',
          level: '',
          description: '',
          duration_weeks: 12,
          start_date: '',
          end_date: '',
          instructor: '',
          location: '',
          enrollment_count: 0,
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

  function handleEdit(program: EducationProgram) {
    setFormData({
      program_name: program.program_name,
      level: program.level,
      description: program.description,
      duration_weeks: program.duration_weeks,
      start_date: program.start_date,
      end_date: program.end_date,
      instructor: program.instructor,
      location: program.location,
      enrollment_count: program.enrollment_count,
      status: program.status,
    })
    setEditingId(program.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        const response = await fetch(`/api/education?id=${id}`, {
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
          <h1 className="text-3xl font-bold text-foreground">Education & Training</h1>
          <p className="text-muted-foreground mt-2">
            Manage Bible studies, classes, and training programs
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  program_name: '',
                  level: '',
                  description: '',
                  duration_weeks: 12,
                  start_date: '',
                  end_date: '',
                  instructor: '',
                  location: '',
                  enrollment_count: 0,
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
                {editingId ? 'Update program details' : 'Add a new education or training program'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  placeholder="e.g., Scripture Mastery"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={formData.level} onValueChange={(v) =>
                  setFormData({ ...formData, level: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
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
                  placeholder="Program details and objectives"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_weeks}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })
                    }
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment">Enrolled</Label>
                  <Input
                    id="enrollment"
                    type="number"
                    value={formData.enrollment_count}
                    onChange={(e) =>
                      setFormData({ ...formData, enrollment_count: parseInt(e.target.value) })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Instructor name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Classroom or online"
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
              No education programs yet. Click &quot;New Program&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{program.program_name}</CardTitle>
                    <CardDescription>{program.level} Level</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      program.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : program.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
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
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>
                      {new Date(program.start_date).toLocaleDateString()} -{' '}
                      {new Date(program.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{program.enrollment_count} enrolled</span>
                  </div>
                  {program.instructor && (
                    <div>
                      <span className="text-muted-foreground">Instructor: </span>
                      <span>{program.instructor}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Duration: </span>
                    <span>{program.duration_weeks} weeks</span>
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
