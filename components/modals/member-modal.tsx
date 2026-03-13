'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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

interface MemberModalProps {
  isOpen: boolean
  onClose: () => void
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    birthday: string
    address: string
    ministry: string
    spouse_name?: string
    children_count?: number
    emergency_contact?: string
    emergency_phone?: string
  }
  onSave: (data: any) => void
}

export function MemberModal({ isOpen, onClose, member, onSave }: MemberModalProps) {
  const [formData, setFormData] = useState(
    member || {
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
    }
  )

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">{member ? 'Edit Member' : 'Add New Member'}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {member ? 'Update member information' : 'Add a new church member to the system'}
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
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="John"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-slate-700">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="birthday" className="text-slate-700">
                  Birthday
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => handleChange('birthday', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ministry" className="text-slate-700">
                  Primary Ministry
                </Label>
                <select
                  id="ministry"
                  value={formData.ministry}
                  onChange={(e) => handleChange('ministry', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Select Ministry</option>
                  <option value="spiritual-service">Spiritual Service</option>
                  <option value="teaching">Teaching & Seminar</option>
                  <option value="women">Women&apos;s Ministry</option>
                  <option value="youth">Youth Ministry</option>
                  <option value="children">Children Ministry</option>
                  <option value="mission">Mission Ministry</option>
                  <option value="marriage-family">Marriage & Family</option>
                  <option value="prayer">Prayer Groups</option>
                  <option value="admin">Administration</option>
                  <option value="worship">Stage & Worship</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address" className="text-slate-700">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St, City, State 12345"
                className="mt-1"
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
                  onChange={(e) => handleChange('spouse_name', e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1"
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
                  onChange={(e) => handleChange('children_count', parseInt(e.target.value))}
                  className="mt-1"
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
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="Emergency Contact Name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="emergency_phone" className="text-slate-700">
                  Contact Phone
                </Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone || ''}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {member ? 'Update Member' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
