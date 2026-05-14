'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ConsumptionTrendChart } from '../consumption-trend-chart';
import { OpenInUseAgingChart } from '../open-in-use-aging-chart';
import { PartialRollRemnantChart } from '../partial-roll-remnant-chart';
import { WidthStrengthConsumptionMatrix } from '../width-strength-consumption-matrix';
import { WidthStrengthStockMatrix } from '../width-strength-stock-matrix';
import {
  FabricAnalyticsFiltersProvider,
  useFabricAnalyticsFilters,
} from './fabric-analytics-filters-context';

type FilterOptionsData = {
  locations: { value: string; label: string }[];
};

async function fetchFilterOptions(): Promise<FilterOptionsData> {
  const res = await fetch('/api/fabrics/analytics/filter-options');
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: FilterOptionsData;
  };
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message ?? 'Failed to load filter options');
  }
  return json.data;
}

function FabricAnalyticsFiltersCard() {
  const {
    location,
    setLocation,
    fabricCode,
    setFabricCode,
    from,
    setFrom,
    to,
    setTo,
    granularity,
    setGranularity,
    triggerRefresh,
  } = useFabricAnalyticsFilters();

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['fabric-analytics', 'filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
        <CardDescription>
          Location and fabric code apply across charts. From / To bound consumption views
          and the consumption matrix; when empty, consumption uses the last six months through
          today. Timeline bucket controls the consumption trend chart granularity.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Field>
          <FieldLabel>Location</FieldLabel>
          <Select value={location} onValueChange={setLocation} disabled={optionsLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(options?.locations ?? []).map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel>Fabric code contains</FieldLabel>
          <Input
            value={fabricCode}
            onChange={(e) => setFabricCode(e.target.value)}
            placeholder="e.g. FAB-1024"
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
          <Select
            value={granularity}
            onValueChange={(v) => setGranularity(v as typeof granularity)}
          >
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
        <div className="flex items-end gap-2 xl:col-span-6">
          <Button type="button" variant="secondary" onClick={triggerRefresh}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FabricAnalyticsCharts() {
  return (
    <div className="space-y-8">
      <ConsumptionTrendChart />
      <WidthStrengthConsumptionMatrix />
      <WidthStrengthStockMatrix />
      <PartialRollRemnantChart />
      <OpenInUseAgingChart />
    </div>
  );
}

export function FabricAnalyticsDashboard() {
  return (
    <FabricAnalyticsFiltersProvider>
      <div className="space-y-6">
        <FabricAnalyticsFiltersCard />
        <FabricAnalyticsCharts />
      </div>
    </FabricAnalyticsFiltersProvider>
  );
}
