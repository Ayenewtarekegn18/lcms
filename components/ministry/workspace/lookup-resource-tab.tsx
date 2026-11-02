'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/app/empty-state'
import { selectClass } from '@/components/app/entity-form-dialog'
import { useApiList } from '@/components/app/use-api'
import { ResourceTab } from './resource-tab'
import type { CustomTab, ResourceTabConfig, WorkspaceContext } from './types'
import type { FieldOption } from '@/lib/forms/fields'
import { cn } from '@/lib/utils'

/**
 * Where a resource tab's rows point at another table (a participant's trip, a request's group): the
 * choices come from that table's list route instead of a fixed `options` list.
 */
export type Lookup<T> = {
  /** The other table's collection route, e.g. '/api/mission-trips'. */
  api: string
  /** The field (column) that holds the other row's id, e.g. 'trip_id'. */
  field: string
  /** One row of the other table as a choice. */
  option: (row: T) => FieldOption
  /** A filter above the list ("Trip" with "All trips"); leave out for no filter. */
  filter?: { label: string; all: string }
  /** Shown instead of the list while the other table is empty (when every row needs one). */
  missing?: { title: string; description?: string; tab: string; action: string }
}

type Props<T> = {
  ctx: WorkspaceContext
  config: ResourceTabConfig
  lookup: Lookup<T>
  /** A line above the list, e.g. who may see the rows. */
  notice?: ReactNode
}

// The other table rarely has more than a few dozen rows; the list routes return at most 500.
const MAX_CHOICES = 500

/**
 * A ResourceTab whose `lookup.field` is a select filled from another table, with a filter by that
 * table above the list. Adding while the filter is set picks the filtered row by default.
 */
export function LookupResourceTab<T>({ ctx, config, lookup, notice }: Props<T>) {
  const filterId = useId()
  const choices = useApiList<T>(lookup.api, { pageSize: MAX_CHOICES, failure: `Could not load the choices for ${config.label.toLowerCase()}.` })
  const [filter, setFilter] = useState('')
  const { option, field } = lookup
  const options = useMemo(() => choices.rows.map(option), [choices.rows, option])
  const selected = options.some((o) => o.value === filter) ? filter : ''

  const tab = useMemo<ResourceTabConfig>(() => ({
    ...config,
    params: selected ? { ...config.params, [field]: selected } : config.params,
    fields: config.fields.map((f) => (f.name === field ? { ...f, type: 'select' as const, options, defaultValue: selected || f.defaultValue } : f)),
  }), [config, field, options, selected])

  // Wait for the choices: the form resets its inputs when its fields change, so they must not change
  // while someone is filling it in.
  if (choices.loading && choices.rows.length === 0) {
    return <div className="h-48 animate-pulse rounded-xl border border-border bg-card" aria-busy="true" aria-label={`Loading ${config.label.toLowerCase()}`} />
  }

  if (lookup.missing && !choices.failed && options.length === 0) {
    const { title, description, tab: target, action } = lookup.missing
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <EmptyState
          icon={config.icon}
          title={title}
          description={description}
          action={<Button variant="outline" onClick={() => ctx.openTab(target)}><Plus aria-hidden /> {action}</Button>}
        />
      </div>
    )
  }

  const showFilter = lookup.filter && options.length > 1
  return (
    <div className="space-y-3">
      {(notice || showFilter) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : <span />}
          {showFilter && (
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor={filterId} className="shrink-0 text-sm font-medium text-foreground">{lookup.filter?.label}</label>
              <select
                id={filterId}
                className={cn(selectClass, 'min-w-0 sm:w-64')}
                value={selected}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">{lookup.filter?.all}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
      <ResourceTab config={tab} ctx={ctx} />
    </div>
  )
}

/**
 * A resource tab (see defineResourceTab) whose `lookup.field` is a select of another table's rows.
 *
 *   lookupResourceTab<Material, Program>({ key: 'materials', …, fields: [{ name: 'program_id', label: 'Program', type: 'select', required: true }, …] },
 *     { field: 'program_id', api: '/api/education-programs', option: (p) => ({ value: p.id, label: p.title }) })
 */
export function lookupResourceTab<T, P>(config: ResourceTabConfig<T>, lookup: Lookup<P>): CustomTab {
  const base = config as unknown as ResourceTabConfig
  return {
    key: config.key,
    label: config.label,
    icon: config.icon,
    render: (ctx) => <LookupResourceTab config={base} lookup={lookup} ctx={ctx} />,
  }
}
