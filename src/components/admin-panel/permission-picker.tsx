"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Permission, PermissionGroups } from "@/lib/rbac/permissions"

const GROUP_LABELS: Record<keyof typeof PermissionGroups, string> = {
  BELT: "Belt",
  USER: "User Management",
  DASHBOARD: "Dashboard",
  REPORTS: "Reports",
  COMPOUND_TYPE: "Compound Master",
  COMPOUND_BATCH: "Compound Batch",
  RAW_MATERIAL_BATCH: "Raw Material Batch",
  RATING: "Rating",
  FABRIC_TYPE: "Fabric Type",
  FABRIC_STRENGTH: "Fabric Strength",
  FABRIC_WIDTH: "Fabric Width",
  FABRIC: "Fabric",
}

function permissionLabel(permission: Permission) {
  const parts = permission.split(":")
  return parts.length > 1 ? parts.slice(1).join(":").replace(/_/g, " ") : permission
}

interface PermissionPickerProps {
  value: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
}

export function PermissionPicker({ value, onChange, disabled }: PermissionPickerProps) {
  const selectedSet = React.useMemo(() => new Set(value), [value])

  const togglePermission = (permission: Permission, checked: boolean) => {
    if (checked) {
      onChange([...value, permission])
    } else {
      onChange(value.filter((p) => p !== permission))
    }
  }

  const toggleGroup = (groupPermissions: readonly Permission[], selectAll: boolean) => {
    if (selectAll) {
      const merged = new Set([...value, ...groupPermissions])
      onChange(Array.from(merged))
    } else {
      const groupSet = new Set(groupPermissions)
      onChange(value.filter((p) => !groupSet.has(p)))
    }
  }

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto rounded-md border p-4">
      {(Object.keys(PermissionGroups) as Array<keyof typeof PermissionGroups>).map(
        (groupKey, index) => {
          const groupPermissions = PermissionGroups[groupKey]
          const allSelected = groupPermissions.every((p) => selectedSet.has(p))
          const someSelected = groupPermissions.some((p) => selectedSet.has(p))

          return (
            <div key={groupKey}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">{GROUP_LABELS[groupKey]}</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={disabled || allSelected}
                    onClick={() => toggleGroup(groupPermissions, true)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={disabled || !someSelected}
                    onClick={() => toggleGroup(groupPermissions, false)}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {groupPermissions.map((permission) => (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={permission}
                      checked={selectedSet.has(permission)}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        togglePermission(permission, checked === true)
                      }
                    />
                    <Label
                      htmlFor={permission}
                      className="text-sm font-normal capitalize cursor-pointer"
                    >
                      {permissionLabel(permission)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )
        }
      )}
    </div>
  )
}
