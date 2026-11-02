'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HandCoins, HandHeart, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/app/empty-state'
import { ResourceTab } from '@/components/ministry/workspace/resource-tab'
import { defineResourceTab, type ResourceTabConfig, type WorkspaceContext } from '@/components/ministry/workspace/types'
import { PASTORAL } from '@/lib/auth/roles'
import type { Tables } from '@/lib/database.types'
import { formatBirr } from '@/lib/financial/summary'
import type { FieldConfig, FieldOption } from '@/lib/forms/fields'
import { formatDate, memberName } from '@/lib/members/directory'
import { AID_STATUS_OPTIONS, aidStatusLabel, PAYABLE_STATUSES } from '@/lib/ministries/charity'
import { CharityTotals } from './charity-totals'

// The Charity ministry's own tabs. Both tables are confidential (RLS: admin and elder read and write),
// so are the routes and the add / edit / delete buttons; a ministry leader sees a short note instead.

type Person = { id: string; first_name: string; last_name: string }
export type AidRequest = Tables<'charity_aid_requests'> & { member: Person | null; reviewer: Person | null }
export type Distribution = Tables<'charity_distributions'> & {
  request: (Pick<Tables<'charity_aid_requests'>, 'id' | 'amount_requested' | 'status'> & { member: Person | null }) | null
}

const muted = (text: string) => <span className="text-muted-foreground">{text}</span>
const money = (amount: number | null) => (amount === null ? muted('—') : <span className="whitespace-nowrap tabular-nums">{formatBirr(amount)}</span>)
const requester = (r: { member: Person | null }) => (r.member ? memberName(r.member) : 'Unknown member')

const statusVariant = { pending: 'outline', approved: 'default', rejected: 'outline', paid: 'secondary' } as const
export function AidStatusBadge({ status }: { status: string | null }) {
  const variant = statusVariant[(status ?? 'pending') as keyof typeof statusVariant] ?? 'outline'
  // The theme has no destructive-foreground colour, so "Rejected" is a red outline rather than the destructive variant.
  const rejected = status === 'rejected' ? 'border-destructive/40 bg-destructive/10 text-destructive' : ''
  return <Badge variant={variant} className={`whitespace-nowrap ${rejected}`}>{aidStatusLabel(status)}</Badge>
}

const amountField = (name: string, label: string, required = false): FieldConfig =>
  ({ name, label, type: 'number', required, min: 0.01, max: 99_999_999.99, step: 0.01, width: 'half', placeholder: '0.00' })

export const aidRequestsConfig = defineResourceTab<AidRequest>({
  key: 'aid-requests',
  label: 'Aid requests',
  icon: HandHeart,
  api: '/api/charity-aid-requests',
  noun: 'aid request',
  write: PASTORAL,
  searchPlaceholder: 'Search by member name',
  describe: (r) => `${requester(r)}'s request${r.request_date ? ` of ${formatDate(r.request_date)}` : ''}`,
  deleteNote: 'Any distributions paid against it are deleted too. This cannot be undone.',
  columns: [
    { key: 'member', header: 'Member', primary: true, cell: requester },
    { key: 'request_date', header: 'Requested', cell: (r) => formatDate(r.request_date) ?? muted('—') },
    { key: 'amount_requested', header: 'Amount', className: 'text-right', cell: (r) => money(r.amount_requested) },
    { key: 'status', header: 'Status', cell: (r) => <AidStatusBadge status={r.status} /> },
    {
      key: 'reviewed',
      header: 'Reviewed',
      cell: (r) => (r.reviewed_at
        ? <span className="text-sm">{r.reviewer ? memberName(r.reviewer) : 'Unknown'}<span className="text-muted-foreground">, {formatDate(r.reviewed_at)}</span></span>
        : muted('Not yet')),
    },
    { key: 'reason', header: 'Reason', hideOnMobile: true, className: 'max-w-xs truncate' },
  ],
  fields: [
    { name: 'member_id', label: 'Member', type: 'member', required: true, createOnly: true, help: 'The person asking for help.' },
    { name: 'request_date', label: 'Request date', type: 'date', width: 'half', help: 'Leave empty for today.' },
    amountField('amount_requested', 'Amount (ETB)'),
    { name: 'reason', label: 'Reason', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: AID_STATUS_OPTIONS,
      defaultValue: 'pending',
      help: 'Approving or rejecting records you as the reviewer.',
    },
  ],
  empty: { title: 'No aid requests yet.', description: 'Record requests for help, then approve, reject or pay them.' },
})

