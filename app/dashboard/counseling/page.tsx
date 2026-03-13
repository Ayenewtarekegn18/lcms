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
import { Plus, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react'

interface CounselingRecord {
  id: string
  member_id: string
  counselor_id: string
  session_date: string
  category: string
  summary: string
  follow_up_needed: boolean
  follow_up_date: string | null
  status: string
  created_at: string
}

const CATEGORIES = [
  'Personal Issues',
  'Marriage/Family',
  'Grief & Loss',
  'Spiritual Growth',
  'Addiction',
  'Mental Health',
  'Financial',
  'Career',
  'Other',
]

const STATUS_OPTIONS = ['ongoing', 'completed', 'referred']

export default function CounselingPage() {
  const [records, setRecords] = useState<CounselingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    member_id: '',
    counselor_id: '',
    session_date: '',
    category: '',
    summary: '',
    follow_up_needed: false,
    follow_up_date: '',
    status: 'completed',
  })

  useEffect(() => {
    fetchRecords()
  }, [])

  async function fetchRecords() {
    try {
      const response = await fetch('/api/counseling')
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...formData } : formData

      const response = await fetch('/api/counseling', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setFormData({
          member_id: '',
          counselor_id: '',
          session_date: '',
          category: '',
          summary: '',
          follow_up_needed: false,
          follow_up_date: '',
          status: 'completed',
        })
        setEditingId(null)
        setOpen(false)
        await fetchRecords()
      }
    } catch (error) {
      console.error('Error saving record:', error)
    }
  }

  function handleEdit(record: CounselingRecord) {
    setFormData({
      member_id: record.member_id,
      counselor_id: record.counselor_id,
      session_date: record.session_date,
      category: record.category,
      summary: record.summary,
      follow_up_needed: record.follow_up_needed,
      follow_up_date: record.follow_up_date || '',
      status: record.status,
    })
    setEditingId(record.id)
    setOpen(true)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`/api/counseling?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchRecords()
        }
      } catch (error) {
        console.error('Error deleting record:', error)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? (
      <CheckCircle2 size={16} className="text-green-600" />
    ) : (
      <Clock size={16} className="text-blue-600" />
    )
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Counseling Records</h1>
          <p className="text-muted-foreground mt-2">
            Manage counseling sessions and member support services
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  member_id: '',
                  counselor_id: '',
                  session_date: '',
                  category: '',
                  summary: '',
                  follow_up_needed: false,
                  follow_up_date: '',
                  status: 'completed',
                })
              }}
              className="gap-2"
            >
              <Plus size={20} />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Session' : 'Create New Session'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update session details' : 'Record a new counseling session'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-id">Member ID</Label>
                <Input
                  id="member-id"
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  placeholder="Enter member ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselor-id">Counselor ID</Label>
                <Input
                  id="counselor-id"
                  value={formData.counselor_id}
                  onChange={(e) => setFormData({ ...formData, counselor_id: e.target.value })}
                  placeholder="Enter counselor ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-date">Session Date</Label>
                <Input
                  id="session-date"
                  type="datetime-local"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
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
                <Label htmlFor="summary">Session Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Describe the counseling session"
                  rows={4}
                  required
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

              <div className="flex items-center gap-2">
                <input
                  id="follow-up"
                  type="checkbox"
                  checked={formData.follow_up_needed}
                  onChange={(e) =>
                    setFormData({ ...formData, follow_up_needed: e.target.checked })
                  }
                />
                <Label htmlFor="follow-up" className="cursor-pointer">
                  Follow-up needed
                </Label>
              </div>

              {formData.follow_up_needed && (
                <div className="space-y-2">
                  <Label htmlFor="follow-up-date">Follow-up Date</Label>
                  <Input
                    id="follow-up-date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) =>
                      setFormData({ ...formData, follow_up_date: e.target.value })
                    }
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                {editingId ? 'Update Session' : 'Create Session'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {records.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No counseling records yet. Click &quot;New Session&quot; to add one.
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <CardTitle className="text-lg">{record.category}</CardTitle>
                    </div>
                    <CardDescription>
                      Member: {record.member_id} | Counselor: {record.counselor_id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{record.summary}</p>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(record.session_date).toLocaleString()}
                  </p>
                  {record.follow_up_needed && record.follow_up_date && (
                    <p className="text-amber-600">
                      <span className="font-medium">Follow-up:</span>{' '}
                      {new Date(record.follow_up_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(record)}
                    className="gap-1"
                  >
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(record.id)}
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
