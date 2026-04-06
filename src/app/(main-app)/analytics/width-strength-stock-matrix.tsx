"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type MatrixResponse = {
  widths: { id: number; value: number }[]
  strengths: { id: number; name: string }[]
  totalLengthMByWidthRow: number[][]
  fabricCountByWidthRow: number[][]
  stats: {
    minTotalLengthM: number
    maxTotalLengthM: number
    grandTotalLengthM: number
  }
}

function getErrorMessage(
  res: Response,
  json: { message?: string },
  fallback: string
): string {
  if (json?.message && typeof json.message === "string") return json.message
  if (res.status === 403) return "You do not have permission to view fabric analytics."
  if (res.status === 401) return "You must be signed in to view analytics."
  return fallback
}

async function fetchMatrix(): Promise<MatrixResponse> {
  const res = await fetch("/api/fabrics/analytics/width-strength-matrix")
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: MatrixResponse
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(getErrorMessage(res, json, "Failed to load stock matrix"))
  }
  return json.data
}

/** `totalLengthMByWidthRow[widthIdx][strengthIdx]` */
function metersAt(
  matrix: number[][],
  widthIdx: number,
  strengthIdx: number
): number {
  return matrix[widthIdx]?.[strengthIdx] ?? 0
}

function formatMeters(m: number): string {
  if (m === 0) return "—"
  if (Math.abs(m) >= 1000) return `${(m / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}k`
  return m.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function formatMetersFull(m: number): string {
  return m.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * Heat color for positive meters: light (low) → saturated (high).
 * Zero is handled separately (gap styling).
 */
function heatStyle(
  meters: number,
  minPos: number,
  maxPos: number
): React.CSSProperties {
  if (meters <= 0) {
    return {
      backgroundImage:
        "repeating-linear-gradient(135deg, hsl(var(--muted)) 0px, hsl(var(--muted)) 5px, hsl(var(--background)) 5px, hsl(var(--background)) 10px)",
    }
  }
  const t =
    maxPos <= minPos ? 1 : (meters - minPos) / (maxPos - minPos)
  const mix = Math.round(12 + t * 88)
  return {
    backgroundColor: `color-mix(in oklch, hsl(var(--chart-2)) ${mix}%, hsl(var(--card)))`,
  }
}

function cellTextClass(meters: number, minPos: number, maxPos: number): string {
  if (meters <= 0) return "text-muted-foreground"
  const t =
    maxPos <= minPos ? 1 : (meters - minPos) / (maxPos - minPos)
  return t > 0.55 ? "text-primary-foreground" : "text-foreground"
}

export function WidthStrengthStockMatrix() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["fabric-analytics", "width-strength-matrix"],
    queryFn: fetchMatrix,
  })

  const { minPos, maxPos, colTotals, rowTotals } = React.useMemo(() => {
    if (!data?.totalLengthMByWidthRow.length) {
      return {
        minPos: 0,
        maxPos: 0,
        colTotals: [] as number[],
        rowTotals: [] as number[],
      }
    }
    const { widths, strengths, totalLengthMByWidthRow: M } = data
    const colTotals = widths.map((_, wi) =>
      strengths.reduce(
        (sum, _, si) => sum + metersAt(M, wi, si),
        0
      )
    )
    const rowTotals = strengths.map((_, si) =>
      widths.reduce(
        (sum, _, wi) => sum + metersAt(M, wi, si),
        0
      )
    )
    const minPos = data.stats.minTotalLengthM
    const maxPos = data.stats.maxTotalLengthM
    return { minPos, maxPos, colTotals, rowTotals }
  }, [data])

  const strengthCount = data?.strengths.length ?? 0
  const widthCount = data?.widths.length ?? 0

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Width × strength stock matrix</CardTitle>
            <CardDescription>
              Live balance (meters) for every width and strength. Darker cells hold more
              stock; hatched cells are gaps (no meters). Row and column totals help spot
              where inventory piles up or is thin.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {data && (
          <p className="text-muted-foreground text-sm">
            Total live balance:{" "}
            <span className="text-foreground font-medium tabular-nums">
              {data.stats.grandTotalLengthM.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}{" "}
              m
            </span>
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="flex min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="size-5" />
            Loading matrix…
          </div>
        )}
        {error && (
          <div className="text-destructive bg-destructive/5 rounded-lg border border-destructive/20 px-4 py-3 text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}
        {!isLoading && !error && data && strengthCount > 0 && widthCount > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
              <table className="w-max min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th
                      scope="col"
                      className="bg-card sticky left-0 z-20 border-b border-r border-border px-2 py-2.5 font-medium text-foreground shadow-[2px_0_0_0_hsl(var(--border))]"
                    >
                      Strength / Width
                    </th>
                    {data.widths.map((w) => (
                      <th
                        key={w.id}
                        scope="col"
                        className="border-b border-border px-2 py-2.5 text-center font-medium whitespace-nowrap text-foreground"
                      >
                        {w.value.toLocaleString()}
                        <span className="text-muted-foreground ml-0.5 font-normal">
                          cm
                        </span>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="bg-muted/60 border-b border-l border-border px-2 py-2.5 text-right font-medium whitespace-nowrap text-muted-foreground"
                    >
                      Row Σ (m)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.strengths.map((s, si) => (
                    <tr key={s.id} className="border-b border-border last:border-b-0">
                      <th
                        scope="row"
                        className="bg-muted/30 sticky left-0 z-10 border-r border-border px-2 py-2 font-medium whitespace-nowrap text-foreground shadow-[2px_0_0_0_hsl(var(--border))]"
                      >
                        {s.name}
                      </th>
                      {data.widths.map((w, wi) => {
                        const m = metersAt(data.totalLengthMByWidthRow, wi, si)
                        const rolls =
                          data.fabricCountByWidthRow[wi]?.[si] ?? 0
                        const title = `${s.name} · ${w.value} cm — ${formatMetersFull(m)} m (${rolls} roll${rolls === 1 ? "" : "s"})`
                        return (
                          <td
                            key={`${w.id}-${s.id}`}
                            title={title}
                            className={cn(
                              "border-border px-1.5 py-1.5 text-center align-middle transition-colors",
                              m <= 0 && "border border-dashed border-muted-foreground/25"
                            )}
                            style={heatStyle(m, minPos, maxPos)}
                          >
                            <span
                              className={cn(
                                "inline-block min-w-9 font-mono font-medium tabular-nums",
                                cellTextClass(m, minPos, maxPos)
                              )}
                            >
                              {formatMeters(m)}
                            </span>
                          </td>
                        )
                      })}
                      <td className="bg-muted/40 border-l border-border px-2 py-2 text-right font-mono text-muted-foreground tabular-nums">
                        {formatMetersFull(rowTotals[si] ?? 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-medium">
                    <th
                      scope="row"
                      className="bg-muted/60 sticky left-0 z-10 border-r border-t border-border px-2 py-2 text-left text-muted-foreground shadow-[2px_0_0_0_hsl(var(--border))]"
                    >
                      Column Σ (m)
                    </th>
                    {data.widths.map((w, wi) => (
                      <td
                        key={`total-${w.id}`}
                        className="border-t border-border px-2 py-2 text-center font-mono text-muted-foreground tabular-nums"
                      >
                        {formatMetersFull(colTotals[wi] ?? 0)}
                      </td>
                    ))}
                    <td className="bg-muted/70 border-l border-t border-border px-2 py-2 text-right font-mono text-foreground tabular-nums">
                      {formatMetersFull(data.stats.grandTotalLengthM)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-muted-foreground flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-10 rounded-sm border border-border"
                    style={{
                      background:
                        "linear-gradient(to right, color-mix(in oklch, hsl(var(--chart-2)) 12%, hsl(var(--card))), color-mix(in oklch, hsl(var(--chart-2)) 100%, hsl(var(--card))))",
                    }}
                  />
                  Low → high stock (within matrix)
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="border-muted-foreground/30 h-3 w-10 rounded-sm border border-dashed"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, hsl(var(--muted)) 0px, hsl(var(--muted)) 4px, hsl(var(--background)) 4px, hsl(var(--background)) 8px)",
                    }}
                  />
                  Gap (0 m)
                </span>
              </div>
              <p className="max-w-md text-[11px] leading-snug">
                Compare row and column totals to see strengths or widths that are
                over- or under-represented. Hover a cell for exact meters and roll count.
              </p>
            </div>
          </div>
        )}
        {!isLoading && !error && data && (strengthCount === 0 || widthCount === 0) && (
          <p className="text-muted-foreground text-sm">
            Add at least one fabric width and one strength in settings to build this
            matrix.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
