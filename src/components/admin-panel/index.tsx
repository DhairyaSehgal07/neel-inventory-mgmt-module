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
import type { UserResponse } from "@/lib/api/user-response"
import { AdminPanelActionsProvider } from "./admin-actions-context"
import { columns } from "./columns"
import { CreateUserDialog, type CreateUserFormData } from "./create-user-dialog"
import { DataTable } from "./data-table"
import { DeleteUserDialog } from "./delete-user-dialog"
import { EditUserDialog, type EditUserFormData } from "./edit-user-dialog"

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
  if (res.status === 409) return "A user with this mobile number already exists."
  if (res.status >= 500) return "Something went wrong on the server. Please try again later."
  return fallback
}

export function AdminPanel() {
  const [data, setData] = React.useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserResponse | null>(null)
  const [deletingUser, setDeletingUser] = React.useState<UserResponse | null>(null)
  const [isDeletingId, setIsDeletingId] = React.useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchUsers = React.useCallback(async () => {
    setFetchError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/users")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to load users")
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
    fetchUsers()
  }, [fetchUsers])

  const handleCreate = async (formData: CreateUserFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to create user")
        toast.error(message)
        throw new Error(message)
      }
      toast.success("User created successfully")
      await fetchUsers()
    } catch (err) {
      if (err instanceof Error && err.message) throw err
      toast.error("Something went wrong. Please try again.")
      throw new Error("Submit failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (userId: number, formData: EditUserFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to update user")
        toast.error(message)
        throw new Error(message)
      }
      toast.success("User updated successfully")
      setEditingUser(null)
      await fetchUsers()
    } catch (err) {
      if (err instanceof Error && err.message) throw err
      toast.error("Something went wrong. Please try again.")
      throw new Error("Submit failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    const toDelete = deletingUser
    if (!toDelete) return
    setIsDeletingId(toDelete.id)
    try {
      const res = await fetch(`/api/users/${toDelete.id}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = getErrorMessage(res, json, "Failed to delete user")
        toast.error(message)
        return
      }
      toast.success("User deleted successfully")
      setDeletingUser(null)
      await fetchUsers()
    } catch {
      toast.error("Unable to connect. Please check your network and try again.")
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <AdminPanelActionsProvider
      onEditUser={setEditingUser}
      onDeleteUser={setDeletingUser}
    >
      <div className="container mx-auto py-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage user accounts, roles, and permissions.
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Spinner className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading users…</p>
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <p className="text-sm text-destructive text-center max-w-sm">
                  {fetchError}
                </p>
                <Button variant="outline" onClick={fetchUsers} className="gap-2">
                  <RefreshCw className="size-4" />
                  Try again
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                isDeletingId={isDeletingId}
              />
            )}
          </CardContent>
        </Card>

        <CreateUserDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />

        <EditUserDialog
          user={editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSubmit={handleEdit}
          isSubmitting={isSubmitting}
        />

        <DeleteUserDialog
          user={deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeletingId !== null}
        />
      </div>
    </AdminPanelActionsProvider>
  )
}
