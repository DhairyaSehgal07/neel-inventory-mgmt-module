"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, Inbox, Search, X } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onEdit?: (item: TData) => void
  onDelete?: (item: TData) => void
  isDeletingId?: number | null
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onEdit,
  onDelete,
  isDeletingId = null,
}: DataTableProps<TData, TValue>) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase().trim()
    return data.filter((item) => {
      return Object.values(item as Record<string, unknown>).some((value) => {
        if (typeof value === "string") return value.toLowerCase().includes(query)
        return false
      })
    })
  }, [data, searchQuery])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    meta: { onEdit, onDelete, isDeletingId },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageSize = table.getState().pagination.pageSize
  const totalRows = filteredData.length
  const startRow = totalRows > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endRow = Math.min(currentPage * pageSize, totalRows)

  React.useEffect(() => {
    table.setPageIndex(0)
  }, [searchQuery, table])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search fabric strengths..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id
                  const isSerialColumn = columnId === "serial"
                  const isActionsColumn = columnId === "actions"
                  return (
                    <TableHead
                      key={header.id}
                      className={`h-12 ${
                        isSerialColumn ? "text-center" : isActionsColumn ? "text-right" : "text-left"
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnId = cell.column.id
                    const isSerialColumn = columnId === "serial"
                    const isActionsColumn = columnId === "actions"
                    return (
                      <TableCell
                        key={cell.id}
                        className={`py-4 ${
                          isSerialColumn ? "text-center" : isActionsColumn ? "text-right" : "text-left"
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <div className="rounded-full bg-muted p-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {searchQuery ? "No results found" : "No fabric strengths found"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {searchQuery
                          ? `No fabric strengths match "${searchQuery}". Try a different search term.`
                          : "Get started by adding a new fabric strength."}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalRows > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {searchQuery && (
              <span className="mr-2">
                Found <span className="font-medium text-foreground">{totalRows}</span> result
                {totalRows !== 1 ? "s" : ""}
                {totalRows > 0 && " • "}
              </span>
            )}
            Showing <span className="font-medium text-foreground">{startRow}</span> to{" "}
            <span className="font-medium text-foreground">{endRow}</span> of{" "}
            <span className="font-medium text-foreground">{totalRows}</span> fabric strength
            {totalRows !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 px-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Page</span>
              <span className="font-medium text-foreground">{currentPage}</span>
              <span>of</span>
              <span className="font-medium text-foreground">{pageCount}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="gap-1.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
