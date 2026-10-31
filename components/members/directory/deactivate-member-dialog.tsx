'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { readApiError } from '@/lib/api/client-errors'
import { memberName, type DirectoryMember } from '@/lib/members/directory'

interface DeactivateMemberDialogProps {
  member: DirectoryMember
  onClose: () => void
  onDeactivated: (id: string) => void
}

/** Confirms, then deactivates through DELETE /api/members/[id] (the profile is kept, is_active = false). */
export function DeactivateMemberDialog({ member, onClose, onDeactivated }: DeactivateMemberDialogProps) {
  const [working, setWorking] = useState(false)
  const name = memberName(member)

  const deactivate = async () => {
    setWorking(true)
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error((await readApiError(res, `Could not deactivate ${name}.`)).message)
        return
      }
      toast.success(`${name} was deactivated`)
      onDeactivated(member.id)
    } catch {
      toast.error(`Could not deactivate ${name}. Check your connection and try again.`)
    } finally {
      setWorking(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !working) onClose() }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Deactivate {name}?</DialogTitle>
          <DialogDescription className="text-slate-600">
            They will no longer appear in the members directory, and their account, if they have one, loses
            access to the app. Their records and history are kept.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={working}>Cancel</Button>
          <Button variant="destructive" onClick={deactivate} disabled={working}>
            {working ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
