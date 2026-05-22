'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, ChevronRight, Download, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Field, FieldLabel } from '@/components/ui/field';
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
import type {
  ConsumptionForecastSeries,
  ConsumptionTimelineBucket,
  LowStockAlert,
  MasterComparisonRow,
  MaterialConsumptionGroup,
  PackedAgingItem,
  PackedAgingSummary,
} from '@/lib/rawMaterialAnalytics';
import { formatKgCompact, getRawMaterialChartColor, packedAgingBucketLabel } from '@/lib/rawMaterialAnalytics';
import { cn } from '@/lib/utils';

import { downloadCsv } from './download-csv';
import { useRawMaterialAnalyticsFilters } from './raw-material-analytics-filters-context';

type PanelId =
  | 'consumption'
  | 'comparison'
  | 'aging'
  | 'location'
  | 'forecast';

type FilterOptions = {
  materials: string[];
  grades: string[];
  locations: string[];
};

const DISMISS_PREFIX = 'rm-alert-dismissed:';

function getErrorMessage(res: Response, json: { message?: string }, fallback: string): string {
  if (json?.message && typeof json.message === 'string') return json.message;
  if (res.status === 403) return 'You do not have permission to view raw material analytics.';
  if (res.status === 401) return 'You must be signed in.';
  return fallback;
}

async function fetchJson<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: T;
  };
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(getErrorMessage(res, json, fallback));
  }
  return json.data;
}

