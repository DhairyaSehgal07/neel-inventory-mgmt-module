"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { PartialRollRemnantBucket } from "@/lib/fabricAnalytics"
import { cn } from "@/lib/utils"

type ApiData = {
  partialRollCount: number
  totalRemainingM: number
  buckets: PartialRollRemnantBucket[]
}

const chartConfig = {
  rollCount: {
    label: "Rolls",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

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

async function fetchRemnant(): Promise<ApiData> {
  const res = await fetch("/api/fabrics/analytics/partial-roll-remnant")
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: ApiData
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(getErrorMessage(res, json, "Failed to load remnant analysis"))
  }
  return json.data
}

export function PartialRollRemnantChart() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["fabric-analytics", "partial-roll-remnant"],
    queryFn: fetchRemnant,
  })

  const buckets = data?.buckets
  const barData = React.useMemo(() => {
    if (!buckets?.length) return []
    return buckets.map((b) => ({
      label: b.label,
      rollCount: b.rollCount,
      totalRemainingM: b.totalRemainingM,
    }))
  }, [buckets])

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Partial roll / remnant analysis</CardTitle>
            <CardDescription>
              Rolls with some length left but less than the original put-up length — good
              candidates to use before slitting new stock. Based on current fabric rows
              (latest balance); excludes rejected and traded rolls.
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
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {isLoading && (
          <div className="flex min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="size-5" />
            Loading…
          </div>
        )}
        {error && (
          <div className="text-destructive bg-destructive/5 rounded-lg border border-destructive/20 px-4 py-3 text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}
        {!isLoading && !error && data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-muted/30 rounded-xl border border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Partial rolls
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                  {data.partialRollCount.toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">Count of matching rolls</p>
              </div>
              <div className="bg-muted/30 rounded-xl border border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Total remaining
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                  {data.totalRemainingM.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  <span className="text-lg font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Sum of current balance on those rolls
                </p>
              </div>
            </div>

            {data.partialRollCount === 0 ? (
              <p className="text-muted-foreground text-sm">
                No partial rolls right now — every positive-length roll matches its original
                length, or only full / rejected / traded rolls remain.
              </p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-foreground text-sm font-medium">
                  Rolls by remaining length (histogram)
                </h3>
                <div className="bg-muted/15 rounded-xl border border-border/60 p-2">
                  <ChartContainer
                    config={chartConfig}
                    className={cn(
                      "aspect-auto h-[280px] w-full justify-start [&_.recharts-cartesian-grid_line]:stroke-border/60"
                    )}
                  >
                    <BarChart
                      accessibilityLayer
                      data={barData}
                      margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={{ stroke: "var(--border)" }}
                        tick={{ className: "fill-muted-foreground text-[11px]" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={{ stroke: "var(--border)" }}
                        tick={{ className: "fill-muted-foreground text-[11px]" }}
                        width={40}
                        label={{
                          value: "Roll count",
                          angle: -90,
                          position: "insideLeft",
                          className: "fill-muted-foreground text-[11px]",
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: "color-mix(in oklch, var(--accent) 15%, transparent)" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null
                          const p = payload[0].payload as {
                            label: string
                            rollCount: number
                            totalRemainingM: number
                          }
                          return (
                            <div className="bg-popover text-popover-foreground ring-border/60 grid min-w-44 gap-1 rounded-lg border px-2.5 py-2 text-xs shadow-lg ring-1">
                              <span className="text-foreground font-medium">{p.label}</span>
                              <span className="text-muted-foreground">
                                Rolls:{" "}
                                <span className="text-foreground font-mono tabular-nums">
                                  {p.rollCount}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                Remaining:{" "}
                                <span className="text-foreground font-mono tabular-nums">
                                  {p.totalRemainingM.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  m
                                </span>
                              </span>
                            </div>
                          )
                        }}
                      />
                      <Bar
                        dataKey="rollCount"
                        fill="var(--chart-2)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={72}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Bucket = current balance (m) on the roll. Prioritize using rolls in lower
                  buckets before opening new full rolls.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
