'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { readApiError } from '@/lib/api/client-errors'
import type { Tables } from '@/lib/database.types'
import { changedFields, memberName, toEditValues, type DirectoryMember, type EditField } from '@/lib/members/directory'

const FIELDS: { k: EditField; label: string; type?: string; placeholder?: string; autoComplete?: string; wide?: boolean }[] = [
  { k: 'first_name', label: 'First name *', autoComplete: 'off' },
  { k: 'last_name', label: 'Last name', autoComplete: 'off' },
  { k: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com', autoComplete: 'off' },
  { k: 'phone', label: 'Phone', type: 'tel', placeholder: '09xx xxx xxx', autoComplete: 'off' },
  { k: 'date_of_birth', label: 'Date of birth', type: 'date' },
  { k: 'address', label: 'Address', wide: true },
]

const inputClass = 'mt-1 bg-white border-slate-300 text-slate-900 placeholder-slate-400'

interface MemberEditDialogProps {
  member: DirectoryMember
  onClose: () => void
  onSaved: (profile: Tables<'profiles'>) => void
}

/** Edits a member's profile through PATCH /api/members/[id]; only changed fields are sent. */
export function MemberEditDialog({ member, onClose, onSaved }: MemberEditDialogProps) {
  const [initial] = useState(() => toEditValues(member))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Partial<Record<EditField, string>>>({})
  const [saving, setSaving] = useState(false)
  const changes = changedFields(initial, values)
  const dirty = Object.keys(changes).length > 0

  const update = (k: EditField, v: string) => {
    setValues((prev) => ({ ...prev, [k]: v }))
    setErrors((prev) => ({ ...prev, [k]: undefined }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.first_name.trim()) {
      setErrors({ first_name: 'First name is required.' })
      return
    }
    if (!dirty || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) {
        const { message, fieldErrors } = await readApiError(res, 'Could not save the changes.')
        setErrors(fieldErrors as Partial<Record<EditField, string>>)
        toast.error(message)
        return
      }
      const profile: Tables<'profiles'> = await res.json()
      toast.success(`Saved ${memberName(profile)}`)
      onSaved(profile)
    } catch {
      toast.error('Could not save the changes. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <form onSubmit={save} noValidate>
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit member</DialogTitle>
            <DialogDescription className="text-slate-600">
              {memberName(member)}
              {member.member_details ? ` · ${member.member_details.member_number}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {FIELDS.map((f) => {
              const id = `edit-${f.k}`
              const error = errors[f.k]
              const errorId = error ? `${id}-error` : undefined
              const common = {
                id,
                value: values[f.k],
                disabled: saving,
                'aria-invalid': error ? true : undefined,
                'aria-describedby': errorId,
                className: inputClass,
              }
              return (
                <div key={f.k} className={f.wide ? 'sm:col-span-2' : undefined}>
                  <Label htmlFor={id} className="text-slate-700">{f.label}</Label>
                  {f.wide ? (
                    <Textarea {...common} rows={2} onChange={(e) => update(f.k, e.target.value)} />
                  ) : (
                    <Input
                      {...common}
                      type={f.type ?? 'text'}
                      placeholder={f.placeholder}
                      autoComplete={f.autoComplete}
                      onChange={(e) => update(f.k, e.target.value)}
                    />
                  )}
                  {error && <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500">Family and emergency details from the registration form can&apos;t be changed here yet.</p>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !dirty} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
