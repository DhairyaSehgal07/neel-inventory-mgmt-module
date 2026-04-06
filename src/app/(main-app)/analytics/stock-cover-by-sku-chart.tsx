"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  Brush,
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
import type { StockCoverBySkuItem } from "@/lib/fabricAnalytics"
import { cn } from "@/lib/utils"

type ApiData = {
  monthsWindow: number
  consumptionSince: string
  items: StockCoverBySkuItem[]
}

type ChartRow = StockCoverBySkuItem & {
  barMonths: number
  label: string
}

const CHART_CAP_MONTHS = 36

/** Recharts brush: tall enough for handles + panorama; extra margin below plot reserved in BarChart. */
const BRUSH_HEIGHT = 68
const BRUSH_TRAVELLER_WIDTH = 12

/** Theme tokens are oklch — use `var(--token)` directly, not `hsl(var(--token))`. */
type CoverTier = {
  id: string
  /** Legend / axis hint */
  label: string
  /** Tooltip line */
  detail: string
  color: string
  match: (months: number | null) => boolean
}

/** Finer bands — more of the shadcn chart + semantic palette. First match wins. */
const COVER_TIERS: CoverTier[] = [
  {
    id: "infinity",
    label: "No usage (∞)",
    detail: "No consumption in window — treat as infinite cover",
    color: "var(--chart-1)",
    match: (m) => m === null,
  },
  {
    id: "zero",
    label: "0 cover",
    detail: "No remaining cover",
    color: "var(--muted-foreground)",
    match: (m) => m !== null && m <= 0,
  },
  {
    id: "critical",
    label: "< 1 mo.",
    detail: "Critical — under one month of cover",
    color: "var(--destructive)",
    match: (m) => m !== null && m > 0 && m < 1,
  },
  {
    id: "low",
    label: "1–3 mo.",
    detail: "Low — one to three months of cover",
    color: "var(--chart-5)",
    match: (m) => m !== null && m >= 1 && m < 3,
  },
  {
    id: "moderate",
    label: "3–6 mo.",
    detail: "Moderate — three to six months",
    color: "var(--chart-4)",
    match: (m) => m !== null && m >= 3 && m < 6,
  },
  {
    id: "good",
    label: "6–12 mo.",
    detail: "Comfortable — six to twelve months",
    color: "var(--chart-2)",
    match: (m) => m !== null && m >= 6 && m < 12,
  },
  {
    id: "strong",
    label: "12–24 mo.",
    detail: "Strong — twelve to twenty-four months",
    color: "var(--chart-3)",
    match: (m) => m !== null && m >= 12 && m < 24,
  },
  {
    id: "ample",
    label: "24+ mo.",
    detail: "Ample — two years or more of cover",
    color: "var(--primary)",
    match: (m) => m !== null && m >= 24,
  },
]

function tierForCover(months: number | null): CoverTier {
  const found = COVER_TIERS.find((t) => t.match(months))
  return found ?? COVER_TIERS[COVER_TIERS.length - 1]!
}

