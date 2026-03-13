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
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'

interface MediaContent {
  id: string
  content_title: string
  content_type: string
  date_created: string
  responsible_person: string
  platform: string
  status: string
  description: string
  created_at: string
}

const CONTENT_TYPES = ['Video', 'Photo', 'Announcement', 'Newsletter', 'Testimonial', 'Other']
const PLATFORMS = ['Website', 'Social Media', 'Email', 'App', 'All']
const STATUS_OPTIONS = ['draft', 'published', 'archived']

export default function MediaPage() {
  const [content, setContent] = useState<MediaContent[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    content_title: '',
    content_type: '',
    date_created: '',
    responsible_person: '',
    platform: '',
    status: 'draft',
    description: '',
  })

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const data = await response.json()
        setContent(data)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/media', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          content_title: '',
          content_type: '',
          date_created: '',
          responsible_person: '',
          platform: '',
          status: 'draft',
          description: '',
        })
        setEditingId(null)
        setOpen(false)
        await fetchContent()
      }
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  function handleEdit(item: MediaContent) {
    setFormData({
      content_title: item.content_title,
      content_type: item.content_type,
      date_created: item.date_created,
      responsible_person: item.responsible_person,
      platform: item.platform,
      status: item.status,
      description: item.description,
    })
    setEditingId(item.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this content?')) {
      try {
        const response = await fetch(`/api/media?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchContent()
        }
      } catch (error) {
        console.error('Error deleting content:', error)
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
          <h1 className="text-3xl font-bold text-foreground">Media & Communications</h1>
          <p className="text-muted-foreground mt-2">Manage church media and communications</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  content_title: '',
                  content_type: '',
                  date_created: '',
                  responsible_person: '',
                  platform: '',
                  status: 'draft',
                  description: '',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Content' : 'Create New Content'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update content details' : 'Add new media content'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Content Title</Label>
                <Input
                  id="title"
                  value={formData.content_title}
                  onChange={(e) =>
                    setFormData({ ...formData, content_title: e.target.value })
                  }
                  placeholder="Content title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Content Type</Label>
                <Select value={formData.content_type} onValueChange={(v) =>
                  setFormData({ ...formData, content_type: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date Created</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date_created}
                  onChange={(e) => setFormData({ ...formData, date_created: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsible Person</Label>
                <Input
                  id="responsible"
                  value={formData.responsible_person}
                  onChange={(e) =>
                    setFormData({ ...formData, responsible_person: e.target.value })
                  }
                  placeholder="Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(v) =>
                  setFormData({ ...formData, platform: v })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Content description"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Update Content' : 'Create Content'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {content.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No content yet. Click &quot;New Content&quot; to add some.
            </CardContent>
          </Card>
        ) : (
          content.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.content_title}</CardTitle>
                    <CardDescription>{item.content_type}</CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      item.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>{new Date(item.date_created).toLocaleDateString()}</span>
                  </div>
                  {item.platform && (
                    <div>
                      <span className="text-muted-foreground">Platform: </span>
                      <span>{item.platform}</span>
                    </div>
                  )}
                  {item.responsible_person && (
                    <div>
                      <span className="text-muted-foreground">By: </span>
                      <span>{item.responsible_person}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
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
