"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { OpenInUseAgingItem } from "@/lib/fabricAnalytics"
import { cn } from "@/lib/utils"

type ApiData = {
  asOf: string
  items: OpenInUseAgingItem[]
}

type ChartRow = OpenInUseAgingItem

const chartConfig = {
  agingDays: {
    label: "Days since last activity",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const AGING_TIERS = [
  { id: "fresh", label: "0–6 d", color: "var(--chart-2)" },
  { id: "recent", label: "7–20 d", color: "var(--chart-4)" },
  { id: "stale", label: "21–44 d", color: "var(--chart-5)" },
  { id: "stuck", label: "45+ d", color: "var(--destructive)" },
] as const

function barFillForAging(days: number): string {
  if (days >= 45) return AGING_TIERS[3].color
  if (days >= 21) return AGING_TIERS[2].color
  if (days >= 7) return AGING_TIERS[1].color
  return AGING_TIERS[0].color
}

function tierLabelForAging(days: number): string {
  if (days >= 45) return "Very stale — 45+ days without activity"
  if (days >= 21) return "Stale — three weeks or more"
  if (days >= 7) return "Worth watching — over a week"
  return "Recently active — within a week"
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

async function fetchAging(): Promise<ApiData> {
  const res = await fetch("/api/fabrics/analytics/open-in-use-aging")
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: ApiData
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(getErrorMessage(res, json, "Failed to load aging data"))
  }
  return json.data
}

export function OpenInUseAgingChart() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["fabric-analytics", "open-in-use-aging"],
    queryFn: fetchAging,
  })

  const items = data?.items
  const chartRows = React.useMemo((): ChartRow[] => items ?? [], [items])

  const maxDays = React.useMemo(() => {
    if (!chartRows.length) return 30
    return Math.max(7, ...chartRows.map((r) => r.agingDays))
  }, [chartRows])

  const chartHeight = React.useMemo(() => {
    const n = chartRows.length
    return Math.min(2200, Math.max(300, 56 + n * 34))
  }, [chartRows.length])

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Open / in-use aging</CardTitle>
            <CardDescription>
              Calendar days since the last history event (assignment or balance update —
              status changes are recorded there). Only rolls with status{" "}
              <span className="text-foreground font-medium">OPEN</span> or{" "}
              <span className="text-foreground font-medium">IN_USE</span>. Longer bars
              mean slower movement or forgotten rolls.
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
            As of{" "}
            <span className="text-foreground font-medium tabular-nums">
              {new Date(data.asOf).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            . If a roll has no history yet, last activity falls back to{" "}
            <span className="text-foreground font-medium">updated at</span>.
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="flex min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="size-5" />
            Loading aging…
          </div>
        )}
        {error && (
          <div className="text-destructive bg-destructive/5 rounded-lg border border-destructive/20 px-4 py-3 text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}
        {!isLoading && !error && data && chartRows.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No rolls are currently OPEN or IN_USE — nothing to show.
          </p>
        )}
        {!isLoading && !error && chartRows.length > 0 && (
          <div className="space-y-4">
            <div className="bg-muted/20 max-w-full overflow-x-auto rounded-xl border border-border/60 p-2 pb-3 shadow-inner">
              <ChartContainer
                config={chartConfig}
                className={cn(
                  "aspect-auto min-h-[320px] justify-start [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent/25"
                )}
                style={{
                  width: Math.max(520, Math.min(1600, 120 + maxDays * 14)),
                  minWidth: "100%",
                  height: chartHeight,
                }}
              >
                <BarChart
                  accessibilityLayer
                  data={chartRows}
                  layout="vertical"
                  margin={{ left: 8, right: 20, top: 12, bottom: 12 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, Math.ceil(maxDays * 1.08)]}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    tick={{ className: "fill-muted-foreground text-[11px]" }}
                    label={{
                      value: "Days since last activity",
                      position: "insideBottom",
                      offset: -2,
                      className: "fill-muted-foreground text-[11px]",
                    }}
                  />
                  <YAxis
                    dataKey="fabricCode"
                    type="category"
                    width={128}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    reversed
                    tick={{ fontSize: 10, className: "fill-muted-foreground" }}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklch, var(--accent) 18%, transparent)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null
                      const row = payload[0].payload as ChartRow
                      return (
                        <div className="bg-popover text-popover-foreground ring-border/60 grid min-w-56 gap-2 rounded-xl border px-3 py-2.5 text-xs shadow-lg ring-1">
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-0.5 size-2 shrink-0 rounded-full shadow-inner"
                              style={{ background: barFillForAging(row.agingDays) }}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground font-mono text-[13px] font-semibold leading-tight">
                                {row.fabricCode}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-[11px]">
                                {tierLabelForAging(row.agingDays)}
                              </p>
                            </div>
                          </div>
                          <div className="border-border/60 grid gap-1 border-t pt-2 text-[11px]">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Status</span>
                              <span className="text-foreground font-medium">{row.status}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Aging</span>
                              <span className="text-foreground font-mono tabular-nums">
                                {row.agingDays} d
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Last activity</span>
                              <span className="text-foreground max-w-[12rem] text-right font-mono text-[10px] leading-tight">
                                {new Date(row.lastActivityAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                            {!row.usedHistory && (
                              <p className="text-muted-foreground pt-1 text-[10px] italic">
                                No history rows — using roll &quot;updated at&quot; as last
                                activity.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="agingDays"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={26}
                    fill="transparent"
                    activeBar={{
                      fill: "color-mix(in oklch, var(--primary) 22%, transparent)",
                      stroke: "var(--ring)",
                      strokeWidth: 1,
                    }}
                  >
                    {chartRows.map((row) => (
                      <Cell key={row.fabricId} fill={barFillForAging(row.agingDays)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            <div className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {AGING_TIERS.map((tier) => (
                <span
                  key={tier.id}
                  className="bg-card border-border/70 inline-flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1 shadow-sm"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-sm shadow-inner"
                    style={{ background: tier.color }}
                  />
                  <span className="text-foreground">{tier.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
