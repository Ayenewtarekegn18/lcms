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

interface CommunityProject {
  id: string
  project_name: string
  category: string
  description: string
  start_date: string
  end_date: string
  coordinator: string
  volunteers: number
  beneficiaries: string
  status: string
  created_at: string
}

const CATEGORIES = ['Outreach', 'Food Bank', 'Elderly Care', 'Disaster Relief', 'Education', 'Housing', 'Other']
const STATUS_OPTIONS = ['planning', 'active', 'completed', 'paused']

export default function CommunityPage() {
  const [projects, setProjects] = useState<CommunityProject[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    project_name: '',
    category: '',
    description: '',
    start_date: '',
    end_date: '',
    coordinator: '',
    volunteers: 0,
    beneficiaries: '',
    status: 'planning',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const response = await fetch('/api/community')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/community', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          project_name: '',
          category: '',
          description: '',
          start_date: '',
          end_date: '',
          coordinator: '',
          volunteers: 0,
          beneficiaries: '',
          status: 'planning',
        })
        setEditingId(null)
        setOpen(false)
        await fetchProjects()
      }
    } catch (error) {
      console.error('Error saving project:', error)
    }
  }

  function handleEdit(project: CommunityProject) {
    setFormData({
      project_name: project.project_name,
      category: project.category,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      coordinator: project.coordinator,
      volunteers: project.volunteers,
      beneficiaries: project.beneficiaries,
      status: project.status,
    })
    setEditingId(project.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/community?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchProjects()
        }
      } catch (error) {
        console.error('Error deleting project:', error)
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
          <h1 className="text-3xl font-bold text-foreground">Community Service</h1>
          <p className="text-muted-foreground mt-2">Manage community outreach and service projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  project_name: '',
                  category: '',
                  description: '',
                  start_date: '',
                  end_date: '',
                  coordinator: '',
                  volunteers: 0,
                  beneficiaries: '',
                  status: 'planning',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update project details' : 'Add a new community service project'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="Project name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(v) =>
                  setFormData({ ...formData, category: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
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
                  placeholder="Project details"
                  rows={3}
                />
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
                <Label htmlFor="coordinator">Coordinator</Label>
                <Input
                  id="coordinator"
                  value={formData.coordinator}
                  onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                  placeholder="Project coordinator"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volunteers">Volunteers</Label>
                <Input
                  id="volunteers"
                  type="number"
                  value={formData.volunteers}
                  onChange={(e) =>
                    setFormData({ ...formData, volunteers: parseInt(e.target.value) })
                  }
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiaries">Beneficiaries</Label>
                <Input
                  id="beneficiaries"
                  value={formData.beneficiaries}
                  onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                  placeholder="Target beneficiaries"
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
                {editingId ? 'Update Project' : 'Create Project'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No projects yet. Click &quot;New Project&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    <CardDescription>{project.category}</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'planning'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} -{' '}
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-muted-foreground" />
                    <span>{project.volunteers} volunteers</span>
                  </div>
                  {project.coordinator && (
                    <div>
                      <span className="text-muted-foreground">Coordinator: </span>
                      <span>{project.coordinator}</span>
                    </div>
                  )}
                  {project.beneficiaries && (
                    <div>
                      <span className="text-muted-foreground">Beneficiaries: </span>
                      <span>{project.beneficiaries}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
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
