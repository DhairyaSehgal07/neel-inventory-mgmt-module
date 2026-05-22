'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CompoundAnalyticsSummary } from '@/lib/compoundAnalytics';
import {
  formatKgCompact,
  getCompoundChartColor,
} from '@/lib/compoundAnalytics';
import { analyticsChartCssVar } from '@/lib/analyticsChartColors';
import { cn } from '@/lib/utils';

type PanelId = 'production' | 'consumption' | 'comparison';

type SortKey =
  | 'compoundName'
  | 'producedKg'
  | 'inStockKg'
  | 'consumedKg'
  | 'consumptionRatePct'
  | 'batchCount'
  | 'locationsDisplay';

function sanitizeSeriesKey(name: string): string {
  return `s_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function darkenHex(hex: string, factor = 0.72): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const r = Math.round(parseInt(m[1], 16) * factor);
  const g = Math.round(parseInt(m[2], 16) * factor);
  const b = Math.round(parseInt(m[3], 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenHex(hex: string, mix = 0.45): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const r = Math.round(parseInt(m[1], 16) * (1 - mix) + 255 * mix);
  const g = Math.round(parseInt(m[2], 16) * (1 - mix) + 255 * mix);
  const b = Math.round(parseInt(m[3], 16) * (1 - mix) + 255 * mix);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Comparison §5C — rate bar colors. */
function consumptionRateTrackColor(ratePct: number): string {
  if (ratePct <= 30) return '#d97706';
  if (ratePct <= 70) return '#2563eb';
  return '#16a34a';
}

function buildSummaryUrl(params: {
  location: string;
  compound: string;
  from: string;
  to: string;
  granularity: string;
  slowDays: string;
}): string {
  const sp = new URLSearchParams();
  if (params.location && params.location !== 'all') sp.set('location', params.location);
  if (params.compound.trim()) sp.set('compound', params.compound.trim());
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.granularity) sp.set('granularity', params.granularity);
  if (params.slowDays) sp.set('slowDays', params.slowDays);
  const q = sp.toString();
  return `/api/compounds/analytics/summary${q ? `?${q}` : ''}`;
}

async function fetchSummary(url: string): Promise<CompoundAnalyticsSummary> {
  const res = await fetch(url);
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: CompoundAnalyticsSummary;
  };
  if (!res.ok || !json.success || !json.data) {
    if (res.status === 403) throw new Error('You do not have permission to view compound analytics.');
    if (res.status === 401) throw new Error('You must be signed in.');
    throw new Error(json.message ?? 'Failed to load compound analytics');
  }
  return json.data;
}

function timelineToChartRows(
  points: CompoundAnalyticsSummary['productionTimeline'],
  compoundNames: string[]
): Record<string, string | number>[] {
  return points.map((p) => {
    const row: Record<string, string | number> = {
      periodLabel: p.periodLabel,
      totalKg: p.totalKg,
    };
    for (const name of compoundNames) {
      row[sanitizeSeriesKey(name)] = p.byCompoundKg[name] ?? 0;
    }
    return row;
  });
}

export function CompoundAnalyticsDashboard() {
  const [panel, setPanel] = React.useState<PanelId>('production');
  const [location, setLocation] = React.useState('all');
  const [compound, setCompound] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [granularity, setGranularity] = React.useState<'day' | 'week' | 'month'>('month');
  const [slowDays, setSlowDays] = React.useState('30');
  const [sortKey, setSortKey] = React.useState<SortKey>('producedKg');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  const queryUrl = React.useMemo(
    () =>
      buildSummaryUrl({
        location,
        compound,
        from,
        to,
        granularity,
        slowDays,
      }),
    [location, compound, from, to, granularity, slowDays]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['compound-analytics-summary', queryUrl],
    queryFn: () => fetchSummary(queryUrl),
  });

  const compoundNames = React.useMemo(
    () => (data ? data.byCompound.map((c) => c.compoundName) : []),
    [data]
  );

  const lineChartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      totalKg: { label: 'Total (kg)', color: 'var(--muted-foreground)' },
    };
    for (const name of compoundNames) {
      cfg[sanitizeSeriesKey(name)] = {
        label: name,
        color: getCompoundChartColor(name),
      };
    }
    return cfg;
  }, [compoundNames]);

  const productionBarData = React.useMemo(
    () =>
      (data?.byCompound ?? []).map((c) => ({
        name: c.compoundName,
        producedKg: c.producedKg,
        fill: getCompoundChartColor(c.compoundName),
      })),
    [data]
  );

  const comparisonGroupedData = React.useMemo(
    () =>
      (data?.byCompound ?? []).map((c) => ({
        name: c.compoundName,
        produced: c.producedKg,
        consumed: c.consumedKg,
        color: getCompoundChartColor(c.compoundName),
      })),
    [data]
  );

  const stackedConsumptionData = React.useMemo(
    () =>
      (data?.byCompound ?? []).map((c) => ({
        name: c.compoundName,
        consumedKg: c.consumedKg,
        inStockKg: c.inStockKg,
      })),
    [data]
  );

  const rankingData = React.useMemo(() => {
    const rows = [...(data?.byCompound ?? [])].sort((a, b) => b.producedKg - a.producedKg);
    return rows.map((c, i) => ({
      ...c,
      rank: i + 1,
      fill: getCompoundChartColor(c.compoundName),
    }));
  }, [data]);

  const pieShareData = React.useMemo(
    () =>
      (data?.byCompound ?? []).map((c) => ({
        name: c.compoundName,
        value: c.producedKg,
        fill: getCompoundChartColor(c.compoundName),
      })),
    [data]
  );

  const rateRanking = React.useMemo(() => {
    return [...(data?.byCompound ?? [])].sort(
      (a, b) => b.consumptionRatePct - a.consumptionRatePct || b.consumedKg - a.consumedKg
    );
  }, [data]);

  const sortedTableRows = React.useMemo(() => {
    const rows = [...(data?.byCompound ?? [])];
    const mul = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * mul;
      }
      return ((av as number) - (bv as number)) * mul;
    });
    return rows;
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'compoundName' || key === 'locationsDisplay' ? 'asc' : 'desc');
    }
  };

  const timelineRows = React.useMemo(
    () => (data ? timelineToChartRows(data.productionTimeline, compoundNames) : []),
    [data, compoundNames]
  );

  const consumptionTimelineRows = React.useMemo(
    () => (data ? timelineToChartRows(data.consumptionTimeline, compoundNames) : []),
    [data, compoundNames]
  );

  const bubbleData = data?.bubblePoints ?? [];
  const medianProduced =
    bubbleData.length === 0
      ? 0
      : [...bubbleData].sort((a, b) => a.producedKg - b.producedKg)[
          Math.floor(bubbleData.length / 2)
        ]!.producedKg;
  const medianRate =
    bubbleData.length === 0
      ? 0
      : [...bubbleData].sort((a, b) => a.consumptionRatePct - b.consumptionRatePct)[
          Math.floor(bubbleData.length / 2)
        ]!.consumptionRatePct;

  const allRatesZero =
    (data?.byCompound.length ?? 0) > 0 &&
    (data?.byCompound ?? []).every((c) => c.consumptionRatePct < 0.01);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Production date filters apply to batches; consumption timeline uses balance-update
            history in the same date window when dates are set.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Field>
            <FieldLabel>Location</FieldLabel>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(data?.availableLocations ?? []).map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Compound name contains</FieldLabel>
            <Input
              value={compound}
              onChange={(e) => setCompound(e.target.value)}
              placeholder="e.g. NK-7"
            />
          </Field>
          <Field>
            <FieldLabel>From</FieldLabel>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>To</FieldLabel>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Timeline bucket</FieldLabel>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as typeof granularity)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Slow stock (days)</FieldLabel>
            <Input
              type="number"
              min={1}
              value={slowDays}
              onChange={(e) => setSlowDays(e.target.value)}
            />
          </Field>
          <div className="flex items-end gap-2 xl:col-span-6">
            <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load analytics'}
          </CardContent>
        </Card>
      )}

      {data && !isLoading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total production"
              value={`${formatKg(data.totals.totalProducedKg)} kg`}
              hint="Sum of produced weight (all filtered batches)"
            />
            <MetricCard
              title="Total in stock"
              value={`${formatKg(data.totals.totalInStockKg)} kg`}
              hint="Sum of remaining weight"
            />
            <MetricCard
              title="Total consumed"
              value={`${formatKg(data.totals.totalConsumedKg)} kg`}
              hint="Sum of consumed weight"
            />
            <MetricCard
              title="Overall consumption rate"
              value={`${data.totals.overallConsumptionRatePct.toFixed(1)}%`}
              hint="Consumed ÷ produced"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top compound (production)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-semibold">
                {data.topCompoundByProduction ? (
                  <>
                    <span style={{ color: getCompoundChartColor(data.topCompoundByProduction.compoundName) }}>
                      {data.topCompoundByProduction.compoundName}
                    </span>
                    <p className="text-muted-foreground mt-1 text-sm font-normal">
                      {formatKg(data.topCompoundByProduction.producedKg)} kg
                    </p>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg batch size
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-semibold">
                {formatKg(data.avgBatchSizeKg)} kg
                <p className="text-muted-foreground mt-1 text-sm font-normal">
                  {data.totals.totalBatches} batch{data.totals.totalBatches === 1 ? '' : 'es'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fastest moving (by rate)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-semibold">
                {data.fastestMovingCompound ? (
                  <>
                    <span style={{ color: getCompoundChartColor(data.fastestMovingCompound.compoundName) }}>
                      {data.fastestMovingCompound.compoundName}
                    </span>
                    <p className="text-muted-foreground mt-1 text-sm font-normal">
                      {data.fastestMovingCompound.consumptionRatePct.toFixed(1)}% ·{' '}
                      {formatKg(data.fastestMovingCompound.consumedKg)} kg consumed
                    </p>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </CardContent>
            </Card>
          </div>

          {data.slowMovingAlerts.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">Slow-moving stock</CardTitle>
                <CardDescription>
                  0% consumption (rounded) and oldest batch older than {data.filters.slowDays} days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {data.slowMovingAlerts.map((a) => (
                    <li key={a.compoundName}>
                      <strong>{a.compoundName}</strong> — {a.daysSinceOldestBatch} days since oldest batch,{' '}
                      {formatKg(a.producedKg)} kg produced
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <FieldGroup className="flex flex-wrap gap-2">
            {(
              [
                ['production', 'Production'],
                ['consumption', 'Consumption'],
                ['comparison', 'Comparison'],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={panel === id ? 'default' : 'outline'}
                onClick={() => setPanel(id)}
              >
                {label}
              </Button>
            ))}
          </FieldGroup>

          {panel === 'production' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Production by compound</CardTitle>
                  <CardDescription>Total kg produced per compound (filtered batches).</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] min-h-0 overflow-hidden">
                  <ChartContainer
                    config={{ produced: { label: 'Produced (kg)', color: analyticsChartCssVar(0) } }}
                    className="aspect-auto h-full w-full min-h-0"
                  >
                    <BarChart data={productionBarData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-28} textAnchor="end" height={56} />
                      <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={48} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => (
                              <span className="font-mono">
                                {name}: {formatKg(Number(value))} kg
                              </span>
                            )}
                          />
                        }
                      />
                      <Bar dataKey="producedKg" name="Produced" radius={[4, 4, 0, 0]}>
                        {productionBarData.map((e) => (
                          <Cell key={e.name} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid min-h-0 gap-6 lg:grid-cols-2">
                <Card className="min-h-0">
                  <CardHeader>
                    <CardTitle>Production timeline</CardTitle>
                    <CardDescription>One line per compound by production date.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[340px] min-h-0 overflow-hidden">
                    {timelineRows.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No batches in the current filters.</p>
                    ) : (
                      <ChartContainer
                        config={lineChartConfig}
                        className="aspect-auto h-full w-full min-h-0"
                      >
                        <LineChart data={timelineRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                          <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={44} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {compoundNames.map((name) => (
                            <Line
                              key={name}
                              type="monotone"
                              dataKey={sanitizeSeriesKey(name)}
                              name={name}
                              stroke={getCompoundChartColor(name)}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                        </LineChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="min-h-0">
                  <CardHeader>
                    <CardTitle>Production by location</CardTitle>
                    <CardDescription>Share of filtered production volume.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[340px] min-h-0 overflow-hidden">
                    {data.locationBreakdown.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No data.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.locationBreakdown.map((s) => ({
                              name: s.location,
                              value: s.producedKg,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={100}
                            paddingAngle={2}
                            label={({ name, percent }) =>
                              `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                            }
                          >
                            {data.locationBreakdown.map((s, i) => (
                              <Cell
                                key={s.location}
                                fill={analyticsChartCssVar(i)}
                              />
                            ))}
                          </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const v = Number(value ?? 0);
                            return [`${formatKg(v)} kg`, 'Produced'];
                          }}
                        />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Production velocity</CardTitle>
                  <CardDescription>Total kg produced per period (all compounds).</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] min-h-0 overflow-hidden">
                  <ChartContainer
                    config={{ totalKg: { label: 'kg', color: analyticsChartCssVar(3) } }}
                    className="aspect-auto h-full w-full min-h-0"
                  >
                    <LineChart
                      data={data.productionTimeline.map((p) => ({
                        periodLabel: p.periodLabel,
                        totalKg: p.totalKg,
                      }))}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={44} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="totalKg"
                        stroke={analyticsChartCssVar(3)}
                        strokeWidth={2}
                        dot={{ fill: analyticsChartCssVar(3) }}
                        name="Total kg"
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {panel === 'consumption' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>In stock vs consumed</CardTitle>
                  <CardDescription>
                    Stacked bar per compound: consumed (darker) + in stock (lighter) using each
                    compound&apos;s brand color.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] min-h-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedConsumptionData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-24} textAnchor="end" height={52} />
                      <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={48} />
                      <Tooltip
                        formatter={(value, name) => {
                          const n = Number(value ?? 0);
                          return [
                            `${formatKg(n)} kg`,
                            String(name) === 'consumedKg' ? 'Consumed' : 'In stock',
                          ];
                        }}
                      />
                      <Legend formatter={(v) => (v === 'consumedKg' ? 'Consumed' : 'In stock')} />
                      <Bar dataKey="consumedKg" stackId="a" name="consumedKg" radius={[0, 0, 0, 0]}>
                        {stackedConsumptionData.map((e) => (
                          <Cell key={`c-${e.name}`} fill={darkenHex(getCompoundChartColor(e.name))} />
                        ))}
                      </Bar>
                      <Bar dataKey="inStockKg" stackId="a" name="inStockKg" radius={[4, 4, 0, 0]}>
                        {stackedConsumptionData.map((e) => (
                          <Cell key={`i-${e.name}`} fill={lightenHex(getCompoundChartColor(e.name), 0.35)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Consumption from balance updates</CardTitle>
                  <CardDescription>
                    Kg inferred from history (remaining before − remaining after) per period. Empty
                    when no balance updates fall in the filter window.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] min-h-0 overflow-hidden">
                  {consumptionTimelineRows.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No consumption events in this window. When batches are updated via balance
                      changes, trends appear here.
                    </p>
                  ) : (
                    <ChartContainer
                      config={lineChartConfig}
                      className="aspect-auto h-full w-full min-h-0"
                    >
                      <LineChart data={consumptionTimelineRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                        <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={44} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {compoundNames.map((name) => (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={sanitizeSeriesKey(name)}
                            name={name}
                            stroke={getCompoundChartColor(name)}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Consumption rate by compound</CardTitle>
                  <CardDescription>
                    Sorted by rate (highest first). Colors: ≤30% amber, 31–70% blue, &gt;70% green.
                    {allRatesZero && (
                      <span className="text-amber-700 dark:text-amber-400">
                        {' '}
                        All rates are 0% — no dispatches / balance reductions recorded yet.
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rateRanking.map((c) => (
                    <div key={c.compoundName} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="text-muted-foreground w-40 shrink-0 text-sm font-medium">
                        {c.compoundName}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="bg-muted h-2.5 min-w-0 flex-1 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, c.consumptionRatePct)}%`,
                              backgroundColor: consumptionRateTrackColor(
                                allRatesZero ? 15 : c.consumptionRatePct
                              ),
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {c.consumptionRatePct.toFixed(1)}% · {formatKg(c.consumedKg)} kg
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {panel === 'comparison' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Production vs consumption</CardTitle>
                  <CardDescription>Grouped bars per compound.</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px] min-h-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonGroupedData} margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-24} textAnchor="end" height={52} />
                      <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={48} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const row = data.byCompound.find((c) => c.compoundName === label);
                          const rate = row
                            ? `${row.consumptionRatePct.toFixed(1)}%`
                            : '';
                          return (
                            <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
                              <p className="font-medium">{String(label)}</p>
                              {payload.map((p) => (
                                <p key={String(p.dataKey)} className="tabular-nums">
                                  {p.name}: {formatKg(Number(p.value))} kg
                                </p>
                              ))}
                              {row && (
                                <p className="text-muted-foreground mt-1">
                                  In stock: {formatKg(row.inStockKg)} kg · Rate: {rate}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Legend />
                      <Bar dataKey="produced" name="Produced" radius={[4, 4, 0, 0]}>
                        {comparisonGroupedData.map((e) => (
                          <Cell key={`p-${e.name}`} fill={getCompoundChartColor(e.name)} />
                        ))}
                      </Bar>
                      <Bar dataKey="consumed" name="Consumed" radius={[4, 4, 0, 0]}>
                        {comparisonGroupedData.map((e) => (
                          <Cell key={`u-${e.name}`} fill={lightenHex(getCompoundChartColor(e.name), 0.5)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid min-h-0 gap-6 lg:grid-cols-2">
                <Card className="min-h-0">
                  <CardHeader>
                    <CardTitle>Production ranking</CardTitle>
                    <CardDescription>Sorted by total produced (kg).</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[360px] min-h-0 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={rankingData}
                        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => formatKgCompact(Number(v))} />
                        <YAxis type="category" dataKey="compoundName" width={88} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => {
                            const n = Number(value ?? 0);
                            return [`${formatKg(n)} kg`, 'Produced'];
                          }}
                          labelFormatter={(_, p) => {
                            const item = p?.[0]?.payload as (typeof rankingData)[0] | undefined;
                            return item ? `Rank ${item.rank} · ${item.compoundName}` : '';
                          }}
                        />
                        <Bar dataKey="producedKg" radius={[0, 4, 4, 0]}>
                          {rankingData.map((e) => (
                            <Cell
                              key={e.compoundName}
                              fill={e.fill}
                              stroke={e.rank === 1 ? 'var(--foreground)' : undefined}
                              strokeWidth={e.rank === 1 ? 2 : 0}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="min-h-0">
                  <CardHeader>
                    <CardTitle>Production share</CardTitle>
                    <CardDescription>Donut by compound (filtered production).</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[360px] min-h-0 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieShareData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={110}
                          paddingAngle={1}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {pieShareData.map((e) => (
                            <Cell key={e.name} fill={e.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _name, item) => {
                            const v = Number(value ?? 0);
                            const name = (item as { payload?: { name?: string } })?.payload?.name;
                            const row = data.byCompound.find((c) => c.compoundName === name);
                            return [
                              `${formatKg(v)} kg${row ? ` · ${row.batchCount} batches` : ''}`,
                              'Produced',
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cross-compound overview</CardTitle>
                  <CardDescription>
                    X = produced (kg), Y = consumption rate (%), bubble size = batch count. Quadrant
                    lines at medians.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[380px] min-h-0 overflow-hidden">
                  {bubbleData.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No compounds to plot.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                        <XAxis
                          type="number"
                          dataKey="producedKg"
                          name="Produced"
                          tickFormatter={(v) => formatKgCompact(Number(v))}
                        />
                        <YAxis
                          type="number"
                          dataKey="consumptionRatePct"
                          name="Rate %"
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <ZAxis type="number" dataKey="batchCount" range={[80, 800]} name="Batches" />
                        {medianProduced > 0 && (
                          <ReferenceLine
                            x={medianProduced}
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                          />
                        )}
                        <ReferenceLine
                          y={medianRate}
                          stroke="var(--border)"
                          strokeDasharray="4 4"
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const p = payload[0].payload as (typeof bubbleData)[0];
                            return (
                              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
                                <p className="font-medium">{p.compoundName}</p>
                                <p>Produced: {formatKg(p.producedKg)} kg</p>
                                <p>Rate: {p.consumptionRatePct.toFixed(1)}%</p>
                                <p>Batches: {p.batchCount}</p>
                              </div>
                            );
                          }}
                        />
                        <Scatter name="Compounds" data={bubbleData}>
                          {bubbleData.map((e) => (
                            <Cell key={e.compoundName} fill={getCompoundChartColor(e.compoundName)} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average kg per batch</CardTitle>
                  <CardDescription>Process / batch-size comparison.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] min-h-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.batchEfficiency}
                      margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => formatKgCompact(Number(v))} />
                      <YAxis type="category" dataKey="compoundName" width={88} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => {
                          const n = Number(value ?? 0);
                          return [`${formatKg(n)} kg/batch`, 'Average'];
                        }}
                      />
                      <Bar dataKey="avgKgPerBatch" radius={[0, 4, 4, 0]}>
                        {data.batchEfficiency.map((e) => (
                          <Cell key={e.compoundName} fill={getCompoundChartColor(e.compoundName)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Master comparison table</CardTitle>
              <CardDescription>Click a column header to sort. All weights in kg.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTh label="Compound" active={sortKey === 'compoundName'} dir={sortDir} onClick={() => toggleSort('compoundName')} />
                    <SortableTh label="Produced" active={sortKey === 'producedKg'} dir={sortDir} onClick={() => toggleSort('producedKg')} className="text-right" />
                    <SortableTh label="In stock" active={sortKey === 'inStockKg'} dir={sortDir} onClick={() => toggleSort('inStockKg')} className="text-right" />
                    <SortableTh label="Consumed" active={sortKey === 'consumedKg'} dir={sortDir} onClick={() => toggleSort('consumedKg')} className="text-right" />
                    <SortableTh label="Rate" active={sortKey === 'consumptionRatePct'} dir={sortDir} onClick={() => toggleSort('consumptionRatePct')} className="text-right" />
                    <SortableTh label="Batches" active={sortKey === 'batchCount'} dir={sortDir} onClick={() => toggleSort('batchCount')} className="text-right" />
                    <SortableTh label="Location" active={sortKey === 'locationsDisplay'} dir={sortDir} onClick={() => toggleSort('locationsDisplay')} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTableRows.map((row) => (
                    <TableRow key={row.compoundName}>
                      <TableCell className="font-medium">
                        <span style={{ color: getCompoundChartColor(row.compoundName) }}>{row.compoundName}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatKg(row.producedKg)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatKg(row.inStockKg)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatKg(row.consumedKg)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.consumptionRatePct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.batchCount}</TableCell>
                      <TableCell className="text-sm">{row.locationsDisplay}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function formatKg(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead className={cn(className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 font-medium hover:underline',
          active && 'text-foreground'
        )}
      >
        {label}
        {active && <span className="text-muted-foreground text-xs">{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </TableHead>
  );
}
