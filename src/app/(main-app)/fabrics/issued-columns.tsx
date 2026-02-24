"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Eye } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type IssuedFabricRow = {
  id: number
  fabricId: number
  lengthIssued: number
  widthIssued: number
  purpose: string
  createdAt: string
  fabricLengthBeforeIssuance: number
  fabricWidthBeforeIssuance: number
  fabricLengthRemaining: number
  fabricWidthRemaining: number
  fabric: {
    id: number
    fabricCode: string
    fabricType: { id: number; name: string }
    fabricStrength: { id: number; name: string }
    fabricWidth: { id: number; value: number }
  }
  createdBy: { id: number; name: string }
}

export const issuedColumns: ColumnDef<IssuedFabricRow>[] = [
  {
    accessorKey: "id",
    header: "Issue ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.id}</span>
    ),
  },
  {
    id: "fabricCode",
    header: "Fabric code",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.fabric.fabricCode}</span>
    ),
  },
  {
    id: "fabricType",
    header: "Type",
    cell: ({ row }) => row.original.fabric.fabricType?.name ?? "—",
  },
  {
    id: "lengthIssued",
    header: "Length issued (m)",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.lengthIssued}</span>
    ),
  },
  {
    id: "widthIssued",
    header: "Width issued (m)",
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.widthIssued}</span>
    ),
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-[140px] block">
        {row.original.purpose || "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: "Issued at",
    cell: ({ row }) => (
      <span className="text-foreground">
        {format(new Date(row.original.createdAt), "PPp")}
      </span>
    ),
  },
  {
    id: "createdBy",
    header: "Issued by",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.createdBy?.name ?? "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row }) => {
      const fabricId = row.original.fabricId
      return (
        <div className="flex items-center justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                asChild
              >
                <Link href={`/fabrics/${fabricId}`} aria-label="View fabric">
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View fabric</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]
