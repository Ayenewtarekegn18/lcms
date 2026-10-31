'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { readApiError } from '@/lib/api/client-errors'
import type { Tables } from '@/lib/database.types'

type Ministry = Tables<'ministries'>

const EMPTY_FORM = { name: '', description: '', meeting_day: '', meeting_time: '' }
const byName = (a: Ministry, b: Ministry) => a.name.localeCompare(b.name)

// Reads and writes go through /api/ministries (requireRole + zod); RLS lets staff write.
export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const fetchMinistries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ministries?active=true')
      if (!res.ok) {
        setFailed(true)
        toast.error((await readApiError(res, 'Could not load the ministries.')).message)
        return
      }
      setMinistries(await res.json())
      setFailed(false)
    } catch {
      setFailed(true)
      toast.error('Could not load the ministries. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMinistries()
  }, [fetchMinistries])

  const openAddModal = () => {
    setFormData(EMPTY_FORM)
    setModalOpen(true)
  }

  const handleAddMinistry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/ministries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const { message } = await readApiError(res, 'Could not add the ministry.')
        toast.error(res.status === 409 ? 'A ministry with that name already exists.' : message)
        return
      }
      const created: Ministry = await res.json()
      setMinistries((list) => [...list, created].sort(byName))
      setModalOpen(false)
      toast.success(`Added ${created.name}`)
    } catch {
      toast.error('Could not add the ministry. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof EMPTY_FORM) => ({
    id: `ministry-${key}`,
    value: formData[key],
    disabled: saving,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((p) => ({ ...p, [key]: e.target.value })),
  })

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Ministries</h1>
        <p className="text-slate-500 mt-2">Manage church ministries and their activities</p>
      </div>

      <div className="mb-6">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={openAddModal}
        >
          + Add Ministry
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!saving) setModalOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddMinistry} noValidate>
            <DialogHeader>
              <DialogTitle>Add Ministry</DialogTitle>
              <DialogDescription>Create a new ministry. Name is required.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ministry-name">Name *</Label>
                <Input {...field('name')} maxLength={200} placeholder="e.g. Youth Ministry" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ministry-description">Description</Label>
                <Textarea {...field('description')} maxLength={5000} placeholder="Brief description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ministry-meeting_day">Meeting day</Label>
                  <Input {...field('meeting_day')} maxLength={50} placeholder="e.g. Sunday" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ministry-meeting_time">Meeting time</Label>
                  <Input {...field('meeting_time')} maxLength={50} placeholder="e.g. 10:00 AM" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name.trim() || saving}>
                {saving ? 'Saving...' : 'Add Ministry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Ministries</CardTitle>
          <CardDescription>{loading && ministries.length === 0 ? 'Loading…' : `${ministries.length} active ministries`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && ministries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading ministries...</p>
            </div>
          ) : failed && ministries.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-slate-500">The ministries could not be loaded.</p>
              <Button variant="outline" onClick={fetchMinistries} disabled={loading}>Try again</Button>
            </div>
          ) : ministries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No ministries yet. Use + Add Ministry to create the first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Schedule</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ministries.map((ministry) => (
                    <tr key={ministry.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {ministry.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ministry.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {[ministry.meeting_day, ministry.meeting_time].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          <span className="w-2 h-2 bg-blue-600 rounded-full" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
