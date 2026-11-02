'use client'

import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/app/empty-state'
import { useApiList } from '@/components/app/use-api'
import type { FieldOption } from '@/lib/forms/fields'
import { ResourceTab } from './resource-tab'
import type { CustomTab, ResourceTabConfig, WorkspaceContext } from './types'

/**
 * Where a linked field's choices come from: the rows of another collection route, e.g. the teams a
 * team member belongs to or the program a material is for.
 */
export type LinkedChoices<P> = {
  /** The form field that holds the linked row's id; it becomes a select of the rows below. */
  field: string
  /** The collection route to read the choices from (first 500 rows, in the route's order). */
  api: string
  option: (row: P) => FieldOption
  /**
   * Shown instead of the list while there is nothing to link to (e.g. no teams yet), with a button to
   * the tab where those rows are added. Leave out when the link is optional.
   */
  none?: { title: string; description?: string; tab: string; action: string }
}

const CHOICES_LIMIT = 500

function LinkedResourceTab<P>({ config, link, ctx }: { config: ResourceTabConfig; link: LinkedChoices<P>; ctx: WorkspaceContext }) {
  const parents = useApiList<P>(link.api, { pageSize: CHOICES_LIMIT, failure: `Could not load the choices for ${config.label.toLowerCase()}.` })
  const { option } = link
  const options = useMemo(() => parents.rows.map(option), [parents.rows, option])
  const linked = useMemo<ResourceTabConfig>(
    () => ({ ...config, fields: config.fields.map((f) => (f.name === link.field ? { ...f, type: 'select', options } : f)) }),
    [config, link.field, options],
  )

  // Wait for the choices: the form resets its inputs when its fields change, so they must not change
  // while someone is filling it in.
  if (parents.loading && parents.rows.length === 0) {
    return <div className="h-48 animate-pulse rounded-xl border border-border bg-card" aria-busy="true" aria-label={`Loading ${config.label.toLowerCase()}`} />
  }
  if (link.none && !parents.loading && !parents.failed && parents.rows.length === 0) {
    const { none } = link
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <EmptyState
          icon={config.icon}
          title={none.title}
          description={none.description}
          action={<Button variant="outline" onClick={() => ctx.openTab(none.tab)}>{none.action} <ArrowRight aria-hidden /></Button>}
        />
      </div>
    )
  }
  return <ResourceTab config={linked} ctx={ctx} />
}

/**
 * A resource tab (see defineResourceTab) whose form picks a row of another table: the field named in
 * `link.field` becomes a select filled from `link.api` each time the tab opens.
 *
 *   linkedResourceTab<Material, Program>({ key: 'materials', …, fields: [{ name: 'program_id', label: 'Program', type: 'select', required: true }, …] },
 *     { field: 'program_id', api: '/api/education-programs', option: (p) => ({ value: p.id, label: p.title }) })
 */
export function linkedResourceTab<T, P>(config: ResourceTabConfig<T>, link: LinkedChoices<P>): CustomTab {
  const base = config as unknown as ResourceTabConfig
  return {
    key: config.key,
    label: config.label,
    icon: config.icon,
    render: (ctx) => <LinkedResourceTab config={base} link={link} ctx={ctx} />,
  }
}
