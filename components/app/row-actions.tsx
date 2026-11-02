'use client'

import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RowActionsProps = {
  /** The row's name for screen readers and tests: buttons are labelled "Edit <name>" and "Delete <name>". */
  name: string
  onEdit?: () => void
  onDelete?: () => void
  /** Wording of the delete button, e.g. 'Remove' for a membership. */
  deleteVerb?: string
  /** More buttons before edit/delete. */
  children?: ReactNode
}

/** The usual edit and delete icon buttons for a DataTable row. */
export function RowActions({ name, onEdit, onDelete, deleteVerb = 'Delete', children }: RowActionsProps) {
  return (
    <>
      {children}
      {onEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${name}`} title="Edit">
          <Pencil aria-hidden />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`${deleteVerb} ${name}`} title={deleteVerb}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 aria-hidden />
        </Button>
      )}
    </>
  )
}
