'use client';

import * as React from 'react';

import type { RawMaterialAnalyticsGranularity } from '@/lib/rawMaterialAnalyticsQuery';

export type RawMaterialAnalyticsFiltersContextValue = {
  material: string;
  setMaterial: (v: string) => void;
  grade: string;
  setGrade: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  bucket: string;
  setBucket: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  granularity: RawMaterialAnalyticsGranularity;
  setGranularity: (v: RawMaterialAnalyticsGranularity) => void;
  lowStockDays: string;
  setLowStockDays: (v: string) => void;
  forecastWindow: string;
  setForecastWindow: (v: string) => void;
  selectedPeriod: string | null;
  setSelectedPeriod: (v: string | null) => void;
  refreshNonce: number;
  triggerRefresh: () => void;
  appendSharedQueryParams: (sp: URLSearchParams) => void;
};

const RawMaterialAnalyticsFiltersContext = React.createContext<
  RawMaterialAnalyticsFiltersContextValue | undefined
>(undefined);

export function RawMaterialAnalyticsFiltersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [material, setMaterial] = React.useState('all');
  const [grade, setGrade] = React.useState('all');
  const [location, setLocation] = React.useState('all');
  const [bucket, setBucket] = React.useState('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [granularity, setGranularity] =
    React.useState<RawMaterialAnalyticsGranularity>('month');
  const [lowStockDays, setLowStockDays] = React.useState('14');
  const [forecastWindow, setForecastWindow] = React.useState('30');
  const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = React.useState(0);

  const triggerRefresh = React.useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const appendSharedQueryParams = React.useCallback(
    (sp: URLSearchParams) => {
      if (material && material !== 'all') sp.set('material', material);
      if (grade && grade !== 'all') sp.set('grade', grade);
      if (location && location !== 'all') sp.set('location', location);
      if (bucket && bucket !== 'all') sp.set('bucket', bucket);
      if (from) sp.set('from', from);
      if (to) sp.set('to', to);
      sp.set('granularity', granularity);
      if (lowStockDays) sp.set('lowStockDays', lowStockDays);
      if (forecastWindow) sp.set('forecastWindow', forecastWindow);
      if (selectedPeriod) sp.set('selectedPeriod', selectedPeriod);
    },
    [material, grade, location, bucket, from, to, granularity, lowStockDays, forecastWindow, selectedPeriod]
  );

  const value = React.useMemo(
    () =>
      ({
        material,
        setMaterial,
        grade,
        setGrade,
        location,
        setLocation,
        bucket,
        setBucket,
        from,
        setFrom,
        to,
        setTo,
        granularity,
        setGranularity,
        lowStockDays,
        setLowStockDays,
        forecastWindow,
        setForecastWindow,
        selectedPeriod,
        setSelectedPeriod,
        refreshNonce,
        triggerRefresh,
        appendSharedQueryParams,
      }) satisfies RawMaterialAnalyticsFiltersContextValue,
    [
      material,
      grade,
      location,
      bucket,
      from,
      to,
      granularity,
      lowStockDays,
      forecastWindow,
      selectedPeriod,
      refreshNonce,
      triggerRefresh,
      appendSharedQueryParams,
    ]
  );

  return (
    <RawMaterialAnalyticsFiltersContext.Provider value={value}>
      {children}
    </RawMaterialAnalyticsFiltersContext.Provider>
  );
}

export function useRawMaterialAnalyticsFilters(): RawMaterialAnalyticsFiltersContextValue {
  const ctx = React.useContext(RawMaterialAnalyticsFiltersContext);
  if (!ctx) {
    throw new Error(
      'useRawMaterialAnalyticsFilters must be used within RawMaterialAnalyticsFiltersProvider'
    );
  }
  return ctx;
}
