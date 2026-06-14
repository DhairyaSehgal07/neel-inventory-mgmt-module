"use client"

import { Pencil, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserResponse } from "@/lib/api/user-response"
import { useAdminPanelActions } from "./admin-actions-context"

interface DataTableRowActionsProps {
  user: UserResponse
  isDeleting?: boolean
}

export function DataTableRowActions({ user, isDeleting }: DataTableRowActionsProps) {
  const { data: session } = useSession()
  const { onEditUser, onDeleteUser } = useAdminPanelActions()
  const isSelf = session?.user?.id === String(user.id)

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isSelf}
              onClick={(e) => {
                e.stopPropagation()
                onEditUser(user)
              }}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit user</span>
            </Button>
          </span>
        </TooltipTrigger>
        {isSelf && (
          <TooltipContent>You cannot edit your own account</TooltipContent>
        )}
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={isSelf || isDeleting}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteUser(user)
              }}
            >
              {isDeleting ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete user</span>
            </Button>
          </span>
        </TooltipTrigger>
        {isSelf && (
          <TooltipContent>You cannot delete your own account</TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}
