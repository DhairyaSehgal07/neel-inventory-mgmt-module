"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FabricsDataTable } from "./data-table"
import { columns, type FabricRow } from "./columns"

function getErrorMessage(
  res: Response,
  json: { message?: string; success?: boolean },
  fallback: string
): string {
  if (json?.message && typeof json.message === "string") return json.message
  if (res.status === 400) return "Invalid request. Please check your input."
  if (res.status === 401) return "You are not authorized to perform this action."
  if (res.status === 403) return "You do not have permission to perform this action."
  if (res.status === 404) return "The requested item was not found."
  if (res.status >= 500) return "Something went wrong on the server. Please try again later."
  return fallback
}

const FABRIC_STATUSES = [
  "PACKED",
  "IN_USE",
  "CLOSED",
  "OPEN",
  "REJECTED",
  "TRADED",
] as const

type StatusTabId = "all" | (typeof FABRIC_STATUSES)[number]

function statusTabLabel(id: StatusTabId): string {
  if (id === "all") return "All"
  return id
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

export default function FabricsPage() {
  const router = useRouter()
  const [statusTab, setStatusTab] = React.useState<StatusTabId>("all")
  const [data, setData] = React.useState<FabricRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FabricRow | null>(null)
  const [isDeletingId, setIsDeletingId] = React.useState<number | null>(null)
  const [strengthFilter, setStrengthFilter] = React.useState<string>("all")
  const [widthFilter, setWidthFilter] = React.useState<string>("all")
  const [vendorFilter, setVendorFilter] = React.useState<string>("all")

  const strengthOptions = React.useMemo(() => {
    const names = data
      .map((f) => f.fabricStrength?.name)
      .filter((n): n is string => Boolean(n))
    return [...new Set(names)].sort()
  }, [data])

  const widthOptions = React.useMemo(() => {
    const values = data
      .map((f) => f.fabricWidth?.value)
      .filter((v): v is number => v != null && !Number.isNaN(v))
    return [...new Set(values)].sort((a, b) => a - b)
  }, [data])

  const vendorOptions = React.useMemo(() => {
    const names = data
      .map((f) => f.nameOfVendor?.trim())
      .filter((n): n is string => Boolean(n))
    return [...new Set(names)].sort()
  }, [data])

  const filteredData = React.useMemo(() => {
    let result = data
    if (statusTab !== "all") {
      result = result.filter((f) => (f.status ?? "") === statusTab)
    }
    if (strengthFilter !== "all") {
      result = result.filter((f) => f.fabricStrength?.name === strengthFilter)
    }
    if (widthFilter !== "all") {
      const widthValue = Number(widthFilter)
      result = result.filter(
        (f) => f.fabricWidth?.value != null && f.fabricWidth.value === widthValue
      )
    }
    if (vendorFilter !== "all") {
      result = result.filter(
        (f) => (f.nameOfVendor?.trim() ?? "") === vendorFilter
      )
    }
    return result
  }, [data, statusTab, strengthFilter, widthFilter, vendorFilter])

  const hasActiveFilters =
    strengthFilter !== "all" ||
    widthFilter !== "all" ||
    vendorFilter !== "all"

  const clearAllFilters = () => {
    setStrengthFilter("all")
    setWidthFilter("all")
    setVendorFilter("all")
  }

  const fetchFabrics = React.useCallback(async () => {
    setFetchError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/fabrics")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to load fabrics")
        setFetchError(message)
        toast.error(message)
        return
      }
      const list = json.data ?? []
      setData(
        list.map((f: FabricRow) => ({
          ...f,
          date: typeof f.date === "string" ? f.date : new Date(f.date).toISOString(),
        }))
      )
    } catch {
      const message =
        "Unable to connect. Please check your network and try again."
      setFetchError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchFabrics()
  }, [fetchFabrics])

  const handleEdit = (fabric: FabricRow) => {
    router.push(`/fabrics/${fabric.id}/edit`)
  }

  const handleDeleteClick = (fabric: FabricRow) => {
    setDeleteTarget(fabric)
  }

  const handleConfirmDelete = async () => {
    const toDelete = deleteTarget
    if (!toDelete) return
    setDeleteTarget(null)
    setIsDeletingId(toDelete.id)
    try {
      const res = await fetch(`/api/fabrics/${toDelete.id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to delete fabric")
        toast.error(message)
        return
      }
      toast.success("Fabric deleted successfully")
      await fetchFabrics()
    } catch {
      toast.error("Failed to delete fabric")
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fabrics</h1>
        <p className="text-muted-foreground text-sm">
          View and manage fabric inventory.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>All Fabrics</CardTitle>
            <CardDescription>
              Browse fabrics in a table. Use the eye icon to view details,
              edit to update, or delete to remove.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchFabrics} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button asChild className="gap-2">
              <Link href="/fabrics/new">
                <Plus className="h-4 w-4" />
                Add Fabric
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{fetchError}</p>
              <Button
                variant="outline"
                onClick={fetchFabrics}
                className="mt-3"
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-border mb-4">
                <nav className="flex flex-wrap gap-1" aria-label="Status filter">
                  {(["all", ...FABRIC_STATUSES] as const).map((tabId) => (
                    <Button
                      key={tabId}
                      variant="ghost"
                      size="sm"
                      className={`rounded-b-none border-b-2 transition-colors ${
                        statusTab === tabId
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setStatusTab(tabId)}
                    >
                      {statusTabLabel(tabId)}
                    </Button>
                  ))}
                </nav>
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Strength
                  </span>
                  <Select
                    value={strengthFilter}
                    onValueChange={setStrengthFilter}
                  >
                    <SelectTrigger className="w-[180px]" size="sm">
                      <SelectValue placeholder="All strengths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All strengths</SelectItem>
                      {strengthOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Width
                  </span>
                  <Select value={widthFilter} onValueChange={setWidthFilter}>
                    <SelectTrigger className="w-[180px]" size="sm">
                      <SelectValue placeholder="All widths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All widths</SelectItem>
                      {widthOptions.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} m
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Vendor
                  </span>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger className="w-[180px]" size="sm">
                      <SelectValue placeholder="All vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All vendors</SelectItem>
                      {vendorOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
              <FabricsDataTable
                columns={columns}
                data={filteredData}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isDeletingId={isDeletingId}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fabric</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fabric? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
