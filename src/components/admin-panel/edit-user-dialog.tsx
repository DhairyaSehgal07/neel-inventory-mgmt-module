"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import type { UserResponse } from "@/lib/api/user-response"
import { Permission } from "@/lib/rbac/permissions"
import { getDefaultPermissionsForRole } from "@/lib/rbac/role-defaults"
import type { Role } from "@/model/User"
import { PermissionPicker } from "./permission-picker"

const ROLES: Role[] = ["Admin", "Manager", "Supervisor", "Worker"]

const formSchema = z.object({
  role: z.enum(["Admin", "Manager", "Supervisor", "Worker"]),
  permissions: z.array(z.nativeEnum(Permission)),
  isActive: z.boolean(),
  password: z.string(),
})

export type EditUserFormData = {
  role: Role
  permissions?: Permission[]
  isActive: boolean
  password?: string
}

interface EditUserDialogProps {
  user: UserResponse | null
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: number, data: EditUserFormData) => void | Promise<void>
  isSubmitting?: boolean
}

function EditUserDialogForm({
  user,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  user: UserResponse
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: number, data: EditUserFormData) => void | Promise<void>
  isSubmitting: boolean
}) {
  const [permissionsTouched, setPermissionsTouched] = React.useState(false)

  const form = useForm({
    defaultValues: {
      role: user.role as Role,
      permissions: (user.permissions ?? []) as Permission[],
      isActive: user.isActive,
      password: "",
    },
    validators: {
      onSubmit: formSchema.superRefine((data, ctx) => {
        if (data.password && data.password.length > 0 && data.password.length < 6) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Password must be at least 6 characters",
            path: ["password"],
          })
        }
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: EditUserFormData = {
          role: value.role,
          isActive: value.isActive,
        }
        if (permissionsTouched) {
          payload.permissions = value.permissions
        }
        if (value.password.trim()) {
          payload.password = value.password
        }
        await onSubmit(user.id, payload)
        onOpenChange(false)
      } catch {
        // Leave dialog open on error
      }
    },
  })

  const role = form.state.values.role
  const showPermissions = role !== "Admin"

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input value={user.name} disabled />
        </Field>

        <Field>
          <FieldLabel>Mobile Number</FieldLabel>
          <Input value={user.mobileNumber} disabled />
        </Field>

        <form.Field name="role">
          {(field) => (
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) => {
                  const newRole = value as Role
                  field.handleChange(newRole)
                  if (newRole !== "Admin") {
                    form.setFieldValue(
                      "permissions",
                      getDefaultPermissionsForRole(newRole)
                    )
                    setPermissionsTouched(true)
                  } else {
                    form.setFieldValue("permissions", [])
                    setPermissionsTouched(true)
                  }
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        {showPermissions && (
          <form.Field name="permissions">
            {(field) => (
              <Field>
                <FieldLabel>Permissions</FieldLabel>
                <PermissionPicker
                  value={field.state.value}
                  onChange={(perms) => {
                    setPermissionsTouched(true)
                    field.handleChange(perms)
                  }}
                  disabled={isSubmitting}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        )}

        <form.Field name="isActive">
          {(field) => (
            <Field orientation="horizontal">
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="edit-active">Active</FieldLabel>
                <FieldDescription>Inactive users cannot sign in</FieldDescription>
              </div>
              <Switch
                id="edit-active"
                checked={field.state.value}
                onCheckedChange={field.handleChange}
                disabled={isSubmitting}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="edit-password">New Password</FieldLabel>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isSubmitting}
              />
              <FieldDescription>Optional — min 6 characters if provided</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: EditUserDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update role, permissions, status, or reset password.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <EditUserDialogForm
            key={user.id}
            user={user}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
