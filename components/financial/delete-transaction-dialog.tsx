'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatBirr, formatLedgerDate, UNCATEGORIZED, type LedgerEntry } from '@/lib/financial/summary'

/** Confirms, then deletes through DELETE /api/financial/[id] (admins only, like the database rule). */
export function DeleteTransactionDialog({ entry, onClose, onDeleted }: {
  entry: LedgerEntry | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const confirm = async () => {
    if (!entry) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/financial/${entry.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Transaction deleted')
      } else if (res.status === 404) {
        toast.error('This transaction no longer exists.')
      } else {
        toast.error(res.status === 403 ? 'Only admins can delete transactions.' : body?.error ?? 'Could not delete the transaction.')
        return
      }
      onClose()
      onDeleted()
    } catch {
      toast.error('Could not reach the server. Check the connection and try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => { if (!open && !deleting) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this transaction?</DialogTitle>
          <DialogDescription>It is removed from the ledger and from the totals. This cannot be undone.</DialogDescription>
        </DialogHeader>
        {entry && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-slate-50 p-4 text-sm">
            <dt className="text-slate-500">Date</dt>
            <dd className="text-slate-900">{formatLedgerDate(entry.transaction_date)}</dd>
            <dt className="text-slate-500">Type</dt>
            <dd className="text-slate-900">{entry.transaction_type === 'income' ? 'Income' : 'Expense'}</dd>
            <dt className="text-slate-500">Category</dt>
            <dd className="text-slate-900">{entry.category || UNCATEGORIZED}</dd>
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-medium text-slate-900">{formatBirr(entry.amount)}</dd>
            {entry.description && (
              <>
                <dt className="text-slate-500">Description</dt>
                <dd className="text-slate-900 break-words">{entry.description}</dd>
              </>
            )}
          </dl>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