function distributionsConfig(requestOptions: FieldOption[]) {
  return defineResourceTab<Distribution>({
    key: 'distributions',
    label: 'Distributions',
    icon: HandCoins,
    api: '/api/charity-distributions',
    noun: 'distribution',
    write: PASTORAL,
    searchPlaceholder: 'Search notes',
    describe: (d) => `${formatBirr(d.amount)} to ${d.request ? requester(d.request) : 'unknown member'}`,
    columns: [
      { key: 'member', header: 'Member', primary: true, cell: (d) => (d.request ? requester(d.request) : muted('Unknown request')) },
      { key: 'distributed_date', header: 'Date', cell: (d) => formatDate(d.distributed_date) },
      { key: 'amount', header: 'Amount', className: 'text-right', cell: (d) => money(d.amount) },
      {
        key: 'request',
        header: 'Request',
        cell: (d) => (d.request
          ? <span className="inline-flex flex-wrap items-center gap-2">{money(d.request.amount_requested)}<AidStatusBadge status={d.request.status} /></span>
          : muted('—')),
      },
      { key: 'notes', header: 'Notes', hideOnMobile: true, className: 'max-w-xs truncate' },
    ],
    fields: [
      {
        name: 'request_id',
        label: 'Aid request',
        type: 'select',
        required: true,
        createOnly: true,
        options: requestOptions,
        help: requestOptions.length ? 'Approved requests only.' : 'No approved requests yet: approve one under Aid requests first.',
      },
      { name: 'distributed_date', label: 'Date', type: 'date', required: true, width: 'half' },
      amountField('amount', 'Amount (ETB)', true),
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    empty: { title: 'Nothing paid out yet.', description: 'Record the money given against approved aid requests.' },
  })
}

/** "Hana Member · ETB 1,500.00 · 3 Mar 2030 (Approved)" for the request picker. */
export function requestOptionLabel(r: Pick<AidRequest, 'member' | 'amount_requested' | 'request_date' | 'status'>) {
  return [
    requester(r),
    r.amount_requested === null ? null : formatBirr(r.amount_requested),
    formatDate(r.request_date),
  ].filter(Boolean).join(' · ') + ` (${aidStatusLabel(r.status)})`
}

/** Approved and paid requests for the Distributions picker (refetched when `version` changes). */
function usePayableRequests(version: number) {
  const [options, setOptions] = useState<FieldOption[]>([])
  useEffect(() => {
    const ctl = new AbortController()
    Promise.all(PAYABLE_STATUSES.map(async (status) => {
      const res = await fetch(`/api/charity-aid-requests?${new URLSearchParams({ status, limit: '500' })}`, { signal: ctl.signal, cache: 'no-store' })
      return res.ok ? ((await res.json()) as AidRequest[]) : []
    }))
      .then((lists) => setOptions(lists.flat().map((r) => ({ value: r.id, label: requestOptionLabel(r) }))))
      .catch(() => { /* aborted, or offline: the picker stays empty and the form says why */ })
    return () => ctl.abort()
  }, [version])
  return options
}

function Confidential() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <EmptyState icon={Lock} title="Confidential." description="Aid requests and distributions are visible to administrators and elders only." />
    </div>
  )
}

/** The tab's figures above its list; every change in the list reloads them. */
function WithTotals({ ctx, config, onChange }: { ctx: WorkspaceContext; config: ResourceTabConfig; onChange?: () => void }) {
  const [version, setVersion] = useState(0)
  const tabCtx = useMemo<WorkspaceContext>(
    () => ({ ...ctx, refresh: () => { setVersion((v) => v + 1); onChange?.() } }),
    [ctx, onChange],
  )
  return (
    <div className="space-y-4">
      <CharityTotals version={version} />
      <ResourceTab config={{ ...config, refreshesHeader: true }} ctx={tabCtx} />
    </div>
  )
}

function AidRequestsTab({ ctx }: { ctx: WorkspaceContext }) {
  if (!PASTORAL.includes(ctx.role)) return <Confidential />
  return <WithTotals ctx={ctx} config={aidRequestsConfig} />
}

function DistributionsTab({ ctx }: { ctx: WorkspaceContext }) {
  if (!PASTORAL.includes(ctx.role)) return <Confidential />
  return <Distributions ctx={ctx} />
}

function Distributions({ ctx }: { ctx: WorkspaceContext }) {
  const [version, setVersion] = useState(0)
  const options = usePayableRequests(version)
  const config = useMemo(() => distributionsConfig(options), [options])
  const reloadOptions = useCallback(() => setVersion((v) => v + 1), [])
  return <WithTotals ctx={ctx} config={config} onChange={reloadOptions} />
}

export const aidRequestsTab = { key: 'aid-requests', label: 'Aid requests', icon: HandHeart, render: (ctx: WorkspaceContext) => <AidRequestsTab ctx={ctx} /> }
export const distributionsTab = { key: 'distributions', label: 'Distributions', icon: HandCoins, render: (ctx: WorkspaceContext) => <DistributionsTab ctx={ctx} /> }
