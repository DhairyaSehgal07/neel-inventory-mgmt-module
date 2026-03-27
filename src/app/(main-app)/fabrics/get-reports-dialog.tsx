"use client"

import * as React from "react"
import { format } from "date-fns"
import { FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { FabricRow } from "./columns"
import {
  getFabricListReportExcelBlob,
  getFabricListReportExcelFilename,
} from "./excel/fabric-list-report-excel"
import {
  prepareFabricsForCategoryReport,
  type ReportCategoryId,
} from "./fabric-list-report-shared"
import { getFabricListReportPdfBlob } from "./pdf/fabric-list-report-pdf"

const REPORT_CATEGORY_IDS = [
  "all",
  "PACKED",
  "IN_USE",
  "CLOSED",
  "OPEN",
  "REJECTED",
  "TRADED",
] as const

function categoryLabel(id: (typeof REPORT_CATEGORY_IDS)[number]): string {
  if (id === "all") return "All"
  return id
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

type GetReportsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fabrics: FabricRow[]
}

export function GetReportsDialog({
  open,
  onOpenChange,
  fabrics,
}: GetReportsDialogProps) {
  const [exportLoading, setExportLoading] = React.useState<{
    kind: "pdf" | "excel"
    categoryId: ReportCategoryId
  } | null>(null)

  const handlePdfClick = React.useCallback(
    async (categoryId: ReportCategoryId) => {
      const label = categoryLabel(
        categoryId as (typeof REPORT_CATEGORY_IDS)[number]
      )
      setExportLoading({ kind: "pdf", categoryId })
      try {
        const rows = prepareFabricsForCategoryReport(fabrics, categoryId)
        const title = `Fabric report — ${label}`
        const generatedAtLabel = `Generated ${format(new Date(), "PPpp")}`
        const blob = await getFabricListReportPdfBlob(rows, title, generatedAtLabel)
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank", "noopener,noreferrer")
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } catch {
        toast.error("Could not generate PDF. Please try again.")
      } finally {
        setExportLoading(null)
      }
    },
    [fabrics]
  )

  const handleExcelClick = React.useCallback(
    async (categoryId: ReportCategoryId) => {
      const label = categoryLabel(
        categoryId as (typeof REPORT_CATEGORY_IDS)[number]
      )
      setExportLoading({ kind: "excel", categoryId })
      try {
        const rows = prepareFabricsForCategoryReport(fabrics, categoryId)
        const title = `Fabric report — ${label}`
        const generatedAtLabel = `Generated ${format(new Date(), "PPpp")}`
        const blob = getFabricListReportExcelBlob(rows, title, generatedAtLabel)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = getFabricListReportExcelFilename(label)
        a.rel = "noopener"
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } catch {
        toast.error("Could not generate Excel file. Please try again.")
      } finally {
        setExportLoading(null)
      }
    },
    [fabrics]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fabric reports</DialogTitle>
          <DialogDescription>
            Download a report for each status. PDF and Excel formats are
            available per category.
          </DialogDescription>
        </DialogHeader>

        <div className="border-y border-dashed border-border py-1">
          <div
            className="grid grid-cols-[minmax(0,1fr)_2.75rem_2.75rem] items-end gap-x-3 border-b border-border pb-2"
            aria-hidden
          >
            <span />
            <span className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              PDF
            </span>
            <span className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Excel
            </span>
          </div>
          <div className="divide-y divide-border" role="list" aria-label="Report categories">
            {REPORT_CATEGORY_IDS.map((id) => {
              const label = categoryLabel(id)
              return (
                <div
                  key={id}
                  role="listitem"
                  className="grid grid-cols-[minmax(0,1fr)_2.75rem_2.75rem] items-center gap-x-3 gap-y-1 py-3"
                >
                  <span className="text-sm font-medium leading-none">{label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="justify-self-center text-muted-foreground hover:text-foreground"
                    title={`Download PDF — ${label}`}
                    aria-label={`Download PDF report for ${label}`}
                    disabled={exportLoading !== null}
                    onClick={() => handlePdfClick(id as ReportCategoryId)}
                  >
                    {exportLoading?.kind === "pdf" &&
                    exportLoading.categoryId === id ? (
                      <Spinner className="h-4 w-4" aria-hidden />
                    ) : (
                      <FileText className="h-4 w-4" aria-hidden />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="justify-self-center text-muted-foreground hover:text-foreground"
                    title={`Download Excel — ${label}`}
                    aria-label={`Download Excel report for ${label}`}
                    disabled={exportLoading !== null}
                    onClick={() => handleExcelClick(id as ReportCategoryId)}
                  >
                    {exportLoading?.kind === "excel" &&
                    exportLoading.categoryId === id ? (
                      <Spinner className="h-4 w-4" aria-hidden />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" aria-hidden />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
