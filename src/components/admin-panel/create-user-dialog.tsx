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
import { Permission } from "@/lib/rbac/permissions"
import { getDefaultPermissionsForRole } from "@/lib/rbac/role-defaults"
import type { Role } from "@/model/User"
import { PermissionPicker } from "./permission-picker"

const ROLES: Role[] = ["Admin", "Manager", "Supervisor", "Worker"]

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Manager", "Supervisor", "Worker"]),
  permissions: z.array(z.nativeEnum(Permission)),
  isActive: z.boolean(),
})

export type CreateUserFormData = z.infer<typeof formSchema>

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateUserFormData) => void | Promise<void>
  isSubmitting?: boolean
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateUserDialogProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      mobileNumber: "",
      password: "",
      role: "Worker" as Role,
      permissions: getDefaultPermissionsForRole("Worker"),
      isActive: true,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = formSchema.parse(value)
        await onSubmit(parsed)
        form.reset()
        onOpenChange(false)
      } catch {
        // Leave dialog open on error; parent shows toast
      }
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const role = form.state.values.role
  const showPermissions = role !== "Admin"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Add a new user with role and permissions.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="create-name">Name</FieldLabel>
                  <Input
                    id="create-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="mobileNumber">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="create-mobile">Mobile Number</FieldLabel>
                  <Input
                    id="create-mobile"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                  />
                  <FieldDescription>10-digit Indian mobile number</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="create-password">Password</FieldLabel>
                  <Input
                    id="create-password"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={isSubmitting}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

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
                      } else {
                        form.setFieldValue("permissions", [])
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
                      onChange={field.handleChange}
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
                    <FieldLabel htmlFor="create-active">Active</FieldLabel>
                    <FieldDescription>
                      Inactive users cannot sign in
                    </FieldDescription>
                  </div>
                  <Switch
                    id="create-active"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                    disabled={isSubmitting}
                  />
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
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
