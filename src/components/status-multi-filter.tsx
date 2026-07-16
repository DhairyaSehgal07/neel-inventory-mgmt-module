"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function effectiveStatuses<T extends string>(
  statusTab: "all" | T,
  selected: T[]
): T[] | null {
  if (statusTab !== "all") return [statusTab]
  if (selected.length === 0) return null
  return selected
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

type StatusMultiFilterProps<T extends string> = {
  options: readonly T[]
  value: T[]
  onChange: (next: T[]) => void
  disabled?: boolean
  className?: string
}

export function StatusMultiFilter<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
}: StatusMultiFilterProps<T>) {
  const selectedSet = React.useMemo(() => new Set(value), [value])
  const allSelected = options.length > 0 && options.every((o) => selectedSet.has(o))

  const toggle = (status: T, checked: boolean) => {
    if (checked) {
      onChange([...value, status])
    } else {
      onChange(value.filter((s) => s !== status))
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("gap-1.5", className)}
          aria-label="Filter by statuses"
        >
          Statuses
          {value.length > 0 ? (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {value.length}
            </span>
          ) : null}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Filter statuses</p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={allSelected}
              onClick={() => onChange([...options])}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={value.length === 0}
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {options.map((status) => {
            const id = `status-filter-${status}`
            return (
              <div key={status} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={selectedSet.has(status)}
                  onCheckedChange={(checked) => toggle(status, checked === true)}
                />
                <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                  {formatStatusLabel(status)}
                </Label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
