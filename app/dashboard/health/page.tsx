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

interface HealthProgram {
  id: string
  program_name: string
  type: string
  description: string
  frequency: string
  coordinator: string
  participants: number
  impact: string
  status: string
  created_at: string
}

const PROGRAM_TYPES = ['Health Screening', 'Fitness Class', 'Mental Health', 'Nutrition', 'Prevention', 'Support Group']
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'One-time']
const STATUS_OPTIONS = ['active', 'paused', 'completed']

export default function HealthPage() {
  const [programs, setPrograms] = useState<HealthProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    program_name: '',
    type: '',
    description: '',
    frequency: '',
    coordinator: '',
    participants: 0,
    impact: '',
    status: 'active',
  })

  useEffect(() => {
    fetchPrograms()
  }, [])

  async function fetchPrograms() {
    try {
      const response = await fetch('/api/health')
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

      const response = await fetch('/api/health', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          program_name: '',
          type: '',
          description: '',
          frequency: '',
          coordinator: '',
          participants: 0,
          impact: '',
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

  function handleEdit(program: HealthProgram) {
    setFormData({
      program_name: program.program_name,
      type: program.type,
      description: program.description,
      frequency: program.frequency,
      coordinator: program.coordinator,
      participants: program.participants,
      impact: program.impact,
      status: program.status,
    })
    setEditingId(program.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this program?')) {
      try {
        const response = await fetch(`/api/health?id=${id}`, {
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
          <h1 className="text-3xl font-bold text-foreground">Health & Wellness</h1>
          <p className="text-muted-foreground mt-2">Manage health and wellness programs for the congregation</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  program_name: '',
                  type: '',
                  description: '',
                  frequency: '',
                  coordinator: '',
                  participants: 0,
                  impact: '',
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
                {editingId ? 'Update program details' : 'Add a new health or wellness program'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  placeholder="e.g., Blood Pressure Screening"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Program Type</Label>
                <Select value={formData.type} onValueChange={(v) =>
                  setFormData({ ...formData, type: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    value={formData.participants}
                    onChange={(e) =>
                      setFormData({ ...formData, participants: parseInt(e.target.value) })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinator">Coordinator</Label>
                <Input
                  id="coordinator"
                  value={formData.coordinator}
                  onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                  placeholder="Program coordinator"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Input
                  id="impact"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  placeholder="Expected impact or results"
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
              No programs yet. Click &quot;New Program&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{program.program_name}</CardTitle>
                    <CardDescription>{program.type}</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      program.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : program.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
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
                    <span className="text-muted-foreground">Frequency: </span>
                    <span>{program.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{program.participants} participants</span>
                  </div>
                  {program.coordinator && (
                    <div>
                      <span className="text-muted-foreground">Coordinator: </span>
                      <span>{program.coordinator}</span>
                    </div>
                  )}
                  {program.impact && (
                    <div>
                      <span className="text-muted-foreground">Impact: </span>
                      <span>{program.impact}</span>
                    </div>
                  )}
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
