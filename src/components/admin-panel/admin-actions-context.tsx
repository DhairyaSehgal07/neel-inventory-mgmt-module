"use client"

import * as React from "react"
import type { UserResponse } from "@/lib/api/user-response"

interface AdminPanelActionsContextValue {
  onEditUser: (user: UserResponse) => void
  onDeleteUser: (user: UserResponse) => void
}

const AdminPanelActionsContext =
  React.createContext<AdminPanelActionsContextValue | null>(null)

export function AdminPanelActionsProvider({
  children,
  onEditUser,
  onDeleteUser,
}: AdminPanelActionsContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ onEditUser, onDeleteUser }),
    [onEditUser, onDeleteUser]
  )

  return (
    <AdminPanelActionsContext.Provider value={value}>
      {children}
    </AdminPanelActionsContext.Provider>
  )
}

export function useAdminPanelActions() {
  const context = React.useContext(AdminPanelActionsContext)
  if (!context) {
    throw new Error("useAdminPanelActions must be used within AdminPanelActionsProvider")
  }
  return context
}
