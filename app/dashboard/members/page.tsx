'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Trash2, Eye, Mail, Phone, MapPin, Users, Heart } from 'lucide-react'
import { logAudit } from '@/lib/audit'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  birthday?: string
  address?: string
  ministry?: string
  spouse_name?: string
  children_count?: number
  emergency_contact?: string
  emergency_phone?: string
  is_active?: boolean
  created_at?: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState<Partial<Member>>({})
  const supabase = createClient()

  const buildProfilePayload = (data: Partial<Member>) => ({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    date_of_birth: data.birthday || null,
    address: data.address || null,
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      const mappedMembers: Member[] = (data || []).map((row: any) => ({
        ...row,
        birthday: row.date_of_birth ?? row.birthday,
      }))
      setMembers(mappedMembers)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingMember(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      birthday: '',
      address: '',
      ministry: '',
      spouse_name: '',
      children_count: 0,
      emergency_contact: '',
      emergency_phone: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (member: Member) => {
    setEditingMember(member)
    setFormData(member)
    setModalOpen(true)
  }

  const openDetailModal = (member: Member) => {
    setSelectedMember(member)
    setDetailModalOpen(true)
  }

  const handleSaveMember = async () => {
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('profiles')
          .update(buildProfilePayload(formData))
          .eq('id', editingMember.id)
        if (error) throw error
        await logAudit({ action: 'update', resource_type: 'member', resource_id: editingMember.id })
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert([{ ...buildProfilePayload(formData), is_active: true }])
          .select('id')
          .single()
        if (error) throw error
        await logAudit({ action: 'create', resource_type: 'member', resource_id: data?.id })
      }
      fetchMembers()
      setModalOpen(false)
    } catch (error) {
      console.error('Error saving member:', error)
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      await logAudit({ action: 'deactivate', resource_type: 'member', resource_id: id })
      fetchMembers()
    } catch (error) {
      console.error('Error deleting member:', error)
    }
  }

  const filteredMembers = members.filter(member =>
    member.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Members</h1>
        <p className="text-slate-500 mt-2">Manage church members and their information</p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <Input
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white border-slate-300 text-slate-900 placeholder-slate-400"
        />
        <Link href="/dashboard/members/register">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            + Add Member
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Members Directory</CardTitle>
          <CardDescription>{filteredMembers.length} active members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Ministry</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.ministry || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailModal(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Member Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{editingMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            <DialogDescription className="text-slate-600">
              {editingMember ? 'Update member information' : 'Add a new church member to the system'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-slate-700">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="John"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-slate-700">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Doe"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="birthday" className="text-slate-700">
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday || ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="ministry" className="text-slate-700">
                    Primary Ministry
                  </Label>
                  <select
                    id="ministry"
                    value={formData.ministry || ''}
                    onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                  >
                    <option value="">Select Ministry</option>
                    <option value="Spiritual Service">Spiritual Service</option>
                    <option value="Teaching & Seminar">Teaching & Seminar</option>
                    <option value="Women's Ministry">Women's Ministry</option>
                    <option value="Youth Ministry">Youth Ministry</option>
                    <option value="Children Ministry">Children Ministry</option>
                    <option value="Mission Ministry">Mission Ministry</option>
                    <option value="Marriage & Family">Marriage & Family</option>
                    <option value="Prayer Groups">Prayer Groups</option>
                    <option value="Administration">Administration</option>
                    <option value="Stage & Worship">Stage & Worship</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="text-slate-700">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Family Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouse_name" className="text-slate-700">
                    Spouse Name (if applicable)
                  </Label>
                  <Input
                    id="spouse_name"
                    value={formData.spouse_name || ''}
                    onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                    placeholder="Jane Doe"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="children_count" className="text-slate-700">
                    Number of Children
                  </Label>
                  <Input
                    id="children_count"
                    type="number"
                    value={formData.children_count || 0}
                    onChange={(e) => setFormData({ ...formData, children_count: parseInt(e.target.value) })}
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact" className="text-slate-700">
                    Contact Name
                  </Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Emergency Contact Name"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone" className="text-slate-700">
                    Contact Phone
                  </Label>
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingMember ? 'Update Member' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-slate-900 text-2xl">{selectedMember.first_name} {selectedMember.last_name}</DialogTitle>
                <DialogDescription className="text-slate-600">Complete member profile and information</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info Section */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-slate-900">{selectedMember.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{selectedMember.phone || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Address</p>
                      <p className="text-sm font-medium text-slate-900">{selectedMember.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Ministry</p>
                      <p className="text-sm font-medium text-slate-900">{selectedMember.ministry || 'Not assigned'}</p>
                    </div>
                    {selectedMember.birthday && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Birthday</p>
                        <p className="text-sm font-medium text-slate-900">{new Date(selectedMember.birthday).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Family Information */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Family Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {selectedMember.spouse_name && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Spouse Name</p>
                        <p className="text-sm font-medium text-slate-900">{selectedMember.spouse_name}</p>
                      </div>
                    )}
                    {selectedMember.children_count !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Number of Children</p>
                        <p className="text-sm font-medium text-slate-900">{selectedMember.children_count}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                {(selectedMember.emergency_contact || selectedMember.emergency_phone) && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {selectedMember.emergency_contact && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Contact Name</p>
                          <p className="text-sm font-medium text-slate-900">{selectedMember.emergency_contact}</p>
                        </div>
                      )}
                      {selectedMember.emergency_phone && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Contact Phone</p>
                          <p className="text-sm font-medium text-slate-900">{selectedMember.emergency_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailModalOpen(false)
                    openEditModal(selectedMember)
                  }}
                >
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
