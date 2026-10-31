'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Tables } from '@/lib/database.types'
import { errorMessage, eventsApi, type MinistryOption } from '@/lib/events/client'
import { FIELD_LIMITS, emptyEventForm, eventToForm, formToPayload, type EventFormErrors, type EventFormValues } from '@/lib/events/form'
import { EVENT_TYPES, type EventItem } from '@/lib/events/schema'
import { dayKey } from '@/lib/events/time'

const selectClass = 'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The event to edit; leave empty to add one. */
  event?: EventItem | null
  /** The day ('YYYY-MM-DD') a new event starts on; today when not given. */
  defaultDate?: string | null
  onSaved: (saved: Tables<'events'>) => void
}

/** Add or edit an event through the events API. Times are the user's local times. */
export function EventFormDialog({ open, onOpenChange, event, defaultDate, onSaved }: Props) {
  const [values, setValues] = useState<EventFormValues>(() => emptyEventForm(''))
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [ministries, setMinistries] = useState<MinistryOption[] | null>(null)
  const [ministriesFailed, setMinistriesFailed] = useState(false)

  // Fresh values each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setValues(event ? eventToForm(event) : emptyEventForm(defaultDate || dayKey(new Date())))
    setErrors({})
  }, [open, event, defaultDate])

  // Active ministries for the select; loaded on first open, tried again on the next open if it failed.
  useEffect(() => {
    if (!open || ministries) return
    let cancelled = false
    setMinistriesFailed(false)
    eventsApi
      .ministries()
      .then((list) => { if (!cancelled) setMinistries(list) })
      .catch((err) => {
        if (cancelled) return
        setMinistriesFailed(true)
        toast.error('Could not load the ministries', { description: errorMessage(err) })
      })
    return () => { cancelled = true }
  }, [open, ministries])

  const change = (field: keyof EventFormValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value
    setValues((v) => ({ ...v, [field]: value }))
    setErrors((x) => (x[field] ? { ...x, [field]: undefined } : x))
  }

  const fieldError = (field: keyof EventFormValues) =>
    errors[field] ? <p id={`event-${field}-error`} role="alert" className="mt-1 text-xs text-red-600">{errors[field]}</p> : null
  const describedBy = (field: keyof EventFormValues) => (errors[field] ? `event-${field}-error` : undefined)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const result = formToPayload(values)
    if (result.errors) {
      setErrors(result.errors)
      toast.error('Some details need attention.')
      return
    }
    setSaving(true)
    try {
      const saved = event ? await eventsApi.update(event.id, result.payload) : await eventsApi.create(result.payload)
      toast.success(event ? 'Event updated' : 'Event added')
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      toast.error(event ? 'Could not save the changes' : 'Could not add the event', { description: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  // Keep an event's current ministry and type selectable even when they aren't in the lists any more.
  const current = event?.ministry
  const ministryOptions = current && !(ministries ?? []).some((m) => m.id === current.id) ? [...(ministries ?? []), current] : ministries ?? []
  const typeOptions: string[] = EVENT_TYPES.includes(values.event_type as (typeof EVENT_TYPES)[number])
    ? [...EVENT_TYPES]
    : [values.event_type, ...EVENT_TYPES].filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Schedule New Event'}</DialogTitle>
          <DialogDescription>{event ? 'Update the event details' : 'Create a new church event'}. Times are in your time zone.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="event-title" className="text-slate-700">Title *</Label>
            <Input id="event-title" value={values.title} onChange={change('title')} maxLength={FIELD_LIMITS.title}
              placeholder="e.g., Sunday Service, Bible Study" className="mt-1"
              aria-invalid={!!errors.title} aria-describedby={describedBy('title')} />
            {fieldError('title')}
          </div>

          <div>
            <Label htmlFor="event-type" className="text-slate-700">Type</Label>
            <select id="event-type" value={values.event_type} onChange={change('event_type')} className={selectClass}>
              {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {fieldError('event_type')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-date" className="text-slate-700">Date *</Label>
              <Input id="event-date" type="date" value={values.date} onChange={change('date')} className="mt-1"
                aria-invalid={!!errors.date} aria-describedby={describedBy('date')} />
              {fieldError('date')}
            </div>
            <div>
              <Label htmlFor="event-time" className="text-slate-700">Start time *</Label>
              <Input id="event-time" type="time" value={values.time} onChange={change('time')} className="mt-1"
                aria-invalid={!!errors.time} aria-describedby={describedBy('time')} />
              {fieldError('time')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-end-date" className="text-slate-700">End date</Label>
              <Input id="event-end-date" type="date" value={values.end_date} onChange={change('end_date')} min={values.date || undefined} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="event-end-time" className="text-slate-700">End time</Label>
              <Input id="event-end-time" type="time" value={values.end_time} onChange={change('end_time')} className="mt-1"
                aria-invalid={!!errors.end_time} aria-describedby={describedBy('end_time')} />
              {fieldError('end_time')}
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-500">Optional. Leave the end date empty for an event that ends the same day.</p>

          <div>
            <Label htmlFor="event-location" className="text-slate-700">Location</Label>
            <Input id="event-location" value={values.location} onChange={change('location')} maxLength={FIELD_LIMITS.location}
              placeholder="Church location or address" className="mt-1" aria-invalid={!!errors.location} aria-describedby={describedBy('location')} />
            {fieldError('location')}
          </div>

          <div>
            <Label htmlFor="event-ministry" className="text-slate-700">Ministry (optional)</Label>
            <select id="event-ministry" value={values.ministry_id} onChange={change('ministry_id')} className={selectClass}
              aria-invalid={!!errors.ministry_id} aria-describedby={describedBy('ministry_id')}>
              <option value="">None</option>
              {ministryOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {!ministries && !ministriesFailed && <p className="mt-1 text-xs text-slate-500">Loading ministries…</p>}
            {ministriesFailed && <p className="mt-1 text-xs text-amber-700">The ministries could not be loaded. Close and open this form to try again.</p>}
            {fieldError('ministry_id')}
          </div>

          <div>
            <Label htmlFor="event-max" className="text-slate-700">Max attendees</Label>
            <Input id="event-max" type="number" inputMode="numeric" min={1} max={100000} step={1} value={values.max_attendees}
              onChange={change('max_attendees')} className="mt-1" aria-invalid={!!errors.max_attendees} aria-describedby={describedBy('max_attendees')} />
            {fieldError('max_attendees')}
          </div>

          <div>
            <Label htmlFor="event-description" className="text-slate-700">Description</Label>
            <Textarea id="event-description" value={values.description} onChange={change('description')} maxLength={FIELD_LIMITS.description}
              placeholder="Add details about this event..." className="mt-1" rows={3}
              aria-invalid={!!errors.description} aria-describedby={describedBy('description')} />
            {fieldError('description')}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving…' : event ? 'Update Event' : 'Schedule Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
