'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FIELDS, ROSTER_LIMITS, SECTIONS, cleanRegistration, emptyRegistration, isVisible, registrationSchema,
  type ChildRow, type FieldDef, type HouseholdRow, type RegistrationKey, type RegistrationValues,
} from '@/lib/members/registration'
import { ChipGroup, FieldLabel, SimpleInput, SpouseSuggestions } from './field-control'
import { ChildrenRoster, HouseholdRoster, blankChild } from './roster-field'
import { PhotoPanel } from './photo-panel'

// Validate what will actually be saved: hidden conditional fields cleared, empty rows dropped.
const schemaResolver = zodResolver(registrationSchema)
const resolver: Resolver<RegistrationValues> = (values, context, options) =>
  schemaResolver(cleanRegistration(values), context, options)

type Saved = { id: string; member_number: string; name: string; photo: 'saved' | 'failed' | 'none' }

export function MemberRegistrationForm() {
  const { control, handleSubmit, watch, setValue, reset, setError, formState: { errors, isSubmitting } } =
    useForm<RegistrationValues>({ resolver, defaultValues: emptyRegistration() })
  const values = watch()
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [nextNumber, setNextNumber] = useState<string | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)

  const loadNextNumber = () => {
    fetch('/api/members/register')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setNextNumber(d?.next ?? null))
      .catch(() => setNextNumber(null))
  }
  useEffect(loadNextNumber, [])

  // One child row per child, following "Number of children" (max 20), keeping what was typed.
  const childCount = Math.min(Math.max(parseInt(values.children || '0', 10) || 0, 0), ROSTER_LIMITS.childrenList)
  useEffect(() => {
    const rows = values.childrenList ?? []
    if (rows.length !== childCount) {
      setValue('childrenList', Array.from({ length: childCount }, (_, i) => rows[i] ?? blankChild()))
    }
  }, [childCount, values.childrenList, setValue])

  const startOver = () => {
    reset(emptyRegistration())
    setPhoto(null)
    setSaved(null)
    loadNextNumber()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onInvalid = (errs: typeof errors) => {
    const first = FIELDS.find((f) => errs[f.k])
    if (!first) return
    const el = document.getElementById(`field-${first.k}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.querySelector<HTMLElement>('input,select,textarea')?.focus({ preventScroll: true })
    toast.error('Some details need attention.')
  }

  const onSubmit = async (data: RegistrationValues) => {
    const res = await fetch('/api/members/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const fieldErrors: Record<string, string[]> = body?.issues?.fieldErrors ?? {}
      Object.entries(fieldErrors).forEach(([k, msgs]) => setError(k as RegistrationKey, { message: msgs[0] }))
      toast.error(res.status === 403 ? 'You are not allowed to register members.' : body?.error ?? 'Could not save the member.')
      return
    }

    let photoState: Saved['photo'] = 'none'
    if (photo) {
      const fd = new FormData()
      fd.append('photo', photo, 'photo.jpg')
      const up = await fetch(`/api/members/${body.id}/photo`, { method: 'POST', body: fd }).catch(() => null)
      photoState = up?.ok ? 'saved' : 'failed'
    }
    setSaved({ id: body.id, member_number: body.member_number, name: [data.firstNameAm, data.fatherNameAm].join(' '), photo: photoState })
    toast.success(`Registered ${body.member_number}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (saved) {
    return (
      <Card className="mx-auto max-w-lg border-green-200 bg-white">
        <CardContent className="space-y-4 py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" aria-hidden />
          <div>
            <p className="text-sm text-slate-500">ተመዝግቧል · Member registered</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{saved.name}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-wide text-green-700" data-testid="member-number">{saved.member_number}</p>
          </div>
          {saved.photo === 'failed' && (
            <p className="text-sm text-amber-700">The member was saved, but the photo upload failed. Add the photo again from the member&apos;s record.</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={startOver}>አዲስ አባል · Register another</Button>
            <Button variant="outline" asChild><Link href="/dashboard/members">View members</Link></Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderField = (f: FieldDef) => {
    if (!isVisible(f, values)) return null
    const message = (errors[f.k] as { message?: string } | undefined)?.message
      ?? (Array.isArray(errors[f.k]) ? 'Check the rows above.' : undefined)
    const errId = message ? `${f.k}-error` : undefined
    return (
      <div key={f.k} id={`field-${f.k}`} className={`flex flex-col gap-1.5 ${f.wide ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
        <FieldLabel f={f} htmlFor={['radio', 'multi', 'kids', 'people'].includes(f.t) ? undefined : f.k} />
        <Controller
          control={control}
          name={f.k}
          render={({ field }) => {
            switch (f.t) {
              case 'radio':
                return <ChipGroup f={f} value={field.value as string} onChange={field.onChange} />
              case 'multi':
                return <ChipGroup f={f} value={field.value as string[]} onChange={field.onChange} multiple />
              case 'kids':
                return <ChildrenRoster rows={field.value as ChildRow[]} onChange={field.onChange} />
              case 'people':
                return <HouseholdRoster rows={field.value as HouseholdRow[]} onChange={field.onChange} />
              default:
                return (
                  <div className="relative">
                    <SimpleInput
                      f={f}
                      value={field.value as string}
                      invalid={!!message}
                      describedBy={errId}
                      onChange={(v) => {
                        field.onChange(v)
                        if (f.ac) setValue('spouseMemberId', '') // typed by hand: no longer a linked member
                      }}
                    />
                    {f.ac && !values.spouseMemberId && (
                      <SpouseSuggestions
                        query={field.value as string}
                        onPick={(m) => { setValue('spouse', m.name); setValue('spouseMemberId', m.id) }}
                      />
                    )}
                    {f.ac && values.spouseMemberId && <p className="mt-1 text-xs text-green-700">Linked to an existing member</p>}
                  </div>
                )
            }
          }}
        />
        {message && <p id={errId} className="text-xs text-red-600" role="alert">{message}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <Card key={s.id} className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">{s.am} <span className="font-normal text-slate-500">· {s.en}</span></CardTitle>
              {s.note && <CardDescription>{s.note}</CardDescription>}
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FIELDS.filter((f) => f.sec === s.id).map(renderField)}
            </CardContent>
          </Card>
        ))}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <PhotoPanel value={photo} onChange={setPhoto} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">የመታወቂያ ቁጥር <span className="font-normal text-slate-500">· Member number</span></h4>
          <p className="mt-1 text-xs text-slate-500">Assigned automatically in sequence when you save.</p>
          <p className="mt-2 font-mono text-xl font-semibold text-green-700" data-testid="next-member-number">{nextNumber ?? '—'}</p>
        </div>
      </aside>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:col-span-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'አስቀምጥ · Save member'}</Button>
        <Button type="button" variant="ghost" onClick={() => { reset(emptyRegistration()); setPhoto(null) }} disabled={isSubmitting}>
          Clear form
        </Button>
        <span className="text-xs text-slate-500">Fields marked * are required; everything else can be filled in later.</span>
      </div>
    </form>
  )
}
