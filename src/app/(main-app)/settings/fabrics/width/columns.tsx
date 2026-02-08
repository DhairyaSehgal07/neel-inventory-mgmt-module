"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type FabricWidth = {
  id: number
  value: number
}

export const columns: ColumnDef<FabricWidth>[] = [
  {
    id: "serial",
    header: () => <div className="text-center w-full">S.No</div>,
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex
      const pageSize = table.getState().pagination.pageSize
      const serialNumber = pageIndex * pageSize + row.index + 1
      return (
        <div className="flex justify-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
            {serialNumber}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "value",
    header: "Width (value)",
    cell: ({ row }) => {
      return (
        <div className="font-medium text-foreground">
          {row.getValue("value")}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row, table }) => {
      const fabricWidth = row.original
      const meta = table.options.meta as {
        onEdit?: (fabricWidth: FabricWidth) => void
        onDelete?: (fabricWidth: FabricWidth) => void
        isDeletingId?: number | null
      }
      const isDeleting = meta.isDeletingId === fabricWidth.id

      return (
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                onClick={() => meta.onEdit?.(fabricWidth)}
                disabled={isDeleting}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit fabric width</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => meta.onDelete?.(fabricWidth)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Delete</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDeleting ? "Deleting…" : "Delete fabric width"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]