const chartConfig = {
  barMonths: {
    label: "Months of cover",
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

async function fetchStockCover(months: number): Promise<ApiData> {
  const res = await fetch(
    `/api/fabrics/analytics/stock-cover-by-sku?months=${months}`
  )
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: ApiData
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(getErrorMessage(res, json, "Failed to load stock cover"))
  }
  return json.data
}

function formatCoverLabel(m: number | null): string {
  if (m === null) return "∞"
  if (m === 0) return "0"
  if (m >= 100) return `${m.toFixed(0)}`
  if (m >= 10) return `${m.toFixed(1)}`
  return `${m.toFixed(2)}`
}

function riskBandLabel(item: StockCoverBySkuItem): string {
  return tierForCover(item.stockCoverMonths).detail
}

function shortenSku(value: unknown, max = 14): string {
  const s = typeof value === "string" ? value : String(value)
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** Bar length for chart (0…CHART_CAP_MONTHS); infinite cover uses the cap for display. */
function barMonthsForChart(stockCoverMonths: number | null): number {
  if (stockCoverMonths === null) return CHART_CAP_MONTHS
  return Math.min(stockCoverMonths, CHART_CAP_MONTHS)
}

function barFill(item: StockCoverBySkuItem): string {
  return tierForCover(item.stockCoverMonths).color
}

export function StockCoverBySkuChart() {
  const [monthsWindow, setMonthsWindow] = React.useState(6)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["fabric-analytics", "stock-cover-by-sku", monthsWindow],
    queryFn: () => fetchStockCover(monthsWindow),
  })

  const items = data?.items
  const chartRows = React.useMemo((): ChartRow[] => {
    if (!items?.length) return []
    return items.map((item) => ({
      ...item,
      barMonths: barMonthsForChart(item.stockCoverMonths),
      label: item.fabricCode,
    }))
  }, [items])

  /** Min width so vertical bars do not crush when there are many SKUs. */
  const chartInnerWidth = React.useMemo(() => {
    const n = chartRows.length
    return Math.max(480, Math.min(4800, 80 + n * 44))
  }, [chartRows.length])

  const showXAxisLabels = chartRows.length <= 24
  const brushTickStep = Math.max(1, Math.ceil(chartRows.length / 16))
  const chartBottomMargin = showXAxisLabels ? 118 : 56
  /** Space for X-axis labels + gap + brush body + padding (brush sits in bottom margin). */
  const barChartMarginBottom =
    chartBottomMargin + 28 + BRUSH_HEIGHT + 28

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Stock cover by SKU</CardTitle>
            <CardDescription>
              Current balance (m) divided by average monthly consumption from balance
              updates in history. Short bars are closer to stockout risk; tall bars or
              &quot;∞&quot; indicate excess or no recent usage in the window. Use the
              brush under the chart to zoom and pan along SKUs.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-muted-foreground flex items-center gap-2 text-sm">
              <span className="whitespace-nowrap">Usage window</span>
              <select
                value={monthsWindow}
                onChange={(e) => setMonthsWindow(Number(e.target.value))}
                className="border-input bg-background text-foreground rounded-md border px-2 py-1.5 text-sm shadow-sm"
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {data && (
          <p className="text-muted-foreground text-sm">
            Consumption summed since{" "}
            <span className="text-foreground font-medium tabular-nums">
              {new Date(data.consumptionSince).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </span>
            . Bars are capped at {CHART_CAP_MONTHS} mo. for scale; tooltips show exact
            cover.
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && (
          <div className="flex min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="size-5" />
            Loading stock cover…
          </div>
        )}
        {error && (
          <div className="text-destructive bg-destructive/5 rounded-lg border border-destructive/20 px-4 py-3 text-sm">
            {error instanceof Error ? error.message : "Failed to load data"}
          </div>
        )}
        {!isLoading && !error && data && chartRows.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No live fabric rolls with positive balance — nothing to show yet.
          </p>
        )}
        {!isLoading && !error && chartRows.length > 0 && (
          <div className="space-y-4">
            {!showXAxisLabels && (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Too many SKUs to label the axis — hover a bar for the code, or use the
                zoom strip below the plot.
              </p>
            )}
            <div className="border-primary/20 bg-primary/5 text-foreground mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed px-3 py-2 text-xs">
              <span className="text-primary font-semibold">SKU zoom strip</span>
              <span className="text-muted-foreground">
                Drag the two handles to narrow or widen; drag the shaded band to move the
                window along the full SKU list.
              </span>
            </div>
            <div className="bg-muted/20 max-w-full overflow-x-auto rounded-xl border border-border/60 p-2 pb-3 shadow-inner">
              <ChartContainer
                config={chartConfig}
                className={cn(
                  "aspect-auto h-[min(520px,78vh)] min-h-[400px] justify-start",
                  "[&_.recharts-cartesian-grid_line]:stroke-border/60",
                  "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent/25",
                  // Brush: stronger track + handles (SVG uses theme tokens)
                  "[&_.recharts-brush]:outline-none",
                  "[&_.recharts-brush>rect:first-of-type]:rx-[6px]",
                  "[&_.recharts-brush-slide]:fill-[var(--primary)]",
                  "[&_.recharts-brush-slide]:fill-opacity-[0.38]",
                  "[&_.recharts-brush-traveller]:fill-[var(--primary)]",
                  "[&_.recharts-brush-traveller]:stroke-[var(--primary-foreground)]",
                  "[&_.recharts-brush-traveller]:stroke-[0.75px]",
                  "[&_.recharts-brush-texts_.recharts-text]:fill-[var(--primary)]",
                  "[&_.recharts-brush-texts_.recharts-text]:text-[11px]",
                  "[&_.recharts-brush-texts_.recharts-text]:font-medium"
                )}
                style={{ width: chartInnerWidth, minWidth: "100%" }}
              >
                <BarChart
                  accessibilityLayer
                  data={chartRows}
                  margin={{
                    left: 24,
                    right: 14,
                    top: 14,
                    bottom: barChartMarginBottom,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="fabricCode"
                    type="category"
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    interval={showXAxisLabels ? 0 : "preserveStartEnd"}
                    tickMargin={8}
                    tick={
                      showXAxisLabels
                        ? {
                            fontSize: 10,
                            className: "fill-muted-foreground",
                          }
                        : false
                    }
                    angle={showXAxisLabels ? -48 : 0}
                    textAnchor={showXAxisLabels ? "end" : "middle"}
                    height={showXAxisLabels ? 72 : 12}
                    tickFormatter={(value) => shortenSku(value, 16)}
                  />
                  <YAxis
                    type="number"
                    domain={[0, CHART_CAP_MONTHS]}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    tickFormatter={(v) => `${v}`}
                    width={40}
                    tick={{ className: "fill-muted-foreground text-[11px]" }}
                    label={{
                      value: `Months of cover (cap ${CHART_CAP_MONTHS})`,
                      angle: -90,
                      position: "insideLeft",
                      offset: 2,
                      className: "fill-muted-foreground text-[11px]",
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklch, var(--accent) 18%, transparent)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null
                      const row = payload[0].payload as ChartRow
                      return (
                        <div className="bg-popover text-popover-foreground ring-border/60 grid min-w-52 gap-2 rounded-xl border px-3 py-2.5 text-xs shadow-lg ring-1">
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-0.5 size-2 shrink-0 rounded-full shadow-inner"
                              style={{ background: barFill(row) }}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground font-mono text-[13px] font-semibold leading-tight tracking-tight">
                                {row.fabricCode}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-[11px]">
                                {riskBandLabel(row)}
                              </p>
                            </div>
                          </div>
                          <div className="border-border/60 grid gap-1 border-t pt-2 text-[11px]">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Cover</span>
                              <span className="text-foreground font-mono tabular-nums">
                                {formatCoverLabel(row.stockCoverMonths)} mo.
                                {row.stockCoverMonths !== null &&
                                  row.stockCoverMonths > CHART_CAP_MONTHS && (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      (actual &gt; {CHART_CAP_MONTHS})
                                    </span>
                                  )}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Balance</span>
                              <span className="text-foreground font-mono tabular-nums">
                                {row.currentBalanceM.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}{" "}
                                m
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Avg. monthly use</span>
                              <span className="text-foreground font-mono tabular-nums">
                                {row.averageMonthlyConsumptionM.toLocaleString(undefined, {
                                  maximumFractionDigits: 3,
                                })}{" "}
                                m
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="barMonths"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={44}
                    fill="transparent"
                    activeBar={{
                      fill: "color-mix(in oklch, var(--primary) 22%, transparent)",
                      stroke: "var(--ring)",
                      strokeWidth: 1,
                    }}
                  >
                    {chartRows.map((row) => (
                      <Cell key={row.fabricId} fill={barFill(row)} />
                    ))}
                  </Bar>
                  <Brush
                    dataKey="fabricCode"
                    height={BRUSH_HEIGHT}
                    stroke="var(--primary)"
                    fill="var(--muted)"
                    travellerWidth={BRUSH_TRAVELLER_WIDTH}
                    tickFormatter={(value, index) => {
                      if (index % brushTickStep !== 0) return ""
                      return shortenSku(value, 10)
                    }}
                    alwaysShowText
                    ariaLabel="Zoom and pan along fabric SKUs"
                  />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {COVER_TIERS.map((tier) => (
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
