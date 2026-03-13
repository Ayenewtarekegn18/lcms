'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { logAudit } from '@/lib/audit'
import { toast } from 'sonner'

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meeting_schedule: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchMinistries()
  }, [])

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMinistries(data || [])
    } catch (error) {
      console.error('Error fetching ministries:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData({ name: '', description: '', meeting_schedule: '' })
    setModalOpen(true)
  }

  const handleAddMinistry = async () => {
    if (!formData.name?.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/ministries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          meeting_schedule: formData.meeting_schedule?.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      const created = await res.json()
      await logAudit({ action: 'create', resource_type: 'ministry', resource_id: created?.id, details: { name: formData.name } })
      setModalOpen(false)
      fetchMinistries()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to add ministry')
    } finally {
      setSaving(false)
    }
  }

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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Ministry</DialogTitle>
            <DialogDescription>Create a new ministry. Name is required.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Youth Ministry"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Meeting schedule</Label>
              <Input
                value={formData.meeting_schedule}
                onChange={(e) => setFormData((p) => ({ ...p, meeting_schedule: e.target.value }))}
                placeholder="e.g. Sunday 10:00 AM"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMinistry} disabled={!formData.name?.trim() || saving}>
              {saving ? 'Saving...' : 'Add Ministry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Ministries</CardTitle>
          <CardDescription>{ministries.length} active ministries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading ministries...</p>
            </div>
          ) : ministries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No ministries found</p>
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
                        {[ministry.meeting_day, ministry.meeting_time].filter(Boolean).join(' ') || ministry.meeting_schedule || '-'}
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
