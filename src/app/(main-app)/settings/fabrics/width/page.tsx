"use client"

import * as React from "react"
import { Plus, RefreshCw } from "lucide-react"
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
import { DataTable } from "./data-table"
import { columns, FabricWidth } from "./columns"
import { FabricWidthForm } from "./fabric-width-form"

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
  if (res.status === 409) return "A fabric width with this value already exists."
  if (res.status >= 500) return "Something went wrong on the server. Please try again later."
  return fallback
}

export default function FabricWidthsPage() {
  const [data, setData] = React.useState<FabricWidth[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingFabricWidth, setEditingFabricWidth] =
    React.useState<FabricWidth | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FabricWidth | null>(null)
  const [isDeletingId, setIsDeletingId] = React.useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchFabricWidths = React.useCallback(async () => {
    setFetchError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/fabric-widths")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to load fabric widths")
        setFetchError(message)
        toast.error(message)
        return
      }
      setData(json.data ?? [])
    } catch {
      const message = "Unable to connect. Please check your network and try again."
      setFetchError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchFabricWidths()
  }, [fetchFabricWidths])

  const handleAdd = () => {
    setEditingFabricWidth(null)
    setIsFormOpen(true)
  }

  const handleEdit = (fabricWidth: FabricWidth) => {
    setEditingFabricWidth(fabricWidth)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (fabricWidth: FabricWidth) => {
    setDeleteTarget(fabricWidth)
  }

  const handleConfirmDelete = async () => {
    const toDelete = deleteTarget
    if (!toDelete) return
    setDeleteTarget(null)
    setIsDeletingId(toDelete.id)
    try {
      const res = await fetch(`/api/fabric-widths/${toDelete.id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to delete fabric width")
        toast.error(message)
        return
      }
      toast.success("Fabric width deleted successfully")
      await fetchFabricWidths()
    } catch {
      toast.error("Unable to connect. Please check your network and try again.")
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSubmit = async (formData: { value: number }) => {
    setIsSubmitting(true)
    try {
      if (editingFabricWidth) {
        const res = await fetch(`/api/fabric-widths/${editingFabricWidth.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: formData.value }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          const message = getErrorMessage(res, json, "Failed to update fabric width")
          toast.error(message)
          throw new Error(message)
        }
        toast.success("Fabric width updated successfully")
      } else {
        const res = await fetch("/api/fabric-widths", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: formData.value }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          const message = getErrorMessage(res, json, "Failed to create fabric width")
          toast.error(message)
          throw new Error(message)
        }
        toast.success("Fabric width created successfully")
      }
      setEditingFabricWidth(null)
      await fetchFabricWidths()
    } catch (err) {
      if (err instanceof Error && err.message) throw err
      toast.error("Something went wrong. Please try again.")
      throw new Error("Submit failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fabric Widths</CardTitle>
              <CardDescription>
                Manage fabric widths in your inventory system.
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fabric Width
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading fabric widths…</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <p className="text-sm text-destructive text-center max-w-sm">
                {fetchError}
              </p>
              <Button variant="outline" onClick={fetchFabricWidths} className="gap-2">
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              isDeletingId={isDeletingId}
            />
          )}
        </CardContent>
      </Card>

      <FabricWidthForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        initialData={editingFabricWidth}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fabric width</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete width &quot;{deleteTarget?.value ?? ""}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
