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
import { columns, FabricType } from "./columns"
import { FabricTypeForm } from "./fabric-type-form"

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
  if (res.status === 409) return "A fabric type with this name already exists."
  if (res.status >= 500) return "Something went wrong on the server. Please try again later."
  return fallback
}

export default function FabricTypesPage() {
  const [data, setData] = React.useState<FabricType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingFabricType, setEditingFabricType] =
    React.useState<FabricType | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FabricType | null>(null)
  const [isDeletingId, setIsDeletingId] = React.useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchFabricTypes = React.useCallback(async () => {
    setFetchError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/fabric-types")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to load fabric types")
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
    fetchFabricTypes()
  }, [fetchFabricTypes])

  const handleAdd = () => {
    setEditingFabricType(null)
    setIsFormOpen(true)
  }

  const handleEdit = (fabricType: FabricType) => {
    setEditingFabricType(fabricType)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (fabricType: FabricType) => {
    setDeleteTarget(fabricType)
  }

  const handleConfirmDelete = async () => {
    const toDelete = deleteTarget
    if (!toDelete) return
    setDeleteTarget(null)
    setIsDeletingId(toDelete.id)
    try {
      const res = await fetch(`/api/fabric-types/${toDelete.id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to delete fabric type")
        toast.error(message)
        return
      }
      toast.success("Fabric type deleted successfully")
      await fetchFabricTypes()
    } catch {
      toast.error("Unable to connect. Please check your network and try again.")
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSubmit = async (formData: { name: string }) => {
    setIsSubmitting(true)
    try {
      if (editingFabricType) {
        const res = await fetch(`/api/fabric-types/${editingFabricType.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          const message = getErrorMessage(res, json, "Failed to update fabric type")
          toast.error(message)
          throw new Error(message)
        }
        toast.success("Fabric type updated successfully")
      } else {
        const res = await fetch("/api/fabric-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          const message = getErrorMessage(res, json, "Failed to create fabric type")
          toast.error(message)
          throw new Error(message)
        }
        toast.success("Fabric type created successfully")
      }
      setEditingFabricType(null)
      await fetchFabricTypes()
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
              <CardTitle>Fabric Types</CardTitle>
              <CardDescription>
                Manage fabric types in your inventory system.
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fabric Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Spinner className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading fabric types…</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <p className="text-sm text-destructive text-center max-w-sm">
                {fetchError}
              </p>
              <Button variant="outline" onClick={fetchFabricTypes} className="gap-2">
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

      <FabricTypeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        initialData={editingFabricType}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fabric type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name ?? ""}&quot;? This action cannot be undone.
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
