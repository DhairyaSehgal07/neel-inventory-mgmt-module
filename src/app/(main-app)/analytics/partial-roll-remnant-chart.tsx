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

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PartialRollDrilldownItem, PartialRollRemnantBucket } from "@/lib/fabricAnalytics"
import { analyticsChartCssVar } from "@/lib/analyticsChartColors"
import { cn } from "@/lib/utils"

import { useFabricAnalyticsFilters } from "./fabrics/fabric-analytics-filters-context"

type ApiData = {
  openRollCount: number
  totalOpenRemainingM: number
  partialRollCount: number
  totalPartialRemainingM: number
  /** Deprecated alias from older responses. */
  totalRemainingM?: number
  buckets: PartialRollRemnantBucket[]
}

const chartConfig = {
  rollCount: {
    label: "Rolls",
    color: analyticsChartCssVar(0),
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

async function fetchRemnant(url: string): Promise<ApiData> {
  const res = await fetch(url)
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

function buildRemnantUrl(
  appendSharedQueryParams: (sp: URLSearchParams) => void,
  bucket?: string | null
) {
  const sp = new URLSearchParams()
  appendSharedQueryParams(sp)
  if (bucket) sp.set("bucket", bucket)
  const q = sp.toString()
  return `/api/fabrics/analytics/partial-roll-remnant${q ? `?${q}` : ""}`
}

async function fetchDrilldown(url: string): Promise<{ rolls: PartialRollDrilldownItem[] }> {
  const res = await fetch(url)
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    message?: string
    data?: { rolls: PartialRollDrilldownItem[] }
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(getErrorMessage(res, json, "Failed to load bucket details"))
  }
  return json.data
}

export function PartialRollRemnantChart() {
  const { appendSharedQueryParams, refreshNonce } = useFabricAnalyticsFilters()
  const [selectedBucketId, setSelectedBucketId] = React.useState<
    PartialRollRemnantBucket["id"] | null
  >(null)

  const summaryUrl = React.useMemo(
    () => buildRemnantUrl(appendSharedQueryParams),
    [appendSharedQueryParams]
  )

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["fabric-analytics", "partial-roll-remnant", summaryUrl, refreshNonce],
    queryFn: () => fetchRemnant(summaryUrl),
  })

  const drilldownUrl = React.useMemo(
    () =>
      selectedBucketId
        ? buildRemnantUrl(appendSharedQueryParams, selectedBucketId)
        : null,
    [appendSharedQueryParams, selectedBucketId]
  )

  const drilldownQuery = useQuery({
    queryKey: [
      "fabric-analytics",
      "partial-roll-remnant-drilldown",
      drilldownUrl,
      refreshNonce,
    ],
    queryFn: () => fetchDrilldown(drilldownUrl!),
    enabled: Boolean(drilldownUrl),
  })

  React.useEffect(() => {
    setSelectedBucketId(null)
  }, [summaryUrl])

  const buckets = data?.buckets
  const barData = React.useMemo(() => {
    if (!buckets?.length) return []
    return buckets.map((b) => ({
      bucketId: b.id,
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
              OPEN balance matches the Fabrics dashboard OPEN tab. The histogram focuses on
              OPEN rolls with some length left but less than the original put-up length.{" "}
              <span className="text-foreground font-medium">Click a bar</span> to list fabric
              code, width, strength, and location for that remaining-length bucket.
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-muted/30 rounded-xl border border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Open rolls
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                  {data.openRollCount.toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">Count of OPEN rows</p>
              </div>
              <div className="bg-muted/30 rounded-xl border border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Total OPEN remaining
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                  {data.totalOpenRemainingM.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  <span className="text-lg font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Sum of current balance on OPEN rows
                </p>
              </div>
              <div className="bg-muted/30 rounded-xl border border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Partial-roll remaining
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                  {data.totalPartialRemainingM.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  <span className="text-lg font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  OPEN rolls below original length
                </p>
              </div>
            </div>

            {data.partialRollCount === 0 ? (
              <p className="text-muted-foreground text-sm">
                No OPEN partial rolls right now — every OPEN roll matches its original length.
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
                            bucketId: string
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
                              <span className="text-muted-foreground text-[10px]">
                                Click the bar for a detailed list
                              </span>
                            </div>
                          )
                        }}
                      />
                      <Bar
                        dataKey="rollCount"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={72}
                        cursor="pointer"
                        onClick={(_entry, index) => {
                          const b = buckets?.[index]
                          if (b?.id) {
                            setSelectedBucketId((prev) =>
                              prev === b.id ? null : (b.id as PartialRollRemnantBucket["id"])
                            )
                          }
                        }}
                      >
                        {barData.map((row, index) => {
                          const id = buckets?.[index]?.id
                          const active = id != null && selectedBucketId === id
                          return (
                            <Cell
                              key={row.bucketId}
                              fill={
                                active
                                  ? "hsl(var(--primary))"
                                  : analyticsChartCssVar(index)
                              }
                            />
                          )
                        })}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Bucket = current balance (m) on the roll. Prioritize using rolls in lower
                  buckets before opening new full rolls.
                </p>

                {selectedBucketId && (
                  <div className="space-y-3 border-border/60 border-t pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-foreground text-sm font-medium">
                        Rolls in bucket{" "}
                        <span className="text-muted-foreground font-normal">
                          ({buckets?.find((b) => b.id === selectedBucketId)?.label ?? selectedBucketId})
                        </span>
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBucketId(null)}
                      >
                        Clear selection
                      </Button>
                    </div>
                    {drilldownQuery.isLoading && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Spinner className="size-4" />
                        Loading rolls…
                      </div>
                    )}
                    {drilldownQuery.error && (
                      <div className="text-destructive bg-destructive/5 rounded-lg border border-destructive/20 px-3 py-2 text-sm">
                        {drilldownQuery.error instanceof Error
                          ? drilldownQuery.error.message
                          : "Failed to load rolls"}
                      </div>
                    )}
                    {drilldownQuery.data && !drilldownQuery.isLoading && (
                      <>
                        {drilldownQuery.data.rolls.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No rolls in this bucket.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Fabric code</TableHead>
                                  <TableHead>Width (cm)</TableHead>
                                  <TableHead>Strength</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead className="text-right">Remaining (m)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {drilldownQuery.data.rolls.map((r) => (
                                  <TableRow key={r.fabricId}>
                                    <TableCell className="font-mono text-sm font-medium">
                                      {r.fabricCode}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                      {r.widthValueCm.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell>{r.strengthName}</TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                      {r.locationDisplay}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm tabular-nums">
                                      {r.remainingM.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
