import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Column } from '@/components/app/data-table'
import type { Role } from '@/lib/auth/roles'
import type { FieldConfig } from '@/lib/forms/fields'
import type { Ministry, MinistryWorkspaceData } from '@/lib/ministries/workspace'

/** What every tab gets from the workspace. */
export type WorkspaceContext = {
  ministry: Ministry
  data: MinistryWorkspaceData
  /** The signed-in user's app role (decides which buttons show; the API checks again). */
  role: Role
  /** Reload the header (member, leader and event counts) after a change. */
  refresh: () => void
  /** Switch to another tab by key. */
  openTab: (key: string) => void
}

/**
 * A tab that lists one table through its API, with add / edit / delete: a DataTable, an
 * EntityFormDialog and a ConfirmDialog, wired by ResourceTab. Most ministry tabs are only this config.
 */
export type ResourceTabConfig<T = Record<string, unknown>> = {
  key: string
  label: string
  icon?: LucideIcon
  /** The collection route, e.g. '/api/choir-songs'; items are `${api}/${id}`. */
  api: string
  /** 'ministry': list `?ministry_id=<this ministry>` and send `ministry_id` with new rows (tables with a ministry_id column). */
  scope?: 'ministry'
  /** Fixed query parameters for the list, e.g. `{ status: 'open' }`. */
  params?: Record<string, string>
  /** One row in words, lower case: 'song' → "Add song", "Song added", "Delete this song?". */
  noun: string
  columns: Column<T>[]
  /** The add/edit form. Fields with `createOnly` only show when adding. */
  fields: FieldConfig[]
  /** Roles that see the add/edit/delete buttons; same as the route's write roles. Default STAFF. */
  write?: readonly Role[]
  /** The row's name in buttons and the delete confirmation. */
  describe: (row: T) => string
  /** Placeholder of the search box; leave out when the route has no `search` option. */
  searchPlaceholder?: string
  /** Default true. */
  editable?: boolean
  deletable?: boolean
  /** 'Remove' instead of 'Delete' (e.g. a membership). */
  deleteVerb?: string
  /** Extra sentence in the delete confirmation, e.g. what else goes with the row. */
  deleteNote?: string
  empty?: { title: string; description?: string }
  pageSize?: number
  /** Reload the workspace header after a change (the Members tab does, to update the counts). */
  refreshesHeader?: boolean
}

/** A tab with its own component, for anything a list + form can't do. */
export type CustomTab = {
  key: string
  label: string
  icon?: LucideIcon
  render: (ctx: WorkspaceContext) => ReactNode
}

export type WorkspaceTab = ResourceTabConfig | CustomTab

export const isCustomTab = (tab: WorkspaceTab): tab is CustomTab => 'render' in tab

/**
 * Type a resource tab against its row type (columns and `describe` get a typed row), then hand it to
 * MinistryWorkspace's `tabs` list:  defineResourceTab<ChoirSong>({ key: 'songs', … })
 */
export function defineResourceTab<T>(config: ResourceTabConfig<T>): ResourceTabConfig {
  return config as unknown as ResourceTabConfig
}
