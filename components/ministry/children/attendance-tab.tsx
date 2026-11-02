'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { Check, ClipboardCheck, Plus, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/app/empty-state'
import { EntityFormDialog } from '@/components/app/entity-form-dialog'
import { useApiList, useApiMutation } from '@/components/app/use-api'
import type { WorkspaceContext } from '@/components/ministry/workspace/types'
import { STAFF } from '@/lib/auth/roles'
import type { FieldConfig } from '@/lib/forms/fields'
import { formatDate, memberName } from '@/lib/members/directory'
import { buildRegister, localToday, registerCounts, type AttendanceRow, type AttendanceStatus, type RegisterEntry } from '@/lib/ministries/children'
import { cn } from '@/lib/utils'
import { ClassFilter, NoClassesYet, useChildrenClasses } from './class-tabs'

// Class attendance: pick a class and a day, then mark each child present or absent. The class list
// is every child marked in that class before, so a week's register starts from last week's children;
// a new child is added with the member picker (and marked present).

const ADD_CHILD: FieldConfig[] = [
  { name: 'member_id', label: 'Child', type: 'member', required: true, help: 'Children are people in the member register.' },
  { name: 'status', label: 'Mark', type: 'select', required: true, options: [{ value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }], defaultValue: 'present' },
]

export function AttendanceTab({ ctx }: { ctx: WorkspaceContext }) {
  const { list: classes, options } = useChildrenClasses()
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(() => localToday())
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const dateId = useId()
  const { mutate } = useApiMutation()
  const canWrite = STAFF.includes(ctx.role)

  // Start on the first class once the classes are in.
  useEffect(() => {
    if (!classId && options[0]) setClassId(options[0].value)
  }, [classId, options])

  const params = useMemo(() => ({ class_id: classId }), [classId])
  const rows = useApiList<AttendanceRow>(classId ? '/api/children-attendance' : null, { params, pageSize: 500, failure: 'Could not load the register.' })
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const register = useMemo(() => (validDate ? buildRegister(rows.rows, classId, date) : []), [rows.rows, classId, date, validDate])
  const counts = registerCounts(register)

  if (options.length === 0) return <NoClassesYet ctx={ctx} loading={classes.loading} what="Attendance records" />

  const mark = async (entry: RegisterEntry, status: AttendanceStatus) => {
    if (entry.record?.status === status) return
    setBusy(entry.member.id)
    const name = memberName(entry.member)
    const r = entry.record
      ? await mutate(`/api/children-attendance/${entry.record.id}`, { method: 'PATCH', body: { status }, failure: `Could not mark ${name}.` })
      : await mutate('/api/children-attendance', {
          method: 'POST',
          body: { class_id: classId, member_id: entry.member.id, attendance_date: date, status },
          failure: `Could not mark ${name}.`,
        })
    setBusy(null)
    if (r.ok) rows.reload()
  }

  const clear = async (entry: RegisterEntry) => {
    if (!entry.record) return
    setBusy(entry.member.id)
    const r = await mutate(`/api/children-attendance/${entry.record.id}`, { method: 'DELETE', failure: `Could not clear the mark for ${memberName(entry.member)}.` })
    setBusy(null)
    if (r.ok) rows.reload()
  }

  const markRestPresent = async () => {
    setBusy('all')
    const unmarked = register.filter((e) => !e.record)
    await Promise.all(unmarked.map((e) => mutate('/api/children-attendance', {
      method: 'POST',
      body: { class_id: classId, member_id: e.member.id, attendance_date: date, status: 'present' },
      failure: `Could not mark ${memberName(e.member)}.`,
    })))
    setBusy(null)
    rows.reload()
  }

  const firstLoad = rows.loading && rows.rows.length === 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <ClassFilter value={classId} onChange={setClassId} options={options} />
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <Label htmlFor={dateId} className="text-sm text-muted-foreground">Day</Label>
            <Input id={dateId} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card sm:w-44" />
          </div>
        </div>
        {canWrite && (
          <Button onClick={() => setAdding(true)} disabled={!validDate}>
            <Plus aria-hidden /> Add child
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {register.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="register-summary">
              <span className="font-medium text-foreground">{counts.present}</span> present ·{' '}
              <span className="font-medium text-foreground">{counts.absent}</span> absent ·{' '}
              <span className="font-medium text-foreground">{counts.unmarked}</span> not marked
              <span className="hidden sm:inline"> on {formatDate(date)}</span>
            </p>
            {canWrite && counts.unmarked > 0 && (
              <Button variant="outline" size="sm" onClick={markRestPresent} disabled={busy !== null}>
                <Check aria-hidden /> Mark the rest present
              </Button>
            )}
          </div>
        )}

        {!validDate ? (
          <EmptyState icon={ClipboardCheck} title="Choose a day." description="Pick the day of the class to see its register." />
        ) : firstLoad ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="space-y-2 p-4">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : register.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No children on this register yet."
            description="Add the children who come to this class. Next time they are listed here, ready to mark."
            action={canWrite && <Button variant="outline" onClick={() => setAdding(true)}><Plus aria-hidden /> Add child</Button>}
          />
        ) : (
          <ul className={cn('divide-y divide-border transition-opacity', rows.loading && 'opacity-60')} aria-label="Register" aria-busy={rows.loading}>
            {register.map((entry) => {
              const name = memberName(entry.member)
              const status = entry.record?.status
              const disabled = !canWrite || busy !== null
              return (
                <li key={entry.member.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" data-testid="register-row">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Not marked'}
                      {entry.lastSeen && <> · last marked {formatDate(entry.lastSeen)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div role="group" aria-label={`Mark ${name}`} className="inline-flex overflow-hidden rounded-md border border-border">
                      <button
                        type="button"
                        aria-pressed={status === 'present'}
                        disabled={disabled}
                        onClick={() => mark(entry, 'present')}
                        className={cn(
                          'flex h-9 items-center gap-1.5 px-3 text-sm font-medium transition-colors disabled:opacity-60',
                          status === 'present' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted',
                        )}
                      >
                        <Check className="size-4" aria-hidden /> Present
                      </button>
                      <button
                        type="button"
                        aria-pressed={status === 'absent'}
                        disabled={disabled}
                        onClick={() => mark(entry, 'absent')}
                        className={cn(
                          'flex h-9 items-center gap-1.5 border-l border-border px-3 text-sm font-medium transition-colors disabled:opacity-60',
                          status === 'absent' ? 'bg-destructive text-white' : 'bg-card text-foreground hover:bg-muted',
                        )}
                      >
                        <X className="size-4" aria-hidden /> Absent
                      </button>
                    </div>
                    {canWrite && entry.record && (
                      <Button variant="ghost" size="icon" disabled={disabled} onClick={() => clear(entry)} aria-label={`Clear the mark for ${name}`} title="Clear the mark">
                        <RotateCcw aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <EntityFormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add child"
        description={validDate ? `${options.find((o) => o.value === classId)?.label ?? 'Class'}, ${formatDate(date)}` : undefined}
        fields={ADD_CHILD}
        method="POST"
        url="/api/children-attendance"
        extra={{ class_id: classId, attendance_date: date }}
        submitLabel="Add to register"
        successMessage="Child added to the register"
        failureMessage="Could not add the child."
        onSaved={() => rows.reload()}
      />
    </div>
  )
}
