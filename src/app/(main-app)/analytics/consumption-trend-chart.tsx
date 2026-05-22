"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type {
  ConsumptionTrendBucket,
  ConsumptionTrendGranularity,
  ConsumptionTrendSplit,
} from "@/lib/fabricAnalytics"
import { ANALYTICS_CHART_CSS_VARS, analyticsChartCssVar } from "@/lib/analyticsChartColors"
import { cn } from "@/lib/utils"

import { useFabricAnalyticsFilters } from "./fabrics/fabric-analytics-filters-context"

type ApiData = {
  granularity: ConsumptionTrendGranularity
  split: ConsumptionTrendSplit
  from: string
  to: string
  buckets: ConsumptionTrendBucket[]
}

const chartConfig = {
  totalM: {
    label: "Consumption (m)",
    color: analyticsChartCssVar(0),
  },
} satisfies ChartConfig

const STACK_COLORS = [...ANALYTICS_CHART_CSS_VARS]

function sanitizeDataKey(segmentKey: string): string {
  return `seg_${segmentKey.replace(/[^a-zA-Z0-9]/g, "_")}`
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

async function fetchTrend(url: string): Promise<ApiData> {
  const res = await fetch(url)
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: ApiData
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(getErrorMessage(res, json, "Failed to load consumption trend"))
  }
  return json.data
}

function buildTrendUrl(
  appendSharedQueryParams: (sp: URLSearchParams) => void,
  granularity: string,
  split: string
): string {
  const sp = new URLSearchParams()
  appendSharedQueryParams(sp)
  sp.set("granularity", granularity)
  sp.set("split", split)
  return `/api/fabrics/analytics/consumption-trend?${sp.toString()}`
}

function buildStackRows(buckets: ConsumptionTrendBucket[]) {
  const keys = new Set<string>()
  const labels = new Map<string, string>()
  for (const b of buckets) {
    for (const s of b.segments ?? []) {
      keys.add(s.segmentKey)
      labels.set(s.segmentKey, s.label)
    }
  }
  const ordered = [...keys].sort((a, b) => a.localeCompare(b))
  const rows = buckets.map((b) => {
    const row: Record<string, number | string> = {
      periodLabel: b.periodLabel,
    }
    for (const k of ordered) {
      const sk = sanitizeDataKey(k)
      row[sk] = b.segments?.find((s) => s.segmentKey === k)?.consumptionM ?? 0
    }
    return row
  })
  return { orderedKeys: ordered, labels, rows }
}

