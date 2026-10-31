'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { activeMinistries, formatDate, memberName, type DirectoryMember } from '@/lib/members/directory'

function Item({ label, value, wide }: { label: string; value: string | null | undefined; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || 'Not provided'}</p>
    </div>
  )
}

interface MemberDetailDialogProps {
  member: DirectoryMember
  canEdit: boolean
  onClose: () => void
  onEdit: () => void
}

/** The profile plus the registry record (family, emergency contact) the directory API returns. */
export function MemberDetailDialog({ member, canEdit, onClose, onEdit }: MemberDetailDialogProps) {
  const details = member.member_details
  const children = details?.children_count != null ? String(details.children_count) : null
  const emergency = [details?.emergency_name, details?.emergency_relationship && `(${details.emergency_relationship})`].filter(Boolean).join(' ')

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-2xl">{memberName(member)}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {details ? `Member number ${details.member_number}` : 'Not in the member register yet'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <Item label="Email" value={member.email} />
              <Item label="Phone" value={member.phone} />
              <Item label="Address" value={member.address} wide />
              <Item label="Ministries" value={activeMinistries(member).join(', ') || 'Not assigned'} />
              <Item label="Birthday" value={formatDate(member.date_of_birth)} />
            </div>
          </section>

          {details && (details.spouse_name || children) && (
            <section className="border-b pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" aria-hidden />
                Family Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {details.spouse_name && <Item label="Spouse Name" value={details.spouse_name} />}
                {children && <Item label="Number of Children" value={children} />}
              </div>
            </section>
          )}

          {details && (details.emergency_name || details.emergency_phone) && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-6">
                <Item label="Contact Name" value={emergency} />
                <Item label="Contact Phone" value={details.emergency_phone} />
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          {canEdit && <Button variant="outline" onClick={onEdit}>Edit</Button>}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
