'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  BookOpen,
  Heart,
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SelectMemberModal } from '@/components/ministry/select-member-modal'
import { toast } from 'sonner'

type Candidate = {
  id: string
  member_id: string
  status: string
  mentor_id: string | null
  progress_notes: string | null
  joined_date: string | null
  baptism_date: string | null
  member?: { id: string; first_name: string; last_name: string; email?: string; phone?: string }
  mentor?: { id: string; first_name: string; last_name: string } | null
}
type ClassRow = {
  id: string
  title: string
  class_date: string
  instructor_id: string | null
  location: string | null
  max_attendees: number | null
  instructor?: { id: string; first_name: string; last_name: string } | null
}
type Baptism = {
  id: string
  baptism_date: string
  member_id: string
  officiating_elder_id: string | null
  location: string | null
  notes: string | null
  member?: { id: string; first_name: string; last_name: string }
  officiating?: { id: string; first_name: string; last_name: string } | null
}
type FollowUp = {
  id: string
  member_id: string
  follow_up_type: string
  last_contact_date: string | null
  notes: string | null
  status: string
  member?: { id: string; first_name: string; last_name: string }
}

export default function SpiritualServicePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [baptisms, setBaptisms] = useState<Baptism[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [addCandidateOpen, setAddCandidateOpen] = useState(false)
  const [addClassOpen, setAddClassOpen] = useState(false)
  const [addBaptismOpen, setAddBaptismOpen] = useState(false)
  const [addFollowUpOpen, setAddFollowUpOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [editCandidateForm, setEditCandidateForm] = useState({ status: '', progress_notes: '' })
  const [classForm, setClassForm] = useState({ title: '', class_date: '', instructor_id: '', location: '', max_attendees: '' })
  const [baptismForm, setBaptismForm] = useState({ baptism_date: '', member_id: '', member_name: '', officiating_elder_id: '', location: '', notes: '' })
  const [baptismSelectMemberOpen, setBaptismSelectMemberOpen] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ member_id: '', member_name: '', follow_up_type: 'post_salvation', last_contact_date: '', notes: '', status: 'ongoing' })
  const [followUpSelectMemberOpen, setFollowUpSelectMemberOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [classSearch, setClassSearch] = useState('')

  const fetchCandidates = () => fetch('/api/spiritual-candidates' + (statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '')).then(r => r.ok ? r.json() : []).then(setCandidates)
  const fetchClasses = () => fetch('/api/spiritual-classes').then(r => r.ok ? r.json() : []).then(setClasses)
  const fetchBaptisms = () => fetch('/api/baptisms').then(r => r.ok ? r.json() : []).then(setBaptisms)
  const fetchFollowUps = () => fetch('/api/spiritual-follow-ups').then(r => r.ok ? r.json() : []).then(setFollowUps)

  useEffect(() => {
    Promise.all([fetchCandidates(), fetchClasses(), fetchBaptisms(), fetchFollowUps()]).finally(() => setLoading(false))
  }, [statusFilter])

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return candidates
    const s = searchTerm.toLowerCase()
    return candidates.filter(c => {
      const m = c.member
      const name = m ? `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase() : ''
      return name.includes(s) || (c.status || '').toLowerCase().includes(s)
    })
  }, [candidates, searchTerm])

  const filteredClasses = useMemo(() => {
    if (!classSearch.trim()) return classes
    return classes.filter(c => (c.title || '').toLowerCase().includes(classSearch.toLowerCase()))
  }, [classes, classSearch])

  const handleAddCandidate = (profile: { id: string; first_name: string; last_name: string }) => {
    setSaving(true)
    fetch('/api/spiritual-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: profile.id, status: 'salvation_candidate' }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (ok) {
          toast.success('Candidate added')
          setAddCandidateOpen(false)
          fetchCandidates()
        } else toast.error(data?.error || 'Failed to add candidate')
      })
      .finally(() => setSaving(false))
  }

  const handleUpdateCandidate = () => {
    if (!editingCandidate) return
    setSaving(true)
    fetch(`/api/spiritual-candidates/${editingCandidate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: editCandidateForm.status || undefined, progress_notes: editCandidateForm.progress_notes || undefined }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok }) => {
        if (ok) {
          toast.success('Candidate updated')
          setEditingCandidate(null)
          fetchCandidates()
        } else toast.error('Failed to update')
      })
      .finally(() => setSaving(false))
  }

  const handleRemoveCandidate = (id: string) => {
    if (!confirm('Remove this candidate from the list?')) return
    fetch(`/api/spiritual-candidates/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { toast.success('Removed'); fetchCandidates() } else { toast.error('Failed to remove') } })
  }

  const handleAddClass = () => {
    if (!classForm.title || !classForm.class_date) {
      toast.error('Title and date required')
      return
    }
    setSaving(true)
    fetch('/api/spiritual-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: classForm.title,
        class_date: classForm.class_date,
        instructor_id: classForm.instructor_id || null,
        location: classForm.location || null,
        max_attendees: classForm.max_attendees ? parseInt(classForm.max_attendees, 10) : null,
      }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok }) => {
        if (ok) {
          toast.success('Class scheduled')
          setAddClassOpen(false)
          setClassForm({ title: '', class_date: '', instructor_id: '', location: '', max_attendees: '' })
          fetchClasses()
        } else toast.error('Failed to add class')
      })
      .finally(() => setSaving(false))
  }

  const handleAddBaptism = (profile?: { id: string } | null) => {
    const member_id = profile?.id || baptismForm.member_id
    if (!baptismForm.baptism_date || !member_id) {
      toast.error('Date and member required')
      return
    }
    setSaving(true)
    fetch('/api/baptisms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baptism_date: baptismForm.baptism_date,
        member_id,
        officiating_elder_id: baptismForm.officiating_elder_id || null,
        location: baptismForm.location || null,
        notes: baptismForm.notes || null,
      }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok }) => {
        if (ok) {
          toast.success('Baptism recorded')
          setAddBaptismOpen(false)
          setBaptismForm({ baptism_date: '', member_id: '', member_name: '', officiating_elder_id: '', location: '', notes: '' })
          fetchBaptisms()
          fetchCandidates()
        } else toast.error('Failed to add baptism')
      })
      .finally(() => setSaving(false))
  }

  const handleAddFollowUp = (profile?: { id: string } | null) => {
    const member_id = profile?.id || followUpForm.member_id
    if (!member_id) {
      toast.error('Select a member')
      return
    }
    setSaving(true)
    fetch('/api/spiritual-follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id,
        follow_up_type: followUpForm.follow_up_type,
        last_contact_date: followUpForm.last_contact_date || null,
        notes: followUpForm.notes || null,
        status: followUpForm.status,
      }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok }) => {
        if (ok) {
          toast.success('Follow-up assigned')
          setAddFollowUpOpen(false)
          setFollowUpForm({ member_id: '', member_name: '', follow_up_type: 'post_salvation', last_contact_date: '', notes: '', status: 'ongoing' })
          fetchFollowUps()
        } else toast.error('Failed to add follow-up')
      })
      .finally(() => setSaving(false))
  }

  const statusLabel = (s: string) => s === 'baptized' ? 'Baptized' : s === 'baptism_ready' ? 'Baptism Ready' : 'Salvation Candidate'
  const mentorName = (c: Candidate) => c.mentor ? `${c.mentor.first_name} ${c.mentor.last_name}` : '—'

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Spiritual Service</h1>
          <p className="text-slate-500 mt-2">Oversees spiritual care, salvation preparation, baptism readiness, and follow-up.</p>
        </div>
        <Link href="/dashboard/members/register">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Candidate
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="candidates" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="baptisms">Baptisms</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidates..."
                className="pl-9 bg-white text-slate-900 border-slate-300"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="salvation_candidate">Salvation Candidate</option>
              <option value="baptism_ready">Baptism Ready</option>
              <option value="baptized">Baptized</option>
            </select>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddCandidateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Candidate
            </Button>
          </div>
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Candidate Registry</CardTitle>
              <CardDescription>Members in salvation preparation and baptism.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-slate-500 py-8 text-center">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200">
                      <TableHead className="text-slate-900">Name</TableHead>
                      <TableHead className="text-slate-900">Status</TableHead>
                      <TableHead className="text-slate-900">Join Date</TableHead>
                      <TableHead className="text-slate-900">Mentor</TableHead>
                      <TableHead className="text-slate-900">Progress</TableHead>
                      <TableHead className="text-right text-slate-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map(c => (
                      <TableRow key={c.id} className="border-slate-200">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{(c.member?.first_name?.[0] || '') + (c.member?.last_name?.[0] || '')}</AvatarFallback>
                            </Avatar>
                            <span>{c.member ? `${c.member.first_name} ${c.member.last_name}` : c.member_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status === 'baptized' ? 'default' : c.status === 'baptism_ready' ? 'secondary' : 'outline'}>{statusLabel(c.status)}</Badge>
                        </TableCell>
                        <TableCell>{c.joined_date || '—'}</TableCell>
                        <TableCell>{mentorName(c)}</TableCell>
                        <TableCell>{c.progress_notes || '—'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => { setEditingCandidate(c); setEditCandidateForm({ status: c.status, progress_notes: c.progress_notes || '' }) }}>Update Status</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveCandidate(c.id)}>Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loading && filteredCandidates.length === 0 && <p className="text-slate-500 py-8 text-center">No candidates found.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input placeholder="Search classes..." className="max-w-sm bg-white text-slate-900" value={classSearch} onChange={e => setClassSearch(e.target.value)} />
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddClassOpen(true)}><Calendar className="mr-2 h-4 w-4" /> Schedule Class</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map(cls => (
              <Card key={cls.id} className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">{cls.title}</CardTitle>
                  <CardDescription>Instructor: {cls.instructor ? `${cls.instructor.first_name} ${cls.instructor.last_name}` : '—'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{cls.class_date}</div>
                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{cls.location || '—'}</div>
                    {cls.max_attendees != null && <div className="flex items-center gap-2"><Users className="h-4 w-4" />Max {cls.max_attendees}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {!loading && filteredClasses.length === 0 && <p className="text-slate-500 py-8 text-center">No classes scheduled.</p>}
        </TabsContent>

        <TabsContent value="baptisms" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddBaptismOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Baptism</Button>
          </div>
          <Card className="bg-white border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">Baptism Records</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-900">Date</TableHead>
                    <TableHead className="text-slate-900">Member</TableHead>
                    <TableHead className="text-slate-900">Officiating</TableHead>
                    <TableHead className="text-slate-900">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baptisms.map(b => (
                    <TableRow key={b.id}>
                      <TableCell>{b.baptism_date}</TableCell>
                      <TableCell>{b.member ? `${b.member.first_name} ${b.member.last_name}` : b.member_id}</TableCell>
                      <TableCell>{b.officiating ? `${b.officiating.first_name} ${b.officiating.last_name}` : '—'}</TableCell>
                      <TableCell>{b.location || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!loading && baptisms.length === 0 && <p className="text-slate-500 py-8 text-center">No baptism records.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setAddFollowUpOpen(true)}><Heart className="mr-2 h-4 w-4" /> Assign Follow-up</Button>
          </div>
          <Dialog open={addFollowUpOpen} onOpenChange={setAddFollowUpOpen}>
            <DialogContent className="bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Assign follow-up</DialogTitle>
                <DialogDescription>Select member and set follow-up type and status.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-700">Member *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input className="bg-white text-slate-900 flex-1" value={followUpForm.member_name} readOnly placeholder="Select member" />
                    <Button type="button" variant="outline" onClick={() => setFollowUpSelectMemberOpen(true)}>Select member</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Type</Label>
                  <select className="w-full mt-1 rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2" value={followUpForm.follow_up_type} onChange={e => setFollowUpForm(f => ({ ...f, follow_up_type: e.target.value }))}>
                    <option value="post_salvation">Post-Salvation</option>
                    <option value="post_baptism">Post-Baptism</option>
                  </select>
                </div>
                <div><Label className="text-slate-700">Last contact date</Label><Input type="date" className="mt-1 bg-white text-slate-900" value={followUpForm.last_contact_date} onChange={e => setFollowUpForm(f => ({ ...f, last_contact_date: e.target.value }))} /></div>
                <div><Label className="text-slate-700">Notes</Label><Input className="mt-1 bg-white text-slate-900" value={followUpForm.notes} onChange={e => setFollowUpForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <div>
                  <Label className="text-slate-700">Status</Label>
                  <select className="w-full mt-1 rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2" value={followUpForm.status} onChange={e => setFollowUpForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddFollowUpOpen(false)}>Cancel</Button>
                <Button onClick={() => handleAddFollowUp(null)} disabled={saving || !followUpForm.member_id}>{saving ? 'Saving...' : 'Assign'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Card className="bg-white border-slate-200">
            <CardHeader><CardTitle className="text-slate-900">Follow-up Tasks</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-900">Name</TableHead>
                    <TableHead className="text-slate-900">Type</TableHead>
                    <TableHead className="text-slate-900">Last Contact</TableHead>
                    <TableHead className="text-slate-900">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.member ? `${f.member.first_name} ${f.member.last_name}` : f.member_id}</TableCell>
                      <TableCell>{f.follow_up_type === 'post_baptism' ? 'Post-Baptism' : 'Post-Salvation'}</TableCell>
                      <TableCell>{f.last_contact_date || '—'}</TableCell>
                      <TableCell><Badge variant={f.status === 'completed' ? 'default' : 'secondary'}>{f.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!loading && followUps.length === 0 && <p className="text-slate-500 py-8 text-center">No follow-up tasks.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Follow-up: add Select Member modal */}
      <SelectMemberModal
        open={followUpSelectMemberOpen}
        onOpenChange={setFollowUpSelectMemberOpen}
        onSelect={p => {
          setFollowUpForm(f => ({ ...f, member_id: p.id, member_name: `${p.first_name} ${p.last_name}` }))
          setFollowUpSelectMemberOpen(false)
        }}
        title="Select member for follow-up"
        description="Choose the member to assign follow-up."
      />

      <SelectMemberModal open={addCandidateOpen} onOpenChange={setAddCandidateOpen} onSelect={handleAddCandidate} title="Add candidate" description="Select a church member to add as salvation/baptism candidate." />

      <Dialog open={!!editingCandidate} onOpenChange={o => !o && setEditingCandidate(null)}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Update candidate</DialogTitle>
            <DialogDescription>{editingCandidate?.member ? `${editingCandidate.member.first_name} ${editingCandidate.member.last_name}` : ''}</DialogDescription>
          </DialogHeader>
          {editingCandidate && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700">Status</Label>
                <select className="w-full mt-1 rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2" value={editCandidateForm.status} onChange={e => setEditCandidateForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="salvation_candidate">Salvation Candidate</option>
                  <option value="baptism_ready">Baptism Ready</option>
                  <option value="baptized">Baptized</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-700">Progress notes</Label>
                <Input className="mt-1 bg-white text-slate-900" value={editCandidateForm.progress_notes} onChange={e => setEditCandidateForm(f => ({ ...f, progress_notes: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCandidate(null)}>Cancel</Button>
            <Button onClick={handleUpdateCandidate} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Schedule class</DialogTitle>
            <DialogDescription>Add a salvation or baptism preparation class.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-700">Title *</Label><Input className="mt-1 bg-white text-slate-900" value={classForm.title} onChange={e => setClassForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Salvation Basics" /></div>
            <div><Label className="text-slate-700">Date *</Label><Input type="date" className="mt-1 bg-white text-slate-900" value={classForm.class_date} onChange={e => setClassForm(f => ({ ...f, class_date: e.target.value }))} /></div>
            <div><Label className="text-slate-700">Location</Label><Input className="mt-1 bg-white text-slate-900" value={classForm.location} onChange={e => setClassForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label className="text-slate-700">Max attendees</Label><Input type="number" className="mt-1 bg-white text-slate-900" value={classForm.max_attendees} onChange={e => setClassForm(f => ({ ...f, max_attendees: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClassOpen(false)}>Cancel</Button>
            <Button onClick={handleAddClass} disabled={saving || !classForm.title || !classForm.class_date}>{saving ? 'Saving...' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addBaptismOpen} onOpenChange={setAddBaptismOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Record baptism</DialogTitle>
            <DialogDescription>Select member and enter baptism details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-700">Baptism date *</Label><Input type="date" className="mt-1 bg-white text-slate-900" value={baptismForm.baptism_date} onChange={e => setBaptismForm(f => ({ ...f, baptism_date: e.target.value }))} /></div>
            <div>
              <Label className="text-slate-700">Member *</Label>
              <div className="flex gap-2 mt-1">
                <Input className="bg-white text-slate-900 flex-1" value={baptismForm.member_name} readOnly placeholder="Select member" />
                <Button type="button" variant="outline" onClick={() => setBaptismSelectMemberOpen(true)}>Select member</Button>
              </div>
            </div>
            <div><Label className="text-slate-700">Location</Label><Input className="mt-1 bg-white text-slate-900" value={baptismForm.location} onChange={e => setBaptismForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div><Label className="text-slate-700">Notes</Label><Input className="mt-1 bg-white text-slate-900" value={baptismForm.notes} onChange={e => setBaptismForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBaptismOpen(false)}>Cancel</Button>
            <Button onClick={() => handleAddBaptism(null)} disabled={saving || !baptismForm.baptism_date || !baptismForm.member_id}>
              {saving ? 'Saving...' : 'Record baptism'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SelectMemberModal
        open={baptismSelectMemberOpen}
        onOpenChange={setBaptismSelectMemberOpen}
        onSelect={p => {
          setBaptismForm(f => ({ ...f, member_id: p.id, member_name: `${p.first_name} ${p.last_name}` }))
          setBaptismSelectMemberOpen(false)
        }}
        title="Select member for baptism"
        description="Choose the member who was baptized."
      />
    </div>
  )
}