export function ConsumptionTrendChart() {
  const {
    granularity,
    from,
    to,
    appendSharedQueryParams,
    refreshNonce,
  } = useFabricAnalyticsFilters()
  /** Default to width so line + stacked bar both appear without an extra click. */
  const [split, setSplit] = React.useState<ConsumptionTrendSplit>("width")

  const queryUrl = React.useMemo(
    () => buildTrendUrl(appendSharedQueryParams, granularity, split),
    [appendSharedQueryParams, granularity, split]
  )

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [
      "fabric-analytics",
      "consumption-trend",
      queryUrl,
      refreshNonce,
    ],
    queryFn: () => fetchTrend(queryUrl),
  })

  const buckets = data?.buckets
  const splitMode = data?.split

  const lineData = React.useMemo(() => {
    if (!buckets?.length) return []
    return buckets.map((b) => ({
      periodLabel: b.periodLabel,
      totalM: b.totalM,
    }))
  }, [buckets])

  const stack = React.useMemo(() => {
    if (!buckets?.length || splitMode === "none") {
      return {
        orderedKeys: [] as string[],
        labels: new Map<string, string>(),
        rows: [] as Record<string, number | string>[],
      }
    }
    return buildStackRows(buckets)
  }, [buckets, splitMode])

  const rangeLabel = data
    ? `${new Date(data.from).toLocaleDateString(undefined, { dateStyle: "medium" })} — ${new Date(data.to).toLocaleDateString(undefined, { dateStyle: "medium" })}`
    : ""

  const rangeHint =
    from || to
      ? "Range follows From / To in the filters above."
      : "No From / To set — using the last six months through today (see range below)."

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Consumption trend analysis</CardTitle>
            <CardDescription>
              Meters consumed from balance updates where length decreases (
              <span className="text-foreground font-medium">old − new</span> per event).
              Timeline bucket is set in <span className="text-foreground font-medium">Filters</span>{" "}
              above. The <span className="text-foreground font-medium">line chart</span> shows
              total usage over time; the{" "}
              <span className="text-foreground font-medium">stacked bar chart</span> shows
              how that usage splits by width, strength, or assigned machine / section in
              each time bucket (demand drivers). {rangeHint}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="whitespace-nowrap">Split</span>
              <select
                value={split}
                onChange={(e) => setSplit(e.target.value as ConsumptionTrendSplit)}
                className="border-input bg-background text-foreground rounded-md border px-2 py-1.5 text-sm"
              >
                <option value="none">None — line chart only</option>
                <option value="width">Width (stacked bars)</option>
                <option value="strength">Strength (stacked bars)</option>
                <option value="assign">Machine / section (stacked bars)</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {data && (
          <p className="text-muted-foreground text-sm">
            Range: <span className="text-foreground font-medium">{rangeLabel}</span>
            {split !== "none" && (
              <span className="text-muted-foreground">
                {" "}
                — split uses current roll attributes; long tails are grouped into{" "}
                <span className="text-foreground font-medium">Other</span>.
              </span>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {isLoading && (
          <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="size-5" />
            Loading consumption trend…
          </div>
        )}
        {error && (
          <div className="text-destructive bg-destructive/5 rounded-lg border border-destructive/20 px-4 py-3 text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}
        {!isLoading && !error && data && lineData.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No balance-decreasing events in this range — nothing to chart.
          </p>
        )}
        {!isLoading && !error && lineData.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="text-foreground text-sm font-medium">
                Time trend — total consumption (line)
              </h3>
              <div className="bg-muted/15 rounded-xl border border-border/60 p-2">
                <ChartContainer
                  config={chartConfig}
                  className={cn(
                    "aspect-auto h-[300px] w-full justify-start [&_.recharts-cartesian-grid_line]:stroke-border/60"
                  )}
                >
                  <LineChart
                    accessibilityLayer
                    data={lineData}
                    margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="periodLabel"
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ className: "fill-muted-foreground text-[11px]" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      tick={{ className: "fill-muted-foreground text-[11px]" }}
                      width={48}
                      tickFormatter={(v) =>
                        typeof v === "number" ? v.toLocaleString() : String(v)
                      }
                      label={{
                        value: "Meters",
                        angle: -90,
                        position: "insideLeft",
                        className: "fill-muted-foreground text-[11px]",
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(l) => String(l)}
                          formatter={(value) => [
                            typeof value === "number"
                              ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} m`
                              : String(value),
                            "Consumed",
                          ]}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="totalM"
                      stroke={analyticsChartCssVar(0)}
                      strokeWidth={2}
                      dot={{ r: 3, fill: analyticsChartCssVar(0) }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>

            {split !== "none" && stack.rows.length > 0 && stack.orderedKeys.length > 0 && (
              <div className="space-y-2">
                <div>
                  <h3 className="text-foreground text-sm font-medium">
                    Stacked bar — consumption by{" "}
                    {split === "width"
                      ? "width"
                      : split === "strength"
                        ? "strength"
                        : "assigned machine / section"}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Each column is a time bucket; stack segments are meters consumed for
                    that bucket. Compare segment heights across periods to spot demand
                    shifts.
                  </p>
                </div>
                <div className="bg-muted/15 rounded-xl border border-border/60 p-2">
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[min(420px,50vh)] min-h-[320px] w-full justify-start [&_.recharts-cartesian-grid_line]:stroke-border/60"
                  >
                    <BarChart
                      accessibilityLayer
                      data={stack.rows}
                      margin={{ left: 8, right: 8, top: 8, bottom: 48 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="periodLabel"
                        tickLine={false}
                        axisLine={{ stroke: "var(--border)" }}
                        tick={{ className: "fill-muted-foreground text-[10px]" }}
                        interval="preserveStartEnd"
                        height={48}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={{ stroke: "var(--border)" }}
                        tick={{ className: "fill-muted-foreground text-[11px]" }}
                        width={44}
                        tickFormatter={(v) =>
                          typeof v === "number" ? v.toLocaleString() : String(v)
                        }
                      />
                      <Tooltip
                        cursor={{ fill: "color-mix(in oklch, var(--accent) 15%, transparent)" }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-popover text-popover-foreground ring-border/60 grid min-w-48 gap-1.5 rounded-lg border px-2.5 py-2 text-xs shadow-lg ring-1">
                              <p className="text-foreground font-medium">{label}</p>
                              <div className="max-h-48 space-y-1 overflow-y-auto">
                                {payload
                                  .filter((p) => Number(p.value) > 0)
                                  .sort(
                                    (a, b) =>
                                      Number(b.value) - Number(a.value)
                                  )
                                  .map((p) => (
                                    <div
                                      key={String(p.dataKey)}
                                      className="flex justify-between gap-4"
                                    >
                                      <span
                                        className="text-muted-foreground truncate"
                                        style={{ color: p.color }}
                                      >
                                        {p.name}
                                      </span>
                                      <span className="text-foreground font-mono tabular-nums">
                                        {Number(p.value).toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        m
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => {
                          const orig = stack.orderedKeys.find(
                            (k) => sanitizeDataKey(k) === String(value)
                          )
                          return orig
                            ? (stack.labels.get(orig) ?? orig)
                            : value
                        }}
                      />
                      {stack.orderedKeys.map((key, i) => (
                        <Bar
                          key={key}
                          dataKey={sanitizeDataKey(key)}
                          name={stack.labels.get(key) ?? key}
                          stackId="consumption"
                          fill={STACK_COLORS[i % STACK_COLORS.length]!}
                          radius={[0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            )}

            {split === "none" && lineData.length > 0 && (
              <div className="border-border/80 bg-muted/20 text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
                <p className="text-foreground font-medium">Stacked bar chart</p>
                <p className="mt-1">
                  Choose <span className="text-foreground font-medium">Width</span>,{" "}
                  <span className="text-foreground font-medium">Strength</span>, or{" "}
                  <span className="text-foreground font-medium">
                    Assigned machine / section
                  </span>{" "}
                  in <span className="text-foreground font-medium">Split</span> above to
                  see meters consumed per period broken down as stacked bars (demand
                  drivers).
                </p>
              </div>
            )}

            {split !== "none" &&
              lineData.length > 0 &&
              (stack.rows.length === 0 || stack.orderedKeys.length === 0) && (
                <div className="border-border/60 bg-muted/15 text-muted-foreground rounded-xl border px-4 py-4 text-sm">
                  No segment breakdown for this range — try a wider date range or another
                  split.
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
