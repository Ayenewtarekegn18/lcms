'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  /** Extra content between the text and the buttons, e.g. the details of what is being deleted. */
  children?: ReactNode
  confirmLabel?: string
  /** Red confirm button (default true: most confirmations are for deleting). */
  destructive?: boolean
  /** Runs the action. Return false to keep the dialog open (e.g. it failed and a toast said why). */
  onConfirm: () => Promise<boolean | void> | boolean | void
}

/**
 * Ask before doing something that can't be undone. The confirm button shows progress and both
 * buttons are disabled while the action runs.
 *
 *   <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
 *     title="Delete this song?" description="It is removed from the library." onConfirm={remove} />
 */
export function ConfirmDialog({ open, onOpenChange, title, description, children, confirmLabel = 'Delete', destructive = true, onConfirm }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      if ((await onConfirm()) !== false) onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={confirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
