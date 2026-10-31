'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Kind } from '@/lib/financial/summary'

export const CATEGORIES: Record<Kind, readonly string[]> = {
  income: ['Tithes', 'Offerings', 'Pledges', 'Donations', 'Special Offering', 'Other Income'],
  expense: [
    'Ministry Spending', 'Maintenance', 'Outreach', 'Staff Compensation', 'Administrative',
    'Utilities', 'Supplies', 'Programs', 'Other Expense',
  ],
}

type Form = { transaction_type: Kind; category: string; amount: string; transaction_date: string; description: string }
type Field = keyof Form

const blank = (today: string): Form => ({ transaction_type: 'income', category: '', amount: '', transaction_date: today, description: '' })
const selectClass = 'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white aria-invalid:border-red-500'

/** Checks the form before sending; the API applies the same rules (and is the one that counts). */
function check(form: Form): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  const amount = Number(form.amount)
  if (!form.category) errors.category = 'Choose a category.'
  if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than 0.'
  if (!form.transaction_date) errors.transaction_date = 'Choose the date.'
  return errors
}

/** Records an income or expense through POST /api/financial. Rendered once the ledger has loaded. */
export function AddTransactionDialog({ open, onOpenChange, today, onSaved }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** YYYY-MM-DD in the church's time zone (from the API). */
  today: string
  onSaved: () => void
}) {
  const [form, setForm] = useState<Form>(() => blank(today))
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends Field>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const problems = check(form)
    if (Object.keys(problems).length > 0) {
      setErrors(problems)
      toast.error('Some details need attention.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const fieldErrors: Record<string, string[] | undefined> = body?.issues?.fieldErrors ?? {}
        setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, messages]) => [k, messages?.[0]])))
        toast.error(res.status === 403 ? 'You are not allowed to record transactions.' : body?.error ?? 'Could not save the transaction.')
        return
      }
      toast.success(form.transaction_type === 'income' ? 'Income recorded' : 'Expense recorded')
      setForm(blank(today))
      setErrors({})
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error('Could not reach the server. Check the connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const error = (key: Field) =>
    errors[key] ? <p id={`${key}-error`} className="mt-1 text-xs text-red-600" role="alert">{errors[key]}</p> : null
  const invalid = (key: Field) => (errors[key] ? { 'aria-invalid': true, 'aria-describedby': `${key}-error` } : {})

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record an income or an expense, in Birr.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="transaction_type" className="text-slate-700">Type</Label>
            <select
              id="transaction_type"
              value={form.transaction_type}
              onChange={(e) => { set('transaction_type', e.target.value as Kind); set('category', '') }}
              className={selectClass}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <Label htmlFor="category" className="text-slate-700">Category</Label>
            <select id="category" value={form.category} onChange={(e) => set('category', e.target.value)} className={selectClass} {...invalid('category')}>
              <option value="">Select category</option>
              {CATEGORIES[form.transaction_type].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {error('category')}
          </div>

          <div>
            <Label htmlFor="amount" className="text-slate-700">Amount (ETB)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="0.00"
              className="mt-1"
              {...invalid('amount')}
            />
            {error('amount')}
          </div>

          <div>
            <Label htmlFor="transaction_date" className="text-slate-700">Date</Label>
            <Input
              id="transaction_date"
              type="date"
              value={form.transaction_date}
              onChange={(e) => set('transaction_date', e.target.value)}
              className="mt-1"
              {...invalid('transaction_date')}
            />
            {error('transaction_date')}
          </div>

          <div>
            <Label htmlFor="description" className="text-slate-700">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What is this for? (optional)"
              maxLength={500}
              className="mt-1"
              {...invalid('description')}
            />
            {error('description')}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving…' : 'Save transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
