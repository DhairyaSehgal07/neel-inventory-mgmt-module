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
import {
  formatGsm,
  getGsmCalculatedDisplay,
} from "./gsm-utils"

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
  locations?: { id: number; area: string; floor: string | null }[]
  status?: string | null
  assignTo?: string | null
}

export const columns: ColumnDef<FabricRow>[] = [
  {
    accessorKey: "fabricCode",
    header: "Fabric Code",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.fabricCode}</span>
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
    header: "Width (cm)",
    cell: ({ row }) => (
      <span className="text-foreground">
        {row.original.fabricWidthInitial} cm
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
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const locations = row.original.locations ?? []
      if (!locations.length) return <span className="text-muted-foreground">—</span>
      const first = locations[0]
      const parts = [first.area, first.floor].filter(Boolean)
      return (
        <span className="text-muted-foreground truncate max-w-[160px] block">
          {parts.join(", ")}
          {locations.length > 1 ? ` (+${locations.length - 1} more)` : ""}
        </span>
      )
    },
  },
  {
    id: "gsmCalculated",
    header: () => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b border-dotted border-muted-foreground">
            GSM (calc.)
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            Stored value when set; otherwise GSM (g/m²) = net weight (kg) × 1000 ÷
            (width (m) × current length (m)), for comparison with Neelkanth strength
            references.
          </p>
        </TooltipContent>
      </Tooltip>
    ),
    cell: ({ row }) => {
      const display = getGsmCalculatedDisplay(row.original)
      if (!display) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <span className="text-foreground">
          {formatGsm(display.value)}
          {display.source === "derived" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground ml-1 cursor-help text-xs">
                  (auto)
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Derived from net weight and dimensions; no stored calculated GSM.
                </p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </span>
      )
    },
  },
  {
    accessorKey: "gsmObserved",
    header: "GSM (obs.)",
    cell: ({ row }) => (
      <span className="text-foreground">
        {formatGsm(row.original.gsmObserved)}
      </span>
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
    accessorKey: "assignTo",
    header: "Assigned To",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.assignTo ?? "—"}
      </span>
    ),
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
