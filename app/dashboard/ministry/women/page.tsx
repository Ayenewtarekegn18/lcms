'use client'

import { useState, useMemo, useEffect } from 'react'
import { MinistryDashboard } from '@/components/ministry/ministry-dashboard'
import { SelectMemberModal } from '@/components/ministry/select-member-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Users, Heart, Calendar, TrendingUp, Search, Plus, MoreHorizontal, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'

type WomenMemberRow = { id: string; ministry_id: string; member_id: string; role: string; member?: { id: string; first_name: string; last_name: string; email?: string; phone?: string } }
type Meeting = { id: string; title: string; meeting_date: string; meeting_time?: string; location?: string; attendees_count: number; minutes_text?: string }
type Activity = { id: string; title: string; activity_date?: string; status: string; volunteers_count: number }
type Training = { id: string; title: string; training_date?: string; instructor_name?: string; registered_count: number; description?: string }

export default function WomenMinistryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [womenMinistryId, setWomenMinistryId] = useState<string | null>(null)
  const [members, setMembers] = useState<WomenMemberRow[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)

  const [viewingMember, setViewingMember] = useState<WomenMemberRow | null>(null)
  const [editingMember, setEditingMember] = useState<WomenMemberRow | null>(null)
  const [editMemberForm, setEditMemberForm] = useState({ role: '', status: 'Active' })

  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null)
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', location: '', attendees: 0 })
  const [cancelMeetingConfirm, setCancelMeetingConfirm] = useState<string | null>(null)

  const [minutesMeetingId, setMinutesMeetingId] = useState<string | null>(null)
  const [minutesText, setMinutesText] = useState('')
  const [minutesIsEditing, setMinutesIsEditing] = useState(false)

  const [proposeActivityOpen, setProposeActivityOpen] = useState(false)
  const [activityForm, setActivityForm] = useState({ title: '', date: '', status: 'proposed', volunteers: 0 })
  const [saving, setSaving] = useState(false)

  const [detailsTraining, setDetailsTraining] = useState<Training | null>(null)

  useEffect(() => {
    fetch('/api/ministries').then(r => r.ok ? r.json() : []).then((list: { id: string; name: string }[]) => {
      const w = list.find(m => m.name && m.name.toLowerCase().includes("women"))
      setWomenMinistryId(w?.id || null)
      if (w?.id) {
        fetch(`/api/ministry-members?ministry_id=${w.id}`).then(r => r.ok ? r.json() : []).then(setMembers)
      }
    })
    Promise.all([
      fetch('/api/women-meetings').then(r => r.ok ? r.json() : []),
      fetch('/api/women-activities').then(r => r.ok ? r.json() : []),
      fetch('/api/women-trainings').then(r => r.ok ? r.json() : []),
    ]).then(([m, a, t]) => {
      setMeetings(m || [])
      setActivities(a || [])
      setTrainings(t || [])
    }).finally(() => setLoading(false))
  }, [])

  const refetchMembers = () => {
    if (womenMinistryId) fetch(`/api/ministry-members?ministry_id=${womenMinistryId}`).then(r => r.ok ? r.json() : []).then(setMembers)
  }

  const metrics = [
    { label: 'Active Women Members', value: members.length, icon: <Users className="w-5 h-5 text-slate-500" /> },
    { label: 'Meetings This Month', value: meetings.length, icon: <Calendar className="w-5 h-5 text-slate-500" /> },
    { label: 'Volunteer Activities', value: activities.length, icon: <Heart className="w-5 h-5 text-slate-500" /> },
    { label: 'Participation Rate', value: '92%', icon: <TrendingUp className="w-5 h-5 text-slate-500" /> },
  ]

  const tabs = [
    { id: 'members', label: 'Members' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'activities', label: 'Activities' },
    { id: 'trainings', label: 'Trainings' },
  ]

  const memberName = (m: WomenMemberRow) => m.member ? `${m.member.first_name} ${m.member.last_name}` : m.member_id
  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          memberName(m).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.role || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [members, searchTerm]
  )

  const handleAddMemberFromChurch = (profile: { id: string; first_name: string; last_name: string; email?: string; phone?: string }) => {
    if (!womenMinistryId) { toast.error('Ministry not loaded'); return }
    if (members.some((m) => m.member_id === profile.id)) { toast.info('Member is already in the list'); return }
    setSaving(true)
    fetch('/api/ministry-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ministry_id: womenMinistryId, member_id: profile.id, role: 'Member' }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok }) => { if (ok) { toast.success('Member added'); setAddMemberModalOpen(false); refetchMembers(); } else toast.error('Failed to add'); })
      .finally(() => setSaving(false))
  }

  const handleRemoveMember = (id: string) => {
    if (!confirm('Remove this member from the ministry?')) return
    fetch(`/api/ministry-members/${id}`, { method: 'DELETE' })
      .then(r => r.ok ? (toast.success('Member removed'), refetchMembers()) : toast.error('Failed to remove'))
  }

  const openViewProfile = (member: WomenMemberRow) => setViewingMember(member)
  const openEditMember = (member: WomenMemberRow) => {
    setEditingMember(member)
    setEditMemberForm({ role: member.role || 'Member', status: 'Active' })
  }
  const saveEditMember = () => {
    if (!editingMember) return
    setSaving(true)
    fetch(`/api/ministry-members/${editingMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editMemberForm.role }),
    })
      .then(r => r.ok ? (toast.success('Member updated'), setEditingMember(null), refetchMembers()) : toast.error('Failed to update'))
      .finally(() => setSaving(false))
  }

  const openScheduleMeeting = () => {
    setEditingMeetingId(null)
    setMeetingForm({ title: '', date: '', time: '', location: '', attendees: 0 })
    setScheduleMeetingOpen(true)
  }
  const openEditMeeting = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id)
    setMeetingForm({
      title: meeting.title,
      date: meeting.meeting_date || '',
      time: meeting.meeting_time || '',
      location: meeting.location || '',
      attendees: meeting.attendees_count || 0,
    })
    setScheduleMeetingOpen(true)
  }
  const saveMeeting = () => {
    if (!meetingForm.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    if (editingMeetingId) {
      fetch(`/api/women-meetings/${editingMeetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingForm.title, meeting_date: meetingForm.date || null, meeting_time: meetingForm.time || null, location: meetingForm.location || null, attendees_count: meetingForm.attendees }),
      })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
        .then(() => { toast.success('Meeting updated'); setScheduleMeetingOpen(false); fetch('/api/women-meetings').then(r => r.json()).then(setMeetings); })
        .catch(() => toast.error('Failed to update')).finally(() => setSaving(false))
    } else {
      fetch('/api/women-meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingForm.title, meeting_date: meetingForm.date, meeting_time: meetingForm.time || null, location: meetingForm.location || null, attendees_count: meetingForm.attendees }),
      })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
        .then(() => { toast.success('Meeting scheduled'); setScheduleMeetingOpen(false); fetch('/api/women-meetings').then(r => r.json()).then(setMeetings); })
        .catch(() => toast.error('Failed to add')).finally(() => setSaving(false))
    }
  }
  const confirmCancelMeeting = (id: string) => {
    fetch(`/api/women-meetings/${id}`, { method: 'DELETE' })
      .then(r => r.ok ? (setMeetings(prev => prev.filter(m => m.id !== id)), setCancelMeetingConfirm(null), toast.success('Meeting cancelled')) : toast.error('Failed to cancel'))
  }

  const openMinutes = (meeting: Meeting) => {
    setMinutesMeetingId(meeting.id)
    setMinutesText(meeting.minutes_text || '')
    setMinutesIsEditing(false)
  }
  const saveMinutes = () => {
    if (minutesMeetingId == null) return
    setSaving(true)
    fetch(`/api/women-meetings/${minutesMeetingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes_text: minutesText }),
    })
      .then(r => r.ok ? (toast.success('Minutes saved'), setMeetings(prev => prev.map(m => m.id === minutesMeetingId ? { ...m, minutes_text: minutesText } : m)), setMinutesMeetingId(null), setMinutesIsEditing(false)) : toast.error('Failed'))
      .finally(() => setSaving(false))
  }

  const openProposeActivity = () => {
    setActivityForm({ title: '', date: '', status: 'proposed', volunteers: 0 })
    setProposeActivityOpen(true)
  }
  const saveActivity = () => {
    if (!activityForm.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    fetch('/api/women-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: activityForm.title, activity_date: activityForm.date || null, status: activityForm.status, volunteers_count: activityForm.volunteers }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then(() => { toast.success('Activity added'); setProposeActivityOpen(false); fetch('/api/women-activities').then(r => r.json()).then(setActivities); })
      .catch(() => toast.error('Failed')).finally(() => setSaving(false))
  }

  const meetingForMinutes = useMemo(() => meetings.find((m) => m.id === minutesMeetingId), [meetings, minutesMeetingId])

  return (
    <>
      <MinistryDashboard
        name="Women's Ministry"
        description="Coordinate spiritual growth, fellowship, and service among women"
        icon="👩"
        memberCount={members.length}
        lastActivity="Fellowship meeting last Wednesday"
        metrics={metrics}
        tabs={tabs}
        onAddMemberClick={() => setAddMemberModalOpen(true)}
      >
        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-4 mt-6">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-row items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Women Members Registry</h3>
                <p className="text-sm text-slate-600 mt-0.5">Track all women members and their participation</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search members..."
                    className="pl-9 w-[240px] bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddMemberModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </div>
            </div>
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Name</TableHead>
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Role</TableHead>
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Phone</TableHead>
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Status</TableHead>
                    <TableHead className="text-right bg-slate-50 font-semibold text-slate-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">Loading...</TableCell></TableRow>
                  ) : filteredMembers.map((member) => (
                    <TableRow key={member.id} className="border-slate-200 hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{memberName(member)}</TableCell>
                      <TableCell className="text-slate-600">{member.role || 'Member'}</TableCell>
                      <TableCell className="text-slate-600">{member.member?.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge className="bg-slate-900 text-white border-transparent">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-slate-200">
                            <DropdownMenuLabel className="text-slate-900">Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="text-slate-700 cursor-pointer" onSelect={() => openViewProfile(member)}>View Profile</DropdownMenuItem>
                            <DropdownMenuItem className="text-slate-700 cursor-pointer" onSelect={() => openEditMember(member)}>Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 cursor-pointer" onSelect={() => handleRemoveMember(member.id)}>Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* MEETINGS TAB */}
        <TabsContent value="meetings" className="space-y-4 mt-6">
          <div className="flex justify-end mb-4">
            <Button variant="outline" className="border-slate-300 text-slate-700 bg-white" onClick={openScheduleMeeting}>
              <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Scheduled</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-slate-200">
                        <DropdownMenuItem className="text-slate-700 cursor-pointer" onSelect={() => openEditMeeting(meeting)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer" onSelect={() => setCancelMeetingConfirm(meeting.id)}>Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-2 text-lg text-slate-900">{meeting.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-slate-600">
                    <Calendar className="h-3 w-3" /> {meeting.meeting_date} {meeting.meeting_time ? `at ${meeting.meeting_time}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium text-slate-900">{meeting.location || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendees:</span>
                      <span className="font-medium text-slate-900">{meeting.attendees_count}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Minutes:</span>
                      <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50">{meeting.minutes_text?.trim() ? 'Available' : 'Pending'}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-slate-300 text-slate-700 hover:bg-transparent hover:text-slate-700"
                    onClick={() => openMinutes(meeting)}
                  >
                    View Minutes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ACTIVITIES TAB */}
        <TabsContent value="activities" className="space-y-4 mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-slate-900">Volunteer Activities</CardTitle>
                  <CardDescription className="text-slate-600">Service projects and outreach events.</CardDescription>
                </div>
                <Button variant="outline" className="border-slate-300 text-slate-700 bg-white" onClick={openProposeActivity}>
                  <Plus className="mr-2 h-4 w-4" /> Propose Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors bg-white">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{activity.title}</h4>
                        <p className="text-sm text-slate-600">{activity.activity_date || '—'} • {activity.volunteers_count} Volunteers</p>
                      </div>
                    </div>
                    <Badge className={activity.status === 'completed' ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAININGS TAB */}
        <TabsContent value="trainings" className="space-y-4 mt-6">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Training Programs</CardTitle>
              <CardDescription className="text-slate-600">Upcoming seminars and workshops.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Topic</TableHead>
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Date</TableHead>
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Instructor</TableHead>
                    <TableHead className="bg-slate-50 font-semibold text-slate-900">Registered</TableHead>
                    <TableHead className="text-right bg-slate-50 font-semibold text-slate-900">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training) => (
                    <TableRow key={training.id} className="border-slate-200 hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{training.title}</TableCell>
                      <TableCell className="text-slate-600">{training.training_date || '—'}</TableCell>
                      <TableCell className="text-slate-600">{training.instructor_name || '—'}</TableCell>
                      <TableCell className="text-slate-600">{training.registered_count}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-slate-700 cursor-pointer" onClick={() => setDetailsTraining(training)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </MinistryDashboard>

      <SelectMemberModal open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen} onSelect={handleAddMemberFromChurch} title="Add member to Women's Ministry" description="Search and select a church member to add to this ministry." />

      {/* View Profile */}
      <Dialog open={!!viewingMember} onOpenChange={(o) => !o && setViewingMember(null)}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{viewingMember ? memberName(viewingMember) : ''}</DialogTitle>
            <DialogDescription className="text-slate-600">Member profile</DialogDescription>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Role:</span> <span className="text-slate-900">{viewingMember.role}</span></p>
              <p><span className="text-slate-500">Phone:</span> <span className="text-slate-900">{viewingMember.member?.phone || '—'}</span></p>
              <p><span className="text-slate-500">Status:</span> <span className="text-slate-900">Active</span></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingMember(null)}>Close</Button>
            {viewingMember && <Button onClick={() => { setViewingMember(null); openEditMember(viewingMember); }}>Edit Details</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(o) => !o && setEditingMember(null)}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit member</DialogTitle>
            <DialogDescription className="text-slate-600">{editingMember ? memberName(editingMember) : ''}</DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700">Role</Label>
                <Input className="mt-1 bg-white text-slate-900" value={editMemberForm.role} onChange={(e) => setEditMemberForm((f) => ({ ...f, role: e.target.value }))} />
              </div>
              <div>
                <Label className="text-slate-700">Status</Label>
                <select className="w-full mt-1 rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2" value={editMemberForm.status} onChange={(e) => setEditMemberForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button onClick={saveEditMember} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule / Edit Meeting */}
      <Dialog open={scheduleMeetingOpen} onOpenChange={setScheduleMeetingOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{editingMeetingId ? 'Edit meeting' : 'Schedule meeting'}</DialogTitle>
            <DialogDescription className="text-slate-600">Plan meetings, retreats, and trainings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700">Title</Label>
              <Input className="mt-1 bg-white text-slate-900" value={meetingForm.title} onChange={(e) => setMeetingForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekly Prayer Fellowship" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700">Date</Label>
                <Input type="date" className="mt-1 bg-white text-slate-900" value={meetingForm.date} onChange={(e) => setMeetingForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-slate-700">Time</Label>
                <Input type="time" className="mt-1 bg-white text-slate-900" value={meetingForm.time} onChange={(e) => setMeetingForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-slate-700">Location</Label>
              <Input className="mt-1 bg-white text-slate-900" value={meetingForm.location} onChange={(e) => setMeetingForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Main Hall" />
            </div>
            <div>
              <Label className="text-slate-700">Expected attendees</Label>
              <Input type="number" min={0} className="mt-1 bg-white text-slate-900" value={meetingForm.attendees || ''} onChange={(e) => setMeetingForm((f) => ({ ...f, attendees: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleMeetingOpen(false)}>Cancel</Button>
            <Button onClick={saveMeeting}>{editingMeetingId ? 'Update' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelMeetingConfirm != null} onOpenChange={(o) => !o && setCancelMeetingConfirm(null)}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Cancel meeting?</DialogTitle>
            <DialogDescription className="text-slate-600">This meeting will be removed. You can schedule a new one anytime.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelMeetingConfirm(null)}>Keep</Button>
            <Button variant="destructive" onClick={() => cancelMeetingConfirm != null && confirmCancelMeeting(cancelMeetingConfirm)}>Cancel meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Record minutes */}
      <Dialog open={minutesMeetingId != null} onOpenChange={(o) => { if (!o) setMinutesMeetingId(null); }}>
        <DialogContent className="bg-white border-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{meetingForMinutes?.title} — Minutes</DialogTitle>
            <DialogDescription className="text-slate-600">Record meeting minutes and decisions.</DialogDescription>
          </DialogHeader>
          {meetingForMinutes && (
            <div className="space-y-4">
              {minutesIsEditing ? (
                <Textarea className="min-h-[200px] bg-white text-slate-900 border-slate-300" value={minutesText} onChange={(e) => setMinutesText(e.target.value)} placeholder="Enter meeting minutes..." />
              ) : (
                <div className="min-h-[200px] rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-900 text-sm whitespace-pre-wrap">
                  {minutesText || 'No minutes recorded yet.'}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => minutesMeetingId != null && (minutesIsEditing ? setMinutesIsEditing(false) : setMinutesMeetingId(null))}>
              {minutesIsEditing ? 'Cancel' : 'Close'}
            </Button>
            {minutesIsEditing ? (
              <Button onClick={saveMinutes}>Save minutes</Button>
            ) : (
              <Button onClick={() => setMinutesIsEditing(true)}>Record / Edit minutes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propose activity */}
      <Dialog open={proposeActivityOpen} onOpenChange={setProposeActivityOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Propose activity</DialogTitle>
            <DialogDescription className="text-slate-600">Add a volunteer activity or outreach event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700">Title</Label>
              <Input className="mt-1 bg-white text-slate-900" value={activityForm.title} onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Community Cleaning" />
            </div>
            <div>
              <Label className="text-slate-700">Date</Label>
              <Input type="date" className="mt-1 bg-white text-slate-900" value={activityForm.date} onChange={(e) => setActivityForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-slate-700">Status</Label>
              <select className="w-full mt-1 rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2" value={activityForm.status} onChange={(e) => setActivityForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="proposed">Proposed</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-700">Volunteers (expected)</Label>
              <Input type="number" min={0} className="mt-1 bg-white text-slate-900" value={activityForm.volunteers || ''} onChange={(e) => setActivityForm((f) => ({ ...f, volunteers: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeActivityOpen(false)}>Cancel</Button>
            <Button onClick={saveActivity} disabled={saving || !activityForm.title?.trim()}>{saving ? 'Saving...' : 'Propose'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailsTraining} onOpenChange={(o) => !o && setDetailsTraining(null)}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{detailsTraining?.title}</DialogTitle>
            <DialogDescription className="text-slate-600">Training program details</DialogDescription>
          </DialogHeader>
          {detailsTraining && (
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Date:</span> <span className="text-slate-900">{detailsTraining.training_date || '—'}</span></p>
              <p><span className="text-slate-500">Instructor:</span> <span className="text-slate-900">{detailsTraining.instructor_name || '—'}</span></p>
              <p><span className="text-slate-500">Registered:</span> <span className="text-slate-900">{detailsTraining.registered_count}</span></p>
              {detailsTraining.description && (
                <p className="pt-2 border-t border-slate-200 text-slate-700">{detailsTraining.description}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsTraining(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
