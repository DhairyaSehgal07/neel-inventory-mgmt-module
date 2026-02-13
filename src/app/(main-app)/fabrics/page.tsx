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

export default function FabricsPage() {
  const router = useRouter()
  const [data, setData] = React.useState<FabricRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FabricRow | null>(null)
  const [isDeletingId, setIsDeletingId] = React.useState<number | null>(null)

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
            <FabricsDataTable
              columns={columns}
              data={data}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isDeletingId={isDeletingId}
            />
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
