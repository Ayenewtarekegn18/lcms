'use client'

import { useEffect, useMemo, useState } from 'react'
import { Banknote, CalendarCheck, CheckCircle2, HandCoins, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { StatCard } from '@/components/app/stat-card'
import { useApiList, useApiMutation } from '@/components/app/use-api'
import { MinistryWorkspace } from '@/components/ministry/workspace/MinistryWorkspace'
import { pastoralOnly } from '@/components/ministry/workspace/pastoral-tab'
import { ResourceTab } from '@/components/ministry/workspace/resource-tab'
import { defineResourceTab, type WorkspaceContext } from '@/components/ministry/workspace/types'
import { readApiError } from '@/lib/api/client-errors'
import { PASTORAL } from '@/lib/auth/roles'
import type { Tables } from '@/lib/database.types'
import { churchToday, formatBirr, monthLabel } from '@/lib/financial/summary'
import { formatDate, memberName } from '@/lib/members/directory'
import { BENEFICIARY_STATUSES, formatBirrWhole, shortMonthLabel, type WorkersAidSummary } from '@/lib/ministries/workers-aid'

// Monthly Workers Aid: the beneficiaries (who gets how much each month) and the payments made to them, with
// the monthly totals. Both tables are confidential (RLS: admin and elder read and write).

type Person = { id: string; first_name: string; last_name: string } | null
type Beneficiary = Tables<'workers_aid_beneficiaries'> & { member: Person }
type Payment = Tables<'workers_aid_disbursements'> & {
  beneficiary: { id: string; monthly_amount: number; member: Person } | null
}

const nameOf = (p: Person | undefined) => (p ? memberName(p) : 'Unknown member')
const muted = (text: string) => <span className="text-muted-foreground">{text}</span>

const beneficiaries = defineResourceTab<Beneficiary>({
  key: 'beneficiaries',
  label: 'Beneficiaries',
  icon: Users,
  api: '/api/workers-aid-beneficiaries',
  noun: 'beneficiary',
  write: PASTORAL,
  searchPlaceholder: 'Search beneficiaries by name',
  describe: (b) => nameOf(b.member),
  columns: [
    { key: 'member', header: 'Beneficiary', primary: true, cell: (b) => nameOf(b.member) },
    { key: 'monthly_amount', header: 'Monthly amount', className: 'tabular-nums', cell: (b) => formatBirr(b.monthly_amount) },
    { key: 'start_date', header: 'Since', cell: (b) => formatDate(b.start_date) },
    { key: 'status', header: 'Status', cell: (b) => (b.status === 'inactive' ? <Badge variant="outline">Inactive</Badge> : <Badge>Active</Badge>) },
    { key: 'notes', header: 'Notes', hideOnMobile: true, className: 'max-w-xs truncate', cell: (b) => b.notes || muted('—') },
  ],
  fields: [
    { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true },
    { name: 'monthly_amount', label: 'Monthly amount (ETB)', type: 'number', required: true, min: 0.01, step: 0.01, width: 'half' },
    { name: 'start_date', label: 'Start date', type: 'date', width: 'half', help: 'Leave empty for today.' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: BENEFICIARY_STATUSES.map((s) => ({ value: s, label: s === 'active' ? 'Active' : 'Inactive' })),
      defaultValue: 'active',
      width: 'half',
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  deleteNote: 'Their payment history is deleted with them; set them inactive instead to keep it.',
  empty: { title: 'No beneficiaries yet.', description: 'Add the workers the church supports each month and their monthly amount.' },
})

/** Payments, with the monthly totals and "record this month's payments" above the list. */
function DisbursementsTab({ ctx }: { ctx: WorkspaceContext }) {
  const [version, setVersion] = useState(0)
  const [listVersion, setListVersion] = useState(0)
  const [summary, setSummary] = useState<WorkersAidSummary | null>(null)
  const [summaryFailed, setSummaryFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { mutate } = useApiMutation()
  const active = useApiList<Beneficiary>('/api/workers-aid-beneficiaries', {
    params: { status: 'active' },
    pageSize: 500,
    failure: 'Could not load the beneficiaries.',
  })
  const canWrite = PASTORAL.includes(ctx.role)

  useEffect(() => {
    const ctl = new AbortController()
    fetch('/api/workers-aid-disbursements/months', { signal: ctl.signal, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await readApiError(res, 'Could not load the monthly totals.')).message)
        setSummary((await res.json()) as WorkersAidSummary)
        setSummaryFailed(false)
      })
      .catch(() => { if (!ctl.signal.aborted) setSummaryFailed(true) })
    return () => ctl.abort()
  }, [version])

  const people = active.rows
  const payments = useMemo(() => defineResourceTab<Payment>({
    key: 'payments',
    label: 'Disbursements',
    icon: Banknote,
    api: '/api/workers-aid-disbursements',
    noun: 'payment',
    write: PASTORAL,
    refreshesHeader: true,
    describe: (p) => `${formatBirr(p.amount)} to ${nameOf(p.beneficiary?.member)} on ${formatDate(p.disbursement_date)}`,
    columns: [
      { key: 'beneficiary', header: 'Beneficiary', primary: true, cell: (p) => nameOf(p.beneficiary?.member) },
      { key: 'disbursement_date', header: 'Paid on', cell: (p) => formatDate(p.disbursement_date) },
      { key: 'amount', header: 'Amount', className: 'tabular-nums', cell: (p) => formatBirr(p.amount) },
      { key: 'notes', header: 'Notes', hideOnMobile: true, className: 'max-w-xs truncate', cell: (p) => p.notes || muted('—') },
    ],
    fields: [
      {
        name: 'beneficiary_id',
        label: 'Beneficiary',
        type: 'select',
        required: true,
        createOnly: true,
        options: people.map((b) => ({ value: b.id, label: `${nameOf(b.member)} (${formatBirr(b.monthly_amount)} a month)` })),
        help: people.length ? undefined : 'Add an active beneficiary in the Beneficiaries tab first.',
      },
      { name: 'disbursement_date', label: 'Paid on', type: 'date', required: true, width: 'half', defaultValue: churchToday() },
      { name: 'amount', label: 'Amount (ETB)', type: 'number', required: true, min: 0.01, step: 0.01, width: 'half', help: 'Usually their monthly amount.' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    empty: { title: 'No payments recorded yet.', description: 'Record each monthly payment, or all of this month’s at once.' },
  }), [people])

  // The list's changes reload the totals (ResourceTab calls refresh when refreshesHeader is set).
  const listCtx = useMemo<WorkspaceContext>(() => ({ ...ctx, refresh: () => setVersion((v) => v + 1) }), [ctx])

  const record = async () => {
    const r = await mutate<{ created: number; total: number }>('/api/workers-aid-disbursements/months', {
      method: 'POST',
      body: { disbursement_date: churchToday() },
      failure: 'Could not record this month’s payments.',
    })
    if (!r.ok) return false
    setVersion((v) => v + 1)
    setListVersion((v) => v + 1)
    return true
  }

  const current = summary?.months[0]
  const due = summary?.due

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {(summary?.months ?? [null, null, null]).map((m, i) => (
          <StatCard
            key={m?.month ?? i}
            label={i === 0 ? 'Paid this month' : m ? `Paid in ${shortMonthLabel(m.month)}` : 'Paid'}
            icon={i === 0 ? Banknote : CalendarCheck}
            value={m ? <span className="text-xl sm:text-2xl lg:text-3xl">{formatBirrWhole(m.total)}</span> : summaryFailed ? '—' : null}
            hint={m && `${m.payments} ${m.payments === 1 ? 'payment' : 'payments'}`}
          />
        ))}
        <StatCard
          label="Monthly commitment"
          icon={HandCoins}
          value={summary ? <span className="text-xl sm:text-2xl lg:text-3xl">{formatBirrWhole(summary.commitment.total)}</span> : summaryFailed ? '—' : null}
          hint={summary && `${summary.commitment.beneficiaries} active ${summary.commitment.beneficiaries === 1 ? 'beneficiary' : 'beneficiaries'}`}
        />
      </div>

      {summary && current && due && summary.commitment.beneficiaries > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          {due.beneficiaries > 0 ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">{monthLabel(summary.month)}:</span>{' '}
              {due.beneficiaries} active {due.beneficiaries === 1 ? 'beneficiary has' : 'beneficiaries have'} not been paid yet
              {' '}({formatBirr(due.total)}).
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
              Every active beneficiary has been paid for {monthLabel(summary.month)}.
            </p>
          )}
          {canWrite && due.beneficiaries > 0 && (
            <Button className="shrink-0" onClick={() => setConfirming(true)}>
              <CalendarCheck aria-hidden /> Record this month’s payments
            </Button>
          )}
        </div>
      )}

      <ResourceTab key={listVersion} config={payments} ctx={listCtx} />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Record this month’s payments?"
        description={summary && due && (
          <>
            {due.beneficiaries} {due.beneficiaries === 1 ? 'payment' : 'payments'} of {formatBirr(due.total)} in total will be recorded
            for {monthLabel(summary.month)}, dated today: each unpaid active beneficiary gets their monthly amount.
          </>
        )}
        confirmLabel="Record payments"
        destructive={false}
        onConfirm={async () => {
          const ok = await record()
          if (ok) setConfirming(false)
          return ok
        }}
      />
    </div>
  )
}

const disbursements = { key: 'disbursements', label: 'Disbursements', icon: Banknote, render: (ctx: WorkspaceContext) => <DisbursementsTab ctx={ctx} /> }

export default function WorkersAidPage() {
  return <MinistryWorkspace slug="workers-aid" tabs={[pastoralOnly(beneficiaries), pastoralOnly(disbursements)]} />
}
