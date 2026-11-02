import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  /** null while loading (shows a placeholder). */
  value: ReactNode | null
  icon?: LucideIcon
  /** A short line under the value, e.g. "next: Sat 15:00". */
  hint?: ReactNode
  className?: string
}

/** One figure with its label, for a row of key numbers at the top of a page. */
export function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-3 shadow-sm sm:p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        {Icon && (
          <span className="hidden size-8 shrink-0 items-center sm:flex justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      {value === null ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" aria-label="Loading" />
      ) : (
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:mt-2 sm:text-3xl">{value}</p>
      )}
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
