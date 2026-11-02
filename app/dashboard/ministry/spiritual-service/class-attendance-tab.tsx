'use client'

import { useId, useMemo, useState } from 'react'
import { BookOpen, Check, Plus, UserCheck, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EmptyState } from '@/components/app/empty-state'
import { EntityFormDialog, selectClass } from '@/components/app/entity-form-dialog'
import { RowActions } from '@/components/app/row-actions'
import { useApiList, useApiMutation } from '@/components/app/use-api'
import type { WorkspaceContext } from '@/components/ministry/workspace/types'
import { STAFF } from '@/lib/auth/roles'
import type { Tables } from '@/lib/database.types'
import type { FieldConfig } from '@/lib/forms/fields'
import { formatDate, memberName } from '@/lib/members/directory'
import { attendanceSummary } from '@/lib/ministries/spiritual-service'

type Person = { id: string; first_name: string; last_name: string }
export type SpiritualClass = Tables<'spiritual_classes'> & { instructor: Person | null }
type Attendee = Tables<'spiritual_class_attendance'> & { member: Person | null }

const API = '/api/spiritual-class-attendance'
const name = (a: Attendee) => (a.member ? memberName(a.member) : 'Unknown member')
const classLabel = (c: SpiritualClass) => `${c.title} · ${formatDate(c.class_date)}`

const FIELDS: FieldConfig[] = [
  { name: 'member_id', label: 'Person', type: 'member', required: true, help: 'Anyone in the member register. Adding someone already on the list updates them.' },
  { name: 'attended', label: 'Attended', type: 'checkbox', defaultValue: true },
]

/**
 * The Attendance tab of Spiritual Service: choose a class, then keep its list of people and who came
 * (spiritual_class_attendance, staff only). A custom tab because each row belongs to the chosen class.
 */
export function ClassAttendanceTab({ ctx }: { ctx: WorkspaceContext }) {
  const selectId = useId()
  const classes = useApiList<SpiritualClass>('/api/spiritual-classes', { pageSize: 100, failure: 'Could not load the classes.' })
  // The chosen class, or the most recent one until someone chooses.
  const [picked, setClassId] = useState('')
  const chosen = classes.rows.find((c) => c.id === picked) ?? classes.rows[0] ?? null
  const classId = chosen?.id ?? ''

  const params = useMemo(() => ({ class_id: classId }), [classId])
  const list = useApiList<Attendee>(classId ? API : null, { params, pageSize: 100, failure: 'Could not load the attendance.' })
  const { mutate } = useApiMutation()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Attendee | null>(null)
  const extra = useMemo(() => ({ class_id: classId }), [classId])

  const canWrite = STAFF.includes(ctx.role)
  const present = list.rows.filter((a) => a.attended !== false).length

  const mark = async (a: Attendee, attended: boolean) => {
    const r = await mutate(`${API}/${a.id}`, {
      method: 'PATCH',
      body: { attended },
      success: `${name(a)} marked ${attended ? 'present' : 'absent'}`,
      failure: 'Could not change the attendance.',
    })
    if (r.ok) list.reload()
  }
  const remove = async () => {
    if (!removing) return false
    const r = await mutate(`${API}/${removing.id}`, { method: 'DELETE', success: 'Removed from the class', failure: 'Could not remove them from the class.' })
    if (r.ok) list.reload()
    return r.ok
  }

  if (classes.loading && classes.rows.length === 0) {
    return <div className="h-48 animate-pulse rounded-xl border border-border bg-card" aria-label="Loading the classes" />
  }
  if (classes.rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={BookOpen}
          title={classes.failed ? 'The classes could not be loaded.' : 'No classes yet.'}
          description={classes.failed ? 'Check the connection and try again.' : 'Schedule a class first, then keep its attendance here.'}
          action={classes.failed
            ? <Button variant="outline" onClick={classes.reload}>Try again</Button>
            : <Button variant="outline" onClick={() => ctx.openTab('classes')}>Go to classes</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-md">
          <Label htmlFor={selectId}>Class</Label>
          <select id={selectId} className={`${selectClass} bg-card`} value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.rows.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
          </select>
        </div>
        {chosen && (
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Present</dt>
              <dd className="font-semibold text-foreground">{list.loading && !list.rows.length ? '…' : attendanceSummary(present, chosen.max_attendees)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Instructor</dt>
              <dd className="text-foreground">{chosen.instructor ? memberName(chosen.instructor) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Place</dt>
              <dd className="text-foreground">{chosen.location || '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      <DataTable
        label="Attendance"
        list={list}
        searchPlaceholder="Search the class list by name"
        columns={[
          { key: 'name', header: 'Name', primary: true, cell: name },
          {
            key: 'attended',
            header: 'Attendance',
            cell: (a) => (a.attended === false ? <Badge variant="outline">Absent</Badge> : <Badge>Present</Badge>),
          },
        ]}
        toolbar={canWrite && chosen && <Button onClick={() => setAdding(true)}><Plus aria-hidden /> Add person</Button>}
        actions={canWrite
          ? (a) => (
              <RowActions name={name(a)} deleteVerb="Remove" onDelete={() => setRemoving(a)}>
                {a.attended === false ? (
                  <Button variant="ghost" size="sm" onClick={() => mark(a, true)} aria-label={`Mark ${name(a)} present`}>
                    <Check aria-hidden /> Present
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => mark(a, false)} aria-label={`Mark ${name(a)} absent`}>
                    <X aria-hidden /> Absent
                  </Button>
                )}
              </RowActions>
            )
          : undefined}
        empty={{
          title: 'Nobody on this class list yet.',
          description: 'Add the people who came, or who are expected.',
          icon: UserCheck,
          action: canWrite && chosen && <Button variant="outline" onClick={() => setAdding(true)}><Plus aria-hidden /> Add person</Button>,
        }}
      />

      <EntityFormDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add person"
        description={chosen ? classLabel(chosen) : undefined}
        fields={FIELDS}
        method="POST"
        url={API}
        extra={extra}
        successMessage="Added to the class"
        failureMessage="Could not add them to the class."
        onSaved={() => list.reload()}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => { if (!o) setRemoving(null) }}
        title="Remove from this class?"
        description={removing && <>“{name(removing)}” will be taken off the list of {chosen ? `“${chosen.title}”` : 'this class'}. They stay in the member register.</>}
        confirmLabel="Remove"
        onConfirm={remove}
      />
    </div>
  )
}
