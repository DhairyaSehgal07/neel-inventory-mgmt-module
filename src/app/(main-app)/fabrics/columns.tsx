"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type FabricRow = {
  id: number
  date: string
  fabricDate: string
  fabricCode: string
  fabricTypeId: number
  fabricStrengthId: number
  fabricWidthId: number
  fabricLength: number
  nameOfVendor: string
  gsmObserved: number
  gsmCalculated: number
  netWeight: number
  fabricType: { id: number; name: string }
  fabricStrength: { id: number; name: string }
  fabricWidth: { id: number; value: number }
}

export const columns: ColumnDef<FabricRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "fabricDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.fabricDate}</span>
    ),
  },
  {
    id: "fabricType",
    header: "Type",
    cell: ({ row }) => row.original.fabricType?.name ?? "—",
  },
  {
    id: "fabricStrength",
    header: "Strength",
    cell: ({ row }) => row.original.fabricStrength?.name ?? "—",
  },
  {
    id: "fabricWidth",
    header: "Width",
    cell: ({ row }) =>
      row.original.fabricWidth != null
        ? `${row.original.fabricWidth.value} m`
        : "—",
  },
  {
    accessorKey: "fabricLength",
    header: "Length (m)",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.fabricLength}</span>
    ),
  },
  {
    accessorKey: "nameOfVendor",
    header: "Vendor",
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-[120px] block">
        {row.original.nameOfVendor || "—"}
      </span>
    ),
  },
  {
    accessorKey: "gsmObserved",
    header: "GSM",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.gsmObserved}</span>
    ),
  },
  {
    accessorKey: "netWeight",
    header: "Net (kg)",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.netWeight}</span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row, table }) => {
      const fabric = row.original
      const meta = table.options.meta as {
        onEdit?: (fabric: FabricRow) => void
        onDelete?: (fabric: FabricRow) => void
        isDeletingId?: number | null
      }
      const isDeleting = meta.isDeletingId === fabric.id

      return (
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                asChild
              >
                <Link href={`/fabrics/${fabric.id}`} aria-label="View fabric">
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View fabric</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                onClick={() => meta.onEdit?.(fabric)}
                disabled={isDeleting}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit fabric</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => meta.onDelete?.(fabric)}
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
              <p>{isDeleting ? "Deleting…" : "Delete fabric"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]
