'use client'

import { useEffect, useId, useMemo } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MemberPicker } from '@/components/app/member-picker'
import { useApiMutation } from '@/components/app/use-api'
import { formSchema, initialValues, optionsOf, toPayload, visibleFields, type FieldConfig, type FormMode, type FormValues } from '@/lib/forms/fields'
import { cn } from '@/lib/utils'

export const selectClass =
  'h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:opacity-50'

type EntityFormDialogProps<T> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: readonly FieldConfig[]
  /** POST to add a row, PATCH to change one (fields marked createOnly are left out when changing). */
  method: 'POST' | 'PATCH'
  /** e.g. '/api/choir-songs' to add, '/api/choir-songs/<id>' to change. */
  url: string
  /** The row being changed: the inputs start with its values. */
  row?: Record<string, unknown> | null
  /** Values sent along that have no input, e.g. `{ ministry_id }`. */
  extra?: Record<string, unknown>
  submitLabel?: string
  /** Toasts: 'Song added' / 'Could not add the song.' */
  successMessage: string
  failureMessage: string
  onSaved: (saved: T) => void
}

/**
 * A form in a dialog, built from a field list (lib/forms/fields.ts): react-hook-form with a zod schema
 * made from the fields, errors next to the inputs (also the ones the API reports), the submit button
 * disabled while saving, and a toast for the outcome.
 *
 *   <EntityFormDialog open={adding} onOpenChange={setAdding} title="Add song" method="POST" url="/api/choir-songs"
 *     fields={[{ name: 'title', label: 'Title', type: 'text', required: true }]}
 *     successMessage="Song added" failureMessage="Could not add the song." onSaved={() => songs.reload()} />
 */
export function EntityFormDialog<T = unknown>(props: EntityFormDialogProps<T>) {
  const { open, onOpenChange, title, description, fields, method, url, row, extra, submitLabel, successMessage, failureMessage, onSaved } = props
  const mode: FormMode = method === 'POST' ? 'create' : 'edit'
  const shown = useMemo(() => visibleFields(fields, mode), [fields, mode])
  const resolver = useMemo(() => zodResolver(formSchema(fields, mode)) as unknown as Resolver<FormValues>, [fields, mode])
  const { mutate, pending } = useApiMutation()
  const idPrefix = useId()

  const { register, control, handleSubmit, reset, setError, formState: { errors } } = useForm<FormValues>({ resolver })

  // Fresh values each time the dialog opens.
  useEffect(() => {
    if (open) reset(initialValues(fields, mode, row))
  }, [open, fields, mode, row, reset])

  const submit = handleSubmit(async (values) => {
    const result = await mutate<T>(url, { method, body: { ...toPayload(fields, mode, values), ...extra }, success: successMessage, failure: failureMessage })
    if (result.ok) {
      onSaved(result.data)
      onOpenChange(false)
      return
    }
    for (const [name, message] of Object.entries(result.fieldErrors)) {
      if (shown.some((f) => f.name === name)) setError(name, { message })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!pending) onOpenChange(o) }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shown.map((f) => {
            const id = `${idPrefix}-${f.name}`
            const error = errors[f.name]?.message
            const errorId = error ? `${id}-error` : undefined
            const hintId = f.help ? `${id}-hint` : undefined
            const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined
            const common = { id, 'aria-invalid': !!error, 'aria-describedby': describedBy, disabled: pending }

            let input
            switch (f.type) {
              case 'textarea':
                input = <Textarea {...common} rows={3} maxLength={f.maxLength ?? 5000} placeholder={f.placeholder} {...register(f.name)} />
                break
              case 'select':
                input = (
                  <select {...common} className={selectClass} {...register(f.name)}>
                    {!f.required && <option value="">—</option>}
                    {f.required && <option value="" disabled>Choose…</option>}
                    {optionsOf(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )
                break
              case 'member':
                input = (
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <MemberPicker id={id} value={String(field.value ?? '')} onChange={field.onChange} invalid={!!error} describedBy={describedBy} disabled={pending} />
                    )}
                  />
                )
                break
              case 'checkbox':
                input = (
                  <label htmlFor={id} className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" {...common} className="size-4 accent-primary" {...register(f.name)} />
                    {f.label}
                  </label>
                )
                break
              default:
                input = (
                  <Input
                    {...common}
                    type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : f.type}
                    inputMode={f.type === 'number' ? (f.step ? 'decimal' : 'numeric') : undefined}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    maxLength={f.type === 'text' || f.type === 'url' ? f.maxLength ?? 200 : undefined}
                    placeholder={f.placeholder}
                    {...register(f.name)}
                  />
                )
            }

            return (
              <div key={f.name} className={cn('space-y-1.5', f.width !== 'half' && 'sm:col-span-2')}>
                {f.type !== 'checkbox' && (
                  <Label htmlFor={id} className="text-foreground">
                    {f.label}{f.required && <span aria-hidden> *</span>}
                  </Label>
                )}
                {input}
                {f.help && <p id={hintId} className="text-xs text-muted-foreground">{f.help}</p>}
                {error && <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>}
              </div>
            )
          })}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Saving…' : submitLabel ?? (mode === 'create' ? 'Add' : 'Save changes')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
