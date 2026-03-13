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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { logAudit } from '@/lib/audit'
import { toast } from 'sonner'

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [members, setMembers] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [events, setEvents] = useState<{ id: string; title: string; event_date: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    member_id: '',
    event_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    status: 'present',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAttendance()
  }, [])

  useEffect(() => {
    if (modalOpen) {
      fetchMembers()
      fetchEvents()
    }
  }, [modalOpen])

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('attendance_date', { ascending: false })
        .limit(100)

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name')
      if (error) throw error
      setMembers(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date')
        .order('event_date', { ascending: false })
        .limit(50)
      if (error) throw error
      setEvents(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const openRecordModal = () => {
    setFormData({
      member_id: '',
      event_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      status: 'present',
    })
    setModalOpen(true)
  }

  const handleRecordAttendance = async () => {
    if (!formData.member_id) return
    setSaving(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: formData.member_id,
          event_id: formData.event_id || null,
          attendance_date: formData.attendance_date,
          status: formData.status,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      const data = await res.json()
      await logAudit({ action: 'create', resource_type: 'attendance', resource_id: Array.isArray(data) ? data[0]?.id : data?.id, details: { member_id: formData.member_id, date: formData.attendance_date } })
      setModalOpen(false)
      fetchAttendance()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to record attendance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500 mt-2">Track member attendance records</p>
      </div>

      <div className="mb-6">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={openRecordModal}
        >
          + Record Attendance
        </Button>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>Record a member&apos;s attendance for a date (and optionally an event).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Member *</Label>
              <Select
                value={formData.member_id}
                onValueChange={(v) => setFormData((p) => ({ ...p, member_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Event (optional)</Label>
              <Select
                value={formData.event_id || '_none'}
                onValueChange={(v) => setFormData((p) => ({ ...p, event_id: v === '_none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— General / No event —</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} ({e.event_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.attendance_date}
                onChange={(e) => setFormData((p) => ({ ...p, attendance_date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordAttendance}
              disabled={!formData.member_id || saving}
            >
              {saving ? 'Saving...' : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Attendance Records</CardTitle>
          <CardDescription>{attendance.length} total records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading records...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Member</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {record.member_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(record.attendance_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status === 'present' && <span className="w-2 h-2 bg-green-600 rounded-full" />}
                          {record.status === 'absent' && <span className="w-2 h-2 bg-red-600 rounded-full" />}
                          {record.status === 'late' && <span className="w-2 h-2 bg-yellow-600 rounded-full" />}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
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
