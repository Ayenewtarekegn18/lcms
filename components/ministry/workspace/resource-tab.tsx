'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { DataTable } from '@/components/app/data-table'
import { EntityFormDialog } from '@/components/app/entity-form-dialog'
import { RowActions } from '@/components/app/row-actions'
import { useApiList, useApiMutation } from '@/components/app/use-api'
import { STAFF } from '@/lib/auth/roles'
import type { ResourceTabConfig, WorkspaceContext } from './types'

type Row = Record<string, unknown> & { id: string }

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** A list with add / edit / delete for one table, driven by a ResourceTabConfig (see types.ts). */
export function ResourceTab({ config, ctx }: { config: ResourceTabConfig; ctx: WorkspaceContext }) {
  const { api, noun, scope, fields, columns, describe } = config
  const ministryId = ctx.ministry.id
  const params = useMemo(
    () => ({ ...config.params, ...(scope === 'ministry' ? { ministry_id: ministryId } : {}) }),
    [config.params, scope, ministryId],
  )
  const extra = useMemo(() => (scope === 'ministry' ? { ministry_id: ministryId } : undefined), [scope, ministryId])
  const list = useApiList<Row>(api, { params, pageSize: config.pageSize ?? 25, failure: `Could not load the ${config.label.toLowerCase()}.` })
  const { mutate } = useApiMutation()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)

  const canWrite = (config.write ?? STAFF).includes(ctx.role)
  const canEdit = canWrite && config.editable !== false
  const canDelete = canWrite && config.deletable !== false
  const verb = config.deleteVerb ?? 'Delete'

  const changed = () => {
    list.reload()
    if (config.refreshesHeader) ctx.refresh()
  }

  const remove = async () => {
    if (!deleting) return false
    const r = await mutate(`${api}/${deleting.id}`, {
      method: 'DELETE',
      success: `${capitalize(noun)} ${verb === 'Delete' ? 'deleted' : `${verb.toLowerCase()}d`}`,
      failure: `Could not ${verb.toLowerCase()} the ${noun}.`,
    })
    if (r.ok) changed()
    return r.ok
  }

  return (
    <>
      <DataTable
        label={config.label}
        list={list}
        columns={columns}
        searchPlaceholder={config.searchPlaceholder}
        toolbar={canWrite && (
          <Button onClick={() => setAdding(true)}>
            <Plus aria-hidden /> Add {noun}
          </Button>
        )}
        actions={canEdit || canDelete
          ? (row) => (
              <RowActions
                name={describe(row)}
                deleteVerb={verb}
                onEdit={canEdit ? () => setEditing(row) : undefined}
                onDelete={canDelete ? () => setDeleting(row) : undefined}
              />
            )
          : undefined}
        empty={{
          title: config.empty?.title ?? `No ${config.label.toLowerCase()} yet.`,
          description: config.empty?.description,
          icon: config.icon,
          action: canWrite && <Button variant="outline" onClick={() => setAdding(true)}><Plus aria-hidden /> Add {noun}</Button>,
        }}
      />

      <EntityFormDialog
        open={adding}
        onOpenChange={setAdding}
        title={`Add ${noun}`}
        fields={fields}
        method="POST"
        url={api}
        extra={extra}
        successMessage={`${capitalize(noun)} added`}
        failureMessage={`Could not add the ${noun}.`}
        onSaved={changed}
      />
      <EntityFormDialog
        open={editing !== null}
        onOpenChange={(o) => { if (!o) setEditing(null) }}
        title={`Edit ${noun}`}
        description={editing ? describe(editing) : undefined}
        fields={fields}
        method="PATCH"
        url={`${api}/${editing?.id ?? ''}`}
        row={editing}
        successMessage="Changes saved"
        failureMessage="Could not save the changes."
        onSaved={changed}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title={`${verb} this ${noun}?`}
        description={deleting && <>“{describe(deleting)}” will be {verb === 'Delete' ? 'deleted' : `${verb.toLowerCase()}d`}. {config.deleteNote ?? 'This cannot be undone.'}</>}
        confirmLabel={verb}
        onConfirm={remove}
      />
    </>
  )
}
