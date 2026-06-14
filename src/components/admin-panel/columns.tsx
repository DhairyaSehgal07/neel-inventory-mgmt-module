"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import type { UserResponse } from "@/lib/api/user-response"
import { DataTableRowActions } from "./row-actions"

function permissionLabel(permission: string) {
  const parts = permission.split(":")
  return parts.length > 1 ? parts.slice(1).join(":") : permission
}

export const columns: ColumnDef<UserResponse>[] = [
  {
    id: "serial",
    header: () => <div className="text-center w-full">S.No</div>,
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex
      const pageSize = table.getState().pagination.pageSize
      const serialNumber = pageIndex * pageSize + row.index + 1
      return (
        <div className="flex justify-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
            {serialNumber}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "mobileNumber",
    header: "Mobile Number",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("mobileNumber")}</div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={role === "Admin" ? "default" : "secondary"}>
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.getValue("permissions") as string[]
      if (!permissions?.length) {
        return <span className="text-muted-foreground text-sm">—</span>
      }
      const visible = permissions.slice(0, 3)
      const remaining = permissions.length - 3
      return (
        <div className="flex flex-wrap gap-1">
          {visible.map((permission) => (
            <Badge key={permission} variant="outline" className="text-xs">
              {permissionLabel(permission)}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="muted" className="text-xs">
              +{remaining} more
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      return (
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string | Date
      const date = new Date(createdAt)
      return (
        <div className="text-muted-foreground text-sm">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right w-full">Actions</div>,
    cell: ({ row, table }) => {
      const user = row.original
      const meta = table.options.meta as {
        isDeletingId?: number | null
      }
      const isDeleting = meta?.isDeletingId === user.id

      return <DataTableRowActions user={user} isDeleting={isDeleting} />
    },
  },
]
