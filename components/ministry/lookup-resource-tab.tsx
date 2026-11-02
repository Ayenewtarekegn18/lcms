'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/app/empty-state'
import { selectClass } from '@/components/app/entity-form-dialog'
import { useApiList } from '@/components/app/use-api'
import { ResourceTab } from '@/components/ministry/workspace/resource-tab'
import type { ResourceTabConfig, WorkspaceContext } from '@/components/ministry/workspace/types'
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
  /** The filter above the list: "Trip" with "All trips". */
  filterLabel: string
  allLabel: string
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
  const choices = useApiList<T>(lookup.api, { pageSize: MAX_CHOICES, failure: `Could not load the ${lookup.allLabel.toLowerCase()}.` })
  const [filter, setFilter] = useState('')
  const { option, field } = lookup
  const options = useMemo(() => choices.rows.map(option), [choices.rows, option])
  const selected = options.some((o) => o.value === filter) ? filter : ''

  const tab = useMemo<ResourceTabConfig>(() => ({
    ...config,
    params: selected ? { ...config.params, [field]: selected } : config.params,
    fields: config.fields.map((f) => (f.name === field ? { ...f, options, defaultValue: selected || f.defaultValue } : f)),
  }), [config, field, options, selected])

  if (choices.loading && choices.rows.length === 0) {
    return <div className="h-48 animate-pulse rounded-xl border border-border bg-card" aria-label="Loading" />
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

  return (
    <div className="space-y-3">
      {(notice || options.length > 1) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : <span />}
          {options.length > 1 && (
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor={filterId} className="shrink-0 text-sm font-medium text-foreground">{lookup.filterLabel}</label>
              <select
                id={filterId}
                className={cn(selectClass, 'min-w-0 sm:w-64')}
                value={selected}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">{lookup.allLabel}</option>
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
