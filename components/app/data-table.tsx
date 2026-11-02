'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/app/empty-state'
import type { ApiList } from '@/components/app/use-api'
import { cn } from '@/lib/utils'

/** One column. Without `cell` the row's `key` field is shown as text ('—' when empty). */
export type Column<T> = {
  key: string
  header: string
  cell?: (row: T) => ReactNode
  /** The card title on phones (use on one column, usually the name). */
  primary?: boolean
  /** Leave this column out of the phone cards. */
  hideOnMobile?: boolean
  /** Extra classes for the column's cells on wide screens, e.g. 'w-32' or 'text-right'. */
  className?: string
}

type DataTableProps<T> = {
  /** Accessible name of the table and of the card list, e.g. "Songs". */
  label: string
  columns: Column<T>[]
  /** The list from useApiList(): rows, loading, paging and search in one. */
  list?: ApiList<T>
  /** Or pass the parts yourself. */
  rows?: T[]
  loading?: boolean
  failed?: boolean
  onRetry?: () => void
  pagination?: { offset: number; pageSize: number; total: number; onChange: (offset: number) => void }
  search?: { value: string; onChange: (value: string) => void }
  /** Placeholder of the search box; the box shows when there is a search (from `list` or `search`). */
  searchPlaceholder?: string
  /** Buttons next to the search box, e.g. "Add song". */
  toolbar?: ReactNode
  /** Buttons for one row (edit, delete…), at the end of the row / bottom of the card. */
  actions?: (row: T) => ReactNode
  rowKey?: (row: T) => string
  empty?: { title: string; description?: ReactNode; action?: ReactNode; icon?: LucideIcon }
}

const SKELETON_ROWS = 3

function plain(row: unknown, key: string): ReactNode {
  const v = (row as Record<string, unknown>)[key]
  if (v === null || v === undefined || v === '') return <span className="text-muted-foreground">—</span>
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

/**
 * A list that is a real table from the md breakpoint and a stack of cards below it (each row a card
 * of label/value pairs), so it fits a 360px phone. Loading skeleton, empty state, search and pager.
 *
 *   const songs = useApiList<Song>('/api/choir-songs')
 *   <DataTable label="Songs" list={songs} searchPlaceholder="Search songs" columns={[
 *     { key: 'title', header: 'Title', primary: true },
 *     { key: 'composer', header: 'Composer' },
 *   ]} actions={(s) => <RowActions … />} />
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const { label, columns, toolbar, actions, empty, searchPlaceholder, list } = props
  const rows = list?.rows ?? props.rows ?? []
  const loading = list?.loading ?? props.loading ?? false
  const failed = list?.failed ?? props.failed ?? false
  const onRetry = list?.reload ?? props.onRetry
  const search = list ? { value: list.search, onChange: list.setSearch } : props.search
  const pagination = list
    ? { offset: list.offset, pageSize: list.pageSize, total: list.total, onChange: list.setOffset }
    : props.pagination
  const rowKey = props.rowKey ?? ((row: T) => String((row as { id?: unknown }).id))
  const value = (row: T, c: Column<T>) => (c.cell ? c.cell(row) : plain(row, c.key))

  const primary = columns.find((c) => c.primary) ?? columns[0]
  const cardColumns = columns.filter((c) => c !== primary && !c.hideOnMobile)
  const firstLoad = loading && rows.length === 0
  const searching = !!search?.value.trim()

  const showSearch = !!search && !!searchPlaceholder
  const top = (showSearch || toolbar) && (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showSearch ? (
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={search!.value}
            onChange={(e) => search!.onChange(e.target.value)}
            className="bg-card pl-9"
          />
        </div>
      ) : <span />}
      {toolbar && <div className="flex flex-wrap gap-2 sm:justify-end">{toolbar}</div>}
    </div>
  )

  let body: ReactNode
  if (failed && rows.length === 0 && !loading) {
    body = (
      <EmptyState
        title="This list could not be loaded."
        description="Check the connection and try again."
        action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
      />
    )
  } else if (!firstLoad && rows.length === 0) {
    body = searching
      ? <EmptyState icon={Search} title={`Nothing matches “${search!.value.trim()}”.`} description="Try another spelling or fewer words." />
      : <EmptyState title={empty?.title ?? 'Nothing here yet.'} description={empty?.description} action={empty?.action} icon={empty?.icon} />
  } else {
    body = (
      <div className={cn('transition-opacity', loading && !firstLoad && 'opacity-60')} aria-busy={loading}>
        {/* md and up: a table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm" aria-label={label}>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', c.className)}>
                    {c.header}
                  </th>
                ))}
                {actions && <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {firstLoad
                ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {columns.map((c) => <td key={c.key} className="px-4 py-4"><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /></td>)}
                      {actions && <td className="px-4 py-4" />}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr key={rowKey(row)} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                      {columns.map((c) => (
                        <td key={c.key} className={cn('px-4 py-3 align-middle text-foreground', c === primary && 'font-medium', c.className)}>
                          {value(row, c)}
                        </td>
                      ))}
                      {actions && <td className="px-4 py-2 text-right"><div className="flex justify-end gap-1">{actions(row)}</div></td>}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* phones: one card per row */}
        <ul className="divide-y divide-border md:hidden" aria-label={label}>
          {firstLoad
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <li key={i} className="space-y-2 p-4">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                </li>
              ))
            : rows.map((row) => (
                <li key={rowKey(row)} className="p-4" data-testid="data-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 break-words font-medium text-foreground">{value(row, primary)}</div>
                    {actions && <div className="-mr-2 -mt-1 flex shrink-0 gap-1">{actions(row)}</div>}
                  </div>
                  {cardColumns.length > 0 && (
                    <dl className="mt-2 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                      {cardColumns.map((c) => (
                        <div key={c.key} className="contents">
                          <dt className="text-muted-foreground">{c.header}</dt>
                          <dd className="min-w-0 break-words text-foreground">{value(row, c)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
        </ul>
      </div>
    )
  }

  const pager = pagination && pagination.total > pagination.pageSize && rows.length > 0 && (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>
        {pagination.offset + 1}–{pagination.offset + rows.length} of {Math.max(pagination.total, pagination.offset + rows.length)}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" aria-label="Previous page" disabled={loading || pagination.offset === 0}
          onClick={() => pagination.onChange(Math.max(0, pagination.offset - pagination.pageSize))}>
          <ChevronLeft aria-hidden />
        </Button>
        <Button variant="outline" size="sm" aria-label="Next page" disabled={loading || pagination.offset + rows.length >= pagination.total}
          onClick={() => pagination.onChange(pagination.offset + pagination.pageSize)}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {top}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {body}
        {pager}
      </div>
    </div>
  )
}
