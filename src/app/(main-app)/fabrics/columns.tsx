"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { format } from "date-fns"
import QRCode from "qrcode"
import { Eye, Pencil, Printer, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStatusBadgeVariant } from "./utils"
import { Spinner } from "@/components/ui/spinner"
import {
  getSingleFabricPdfBlob,
  type SingleFabricPdfParams,
} from "@/components/pdf/Single-Fabric-Roll-Pdf"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type FabricRowActionsMeta = {
  onEdit?: (fabric: FabricRow) => void
  onDelete?: (fabric: FabricRow) => void
  isDeletingId?: number | null
}

function FabricRowActions({
  fabric,
  meta,
}: {
  fabric: FabricRow
  meta: FabricRowActionsMeta
}) {
  const [isPrinting, setIsPrinting] = React.useState(false)
  const isDeleting = meta.isDeletingId === fabric.id

  const handlePrint = React.useCallback(async () => {
    setIsPrinting(true)
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? window.location.origin).replace(
        /\/$/,
        ""
      )
      const productUrl = `${baseUrl}/fabrics/${fabric.id}`
      const qrDataUrl = await QRCode.toDataURL(productUrl, {
        type: "image/png",
        margin: 2,
        width: 256,
      })
      const params: SingleFabricPdfParams = {
        productUrl,
        qrDataUrl,
        id: fabric.id,
        dateDisplay: format(new Date(fabric.date), "PPP"),
        fabricCode: fabric.fabricCode,
        fabricTypeName: fabric.fabricType?.name ?? "",
        fabricStrengthName: fabric.fabricStrength?.name ?? "",
        fabricWidthValue: fabric.fabricWidth?.value ?? 0,
        fabricWidthInitial: fabric.fabricWidthInitial,
        fabricWidthCurrent: fabric.fabricWidthCurrent,
        fabricLengthInitial: fabric.fabricLengthInitial,
        fabricLengthCurrent: fabric.fabricLengthCurrent,
        nameOfVendor: fabric.nameOfVendor ?? "",
        gsmObserved: fabric.gsmObserved,
        gsmCalculated: fabric.gsmCalculated,
        netWeight: fabric.netWeight,
        status: fabric.status ?? null,
      }
      const blob = await getSingleFabricPdfBlob(params)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } finally {
      setIsPrinting(false)
    }
  }, [fabric])

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
            onClick={handlePrint}
            disabled={isDeleting || isPrinting}
            aria-label="Print fabric"
          >
            {isPrinting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Print fabric</p>
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
}

export type FabricRow = {
  id: number
  date: string
  fabricDate: string
  fabricCode: string
  fabricTypeId: number
  fabricStrengthId: number
  fabricWidthId: number
  fabricLengthInitial: number
  fabricLengthCurrent: number
  fabricWidthInitial: number
  fabricWidthCurrent: number
  nameOfVendor: string
  gsmObserved: number
  gsmCalculated: number
  netWeight: number
  fabricType: { id: number; name: string }
  fabricStrength: { id: number; name: string }
  fabricWidth: { id: number; value: number }
  status?: string | null
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
    header: "Width (m)",
    cell: ({ row }) => (
      <span className="text-foreground">
        {row.original.fabricWidthInitial != null && row.original.fabricWidthCurrent != null
          ? `${row.original.fabricWidthCurrent} / ${row.original.fabricWidthInitial}`
          : row.original.fabricWidth != null
            ? `${row.original.fabricWidth.value} m`
            : "—"}
      </span>
    ),
  },
  {
    id: "fabricLength",
    header: "Length (m)",
    cell: ({ row }) => (
      <span className="text-foreground">
        {row.original.fabricLengthCurrent} / {row.original.fabricLengthInitial}
      </span>
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status ?? "—"
      const variant = getStatusBadgeVariant(row.original.status)
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row, table }) => {
      const fabric = row.original
      const meta = table.options.meta as FabricRowActionsMeta
      return <FabricRowActions fabric={fabric} meta={meta} />
    },
  },
]