function sanitizeSeriesKey(name: string): string {
  return `s_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function FiltersCard({ options, optionsLoading }: { options?: FilterOptions; optionsLoading: boolean }) {
  const f = useRawMaterialAnalyticsFilters();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
        <CardDescription>
          Date range bounds consumption and comparison views. When empty, defaults to the last six
          months through today.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Field>
          <FieldLabel>Material</FieldLabel>
          <Select value={f.material} onValueChange={f.setMaterial} disabled={optionsLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All materials" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(options?.materials ?? []).map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Grade</FieldLabel>
          <Select value={f.grade} onValueChange={f.setGrade} disabled={optionsLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(options?.grades ?? []).map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Location</FieldLabel>
          <Select value={f.location} onValueChange={f.setLocation} disabled={optionsLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(options?.locations ?? []).map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>From</FieldLabel>
          <Input type="date" value={f.from} onChange={(e) => f.setFrom(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>To</FieldLabel>
          <Input type="date" value={f.to} onChange={(e) => f.setTo(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>Timeline bucket</FieldLabel>
          <Select value={f.granularity} onValueChange={(v) => f.setGranularity(v as typeof f.granularity)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Low stock threshold (days)</FieldLabel>
          <Input
            type="number"
            min={1}
            max={365}
            value={f.lowStockDays}
            onChange={(e) => f.setLowStockDays(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Aging bucket</FieldLabel>
          <Select value={f.bucket} onValueChange={f.setBucket}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All buckets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="fresh">Fresh (0–60 d)</SelectItem>
              <SelectItem value="aging">Aging (60–120 d)</SelectItem>
              <SelectItem value="overdue">Overdue (120+ d)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Forecast window (days)</FieldLabel>
          <Select value={f.forecastWindow} onValueChange={f.setForecastWindow}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="60">60</SelectItem>
              <SelectItem value="90">90</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="button" variant="secondary" onClick={f.triggerRefresh}>
            Apply filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LowStockAlertsBanner({ alerts }: { alerts: LowStockAlert[] }) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const keys = new Set<string>();
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(DISMISS_PREFIX)) keys.add(k.slice(DISMISS_PREFIX.length));
    }
    setDismissed(keys);
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.alertKey));
  if (visible.length === 0) return null;

  const dismiss = (alertKey: string) => {
    localStorage.setItem(`${DISMISS_PREFIX}${alertKey}`, '1');
    setDismissed((prev) => new Set([...prev, alertKey]));
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Low stock alerts</CardTitle>
        <CardDescription>Materials below your days-of-stock threshold</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {visible.map((a) => (
          <div
            key={a.alertKey}
            className="flex items-start gap-2 rounded-md border bg-background px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium">
                {a.material} · {a.grade}
              </span>
              <span className="text-muted-foreground block text-xs">
                {a.daysRemaining != null ? `${a.daysRemaining.toFixed(1)} days` : '—'} left ·{' '}
                {formatKgCompact(a.inStockKg)} kg in stock ·{' '}
                {a.avgDailyKg != null ? `${a.avgDailyKg.toFixed(2)} kg/day` : 'no rate'}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Dismiss alert"
              onClick={() => dismiss(a.alertKey)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ConsumptionPanel({
  timeline,
  groups,
  isLoading,
}: {
  timeline: ConsumptionTimelineBucket[];
  groups: MaterialConsumptionGroup[];
  isLoading: boolean;
}) {
  const f = useRawMaterialAnalyticsFilters();
  const [viewMode, setViewMode] = React.useState<'table' | 'bar'>('table');
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  const segmentKeys = React.useMemo(() => {
    const keys = new Set<string>();
    for (const b of timeline) {
      for (const s of b.segments) keys.add(s.segmentKey);
    }
    return [...keys];
  }, [timeline]);

  const chartRows = React.useMemo(() => {
    return timeline.map((b) => {
      const row: Record<string, string | number> = {
        periodLabel: b.periodLabel,
        periodKey: b.periodKey,
        totalKg: b.totalKg,
      };
      for (const sk of segmentKeys) {
        row[sanitizeSeriesKey(sk)] =
          b.segments.find((s) => s.segmentKey === sk)?.consumptionKg ?? 0;
      }
      return row;
    });
  }, [timeline, segmentKeys]);

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = { totalKg: { label: 'Total (kg)', color: 'var(--muted-foreground)' } };
    for (const sk of segmentKeys) {
      cfg[sanitizeSeriesKey(sk)] = {
        label: sk.split('|').join(' · '),
        color: getRawMaterialChartColor(sk),
      };
    }
    return cfg;
  }, [segmentKeys]);

  const toggleExpand = (material: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(material)) next.delete(material);
      else next.add(material);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Consumption timeline</CardTitle>
            <CardDescription>
              Stacked by grade. Click a bar to filter the table below.
              {f.selectedPeriod ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 pl-1"
                  onClick={() => f.setSelectedPeriod(null)}
                >
                  Clear period filter
                </Button>
              ) : null}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'bar' ? 'default' : 'outline'}
              onClick={() => setViewMode('bar')}
            >
              Bar chart
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No consumption recorded in this period. Updates to available stock will appear here.
            </p>
          ) : viewMode === 'bar' ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartRows}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 80, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatKgCompact(Number(v))} />
                  <YAxis type="category" dataKey="periodLabel" width={76} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [`${Number(v ?? 0).toFixed(1)} kg`, 'Consumed']}
                  />
                  {segmentKeys.map((sk) => (
                    <Bar
                      key={sk}
                      dataKey={sanitizeSeriesKey(sk)}
                      stackId="kg"
                      fill={getRawMaterialChartColor(sk)}
                      onClick={(data) => {
                        const payload = data as { payload?: { periodKey?: string } };
                        if (payload?.payload?.periodKey) {
                          f.setSelectedPeriod(payload.payload.periodKey);
                        }
                      }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {segmentKeys.map((sk) => (
                  <Bar
                    key={sk}
                    dataKey={sanitizeSeriesKey(sk)}
                    stackId="kg"
                    fill={getRawMaterialChartColor(sk)}
                    onClick={(data) => {
                      const payload = data as { payload?: { periodKey?: string } };
                      if (payload?.payload?.periodKey) {
                        f.setSelectedPeriod(payload.payload.periodKey);
                      }
                    }}
                    className="cursor-pointer"
                  />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consumption by material and grade</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Material</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Bags consumed</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead className="text-right">% of total</TableHead>
                <TableHead className="text-right">Avg / month</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No consumption in selected period
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((g) => {
                  const isOpen = expanded.has(g.material);
                  return (
                    <React.Fragment key={g.material}>
                      <TableRow
                        className="cursor-pointer bg-muted/30 font-medium"
                        onClick={() => toggleExpand(g.material)}
                      >
                        <TableCell>
                          {isOpen ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </TableCell>
                        <TableCell>{g.material}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {g.grades.length} grade{g.grades.length === 1 ? '' : 's'}
                        </TableCell>
                        <TableCell className="text-right">
                          {g.grades.reduce((s, r) => s + r.bagsConsumed, 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {g.totalWeightConsumedKg.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">100</TableCell>
                        <TableCell className="text-right">—</TableCell>
                      </TableRow>
                      {isOpen &&
                        g.grades.map((row) => (
                          <TableRow key={row.gradeKey}>
                            <TableCell />
                            <TableCell className="pl-6 text-muted-foreground">{g.material}</TableCell>
                            <TableCell>{row.grade}</TableCell>
                            <TableCell className="text-right">{row.bagsConsumed.toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                              {row.weightConsumedKg.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right">{row.pctOfTotal.toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                              {row.avgPerMonthKg.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

type ComparisonSortKey = keyof MasterComparisonRow;

function ComparisonPanel({
  rows,
  isLoading,
}: {
  rows: MasterComparisonRow[];
  isLoading: boolean;
}) {
  const [sortKey, setSortKey] = React.useState<ComparisonSortKey>('material');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const sorted = React.useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: ComparisonSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const exportCsv = () => {
    downloadCsv('raw-material-comparison.csv', 
      [
        'Material',
        'Grade',
        'Procured (kg)',
        'In stock (kg)',
        'Consumed (kg)',
        'Avg daily (kg/day)',
        'Days of stock',
      ],
      sorted.map((r) => [
        r.material,
        r.grade,
        r.procuredKg.toFixed(2),
        r.inStockKg.toFixed(2),
        r.consumedKg.toFixed(2),
        r.avgDailyConsumptionKg?.toFixed(3) ?? '',
        r.daysOfStockRemaining?.toFixed(1) ?? '',
      ])
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Master comparison</CardTitle>
          <CardDescription>Procurement vs stock vs consumption by material and grade</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {(
                [
                  ['material', 'Material'],
                  ['grade', 'Grade'],
                  ['procuredKg', 'Procured (kg)'],
                  ['inStockKg', 'In stock (kg)'],
                  ['consumedKg', 'Consumed (kg)'],
                  ['avgDailyConsumptionKg', 'Rate (kg/day)'],
                  ['daysOfStockRemaining', 'Days left'],
                ] as [ComparisonSortKey, string][]
              ).map(([key, label]) => (
                <TableHead
                  key={key}
                  className={key !== 'material' && key !== 'grade' ? 'text-right' : undefined}
                >
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={`${r.material}|${r.grade}`}>
                <TableCell>{r.material}</TableCell>
                <TableCell>{r.grade}</TableCell>
                <TableCell className="text-right">{r.procuredKg.toFixed(1)}</TableCell>
                <TableCell className="text-right">{r.inStockKg.toFixed(1)}</TableCell>
                <TableCell className="text-right">{r.consumedKg.toFixed(1)}</TableCell>
                <TableCell className="text-right">
                  {r.avgDailyConsumptionKg != null ? r.avgDailyConsumptionKg.toFixed(2) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {r.daysOfStockRemaining != null ? r.daysOfStockRemaining.toFixed(1) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function bucketBadgeVariant(bucket: PackedAgingItem['bucket']): 'default' | 'secondary' | 'destructive' {
  if (bucket === 'overdue') return 'destructive';
  if (bucket === 'aging') return 'secondary';
  return 'default';
}

function AgingPanel({
  summaries,
  items,
  isLoading,
}: {
  summaries: PackedAgingSummary[];
  items: PackedAgingItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {summaries.map((s) => (
          <Card key={s.bucket}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{s.count}</p>
              <p className="text-muted-foreground text-sm">{formatKgCompact(s.totalKg)} kg</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Packed batches</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch code</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Packed date</TableHead>
                <TableHead className="text-right">Age (days)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No packed batches match filters
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.rawMaterialId}
                    className={cn(
                      item.bucket === 'overdue' && 'bg-destructive/5',
                      item.bucket === 'aging' && 'bg-amber-500/5'
                    )}
                  >
                    <TableCell className="font-mono text-sm">{item.batchCode}</TableCell>
                    <TableCell>{item.material}</TableCell>
                    <TableCell>{item.grade}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{format(new Date(item.packedAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">{item.ageDays}</TableCell>
                    <TableCell>
                      <Badge variant={bucketBadgeVariant(item.bucket)}>
                        {packedAgingBucketLabel(item.bucket)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LocationPanel({
  rows,
  isLoading,
}: {
  rows: { location: string; totalBags: number; totalKg: number; distinctMaterials: number; shareOfTotalPct: number }[];
  isLoading: boolean;
}) {
  const chartData = rows.map((r) => ({ name: r.location, kg: r.totalKg }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock by location</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No location data</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} />
                <Tooltip formatter={(v) => [`${Number(v ?? 0).toFixed(1)} kg`, 'In stock']} />
                <Bar dataKey="kg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Bags</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">% of total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.location}>
                  <TableCell>{r.location}</TableCell>
                  <TableCell className="text-right">{r.totalBags.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.totalKg.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.distinctMaterials}</TableCell>
                  <TableCell className="text-right">{r.shareOfTotalPct.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ForecastPanel({
  series,
  isLoading,
}: {
  series: ConsumptionForecastSeries[];
  isLoading: boolean;
}) {
  const [selected, setSelected] = React.useState<string>('');

  React.useEffect(() => {
    if (series.length > 0 && !selected) setSelected(series[0].seriesKey);
  }, [series, selected]);

  const active = series.find((s) => s.seriesKey === selected) ?? series[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-muted-foreground text-sm">
          No materials match filters. Consumption history is recorded when available stock is
          updated.
        </CardContent>
      </Card>
    );
  }

  const chartData = (active?.points ?? []).map((p) => ({
    label: p.label,
    actual: p.actualKg,
    forecast: p.forecastKg,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Consumption trend and forecast</CardTitle>
        <CardDescription>
          Rolling average from recent history; dashed line projects forward.
          {active?.projectedStockoutDate
            ? ` Projected stockout: ${format(new Date(active.projectedStockoutDate), 'dd MMM yyyy')}.`
            : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selected || active?.seriesKey} onValueChange={setSelected}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select material · grade" />
          </SelectTrigger>
          <SelectContent>
            {series.map((s) => (
              <SelectItem key={s.seriesKey} value={s.seriesKey}>
                {s.material} · {s.grade}
                {!s.hasEnoughHistory ? ' (limited history)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!active?.hasEnoughHistory ? (
          <p className="text-muted-foreground text-sm">
            Not enough consumption events yet for a reliable forecast. Keep recording stock
            updates to build history.
          </p>
        ) : null}
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => formatKgCompact(Number(v))} width={48} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual (kg)"
                stroke="var(--chart-1)"
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast (kg)"
                stroke="var(--chart-3)"
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RawMaterialAnalyticsDashboard() {
  const f = useRawMaterialAnalyticsFilters();
  const [panel, setPanel] = React.useState<PanelId>('consumption');

  const buildUrl = React.useCallback(
    (path: string) => {
      const sp = new URLSearchParams();
      f.appendSharedQueryParams(sp);
      const q = sp.toString();
      return `${path}${q ? `?${q}` : ''}`;
    },
    [f]
  );

  const queryKeyBase = [
    f.material,
    f.grade,
    f.location,
    f.bucket,
    f.from,
    f.to,
    f.granularity,
    f.lowStockDays,
    f.forecastWindow,
    f.selectedPeriod,
    f.refreshNonce,
  ];

  const { data: filterOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['rm-analytics', 'filter-options'],
    queryFn: () =>
      fetchJson<FilterOptions>('/api/raw-materials/analytics/filter-options', 'Failed to load options'),
    staleTime: 60_000,
  });

  const summaryUrl = buildUrl('/api/raw-materials/analytics/summary');
  const { data: summary } = useQuery({
    queryKey: ['rm-analytics', 'summary', ...queryKeyBase],
    queryFn: () =>
      fetchJson<{
        lowStockAlerts: LowStockAlert[];
        locationUtilisation: {
          location: string;
          totalBags: number;
          totalKg: number;
          distinctMaterials: number;
          shareOfTotalPct: number;
        }[];
      }>(summaryUrl, 'Failed to load summary'),
  });
  const locationRows = summary?.locationUtilisation ?? [];

  const consumptionUrl = buildUrl('/api/raw-materials/analytics/consumption-by-grade');
  const { data: consumption, isLoading: consumptionLoading } = useQuery({
    queryKey: ['rm-analytics', 'consumption', ...queryKeyBase],
    queryFn: () =>
      fetchJson<{ timeline: ConsumptionTimelineBucket[]; groups: MaterialConsumptionGroup[] }>(
        consumptionUrl,
        'Failed to load consumption'
      ),
    enabled: panel === 'consumption',
  });

  const comparisonUrl = buildUrl('/api/raw-materials/analytics/master-comparison');
  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['rm-analytics', 'comparison', ...queryKeyBase],
    queryFn: () => fetchJson<{ rows: MasterComparisonRow[] }>(comparisonUrl, 'Failed to load comparison'),
    enabled: panel === 'comparison',
  });

  const agingUrl = buildUrl('/api/raw-materials/analytics/packed-aging');
  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ['rm-analytics', 'aging', ...queryKeyBase],
    queryFn: () =>
      fetchJson<{ summaries: PackedAgingSummary[]; items: PackedAgingItem[] }>(
        agingUrl,
        'Failed to load aging'
      ),
    enabled: panel === 'aging',
  });

  const forecastUrl = buildUrl('/api/raw-materials/analytics/forecast');
  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['rm-analytics', 'forecast', ...queryKeyBase],
    queryFn: () => fetchJson<{ series: ConsumptionForecastSeries[] }>(forecastUrl, 'Failed to load forecast'),
    enabled: panel === 'forecast',
  });

  const panels: { id: PanelId; label: string }[] = [
    { id: 'consumption', label: 'Consumption' },
    { id: 'comparison', label: 'Master comparison' },
    { id: 'aging', label: 'Packed aging' },
    { id: 'location', label: 'Locations' },
    { id: 'forecast', label: 'Forecast' },
  ];

  return (
    <div className="space-y-6">
      <FiltersCard options={filterOptions} optionsLoading={optionsLoading} />

      {summary?.lowStockAlerts ? (
        <LowStockAlertsBanner alerts={summary.lowStockAlerts} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {panels.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={panel === p.id ? 'default' : 'outline'}
            onClick={() => setPanel(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {panel === 'consumption' && (
        <ConsumptionPanel
          timeline={consumption?.timeline ?? []}
          groups={consumption?.groups ?? []}
          isLoading={consumptionLoading}
        />
      )}
      {panel === 'comparison' && (
        <ComparisonPanel rows={comparison?.rows ?? []} isLoading={comparisonLoading} />
      )}
      {panel === 'aging' && (
        <AgingPanel
          summaries={aging?.summaries ?? []}
          items={aging?.items ?? []}
          isLoading={agingLoading}
        />
      )}
      {panel === 'location' && (
        <LocationPanel rows={locationRows} isLoading={!summary} />
      )}
      {panel === 'forecast' && (
        <ForecastPanel series={forecast?.series ?? []} isLoading={forecastLoading} />
      )}
    </div>
  );
}
