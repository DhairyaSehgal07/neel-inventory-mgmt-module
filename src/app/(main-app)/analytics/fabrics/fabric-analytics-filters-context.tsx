'use client';

import * as React from 'react';

import type { ConsumptionTrendGranularity } from '@/lib/fabricAnalytics';

export type FabricAnalyticsFiltersContextValue = {
  location: string;
  setLocation: (v: string) => void;
  fabricCode: string;
  setFabricCode: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  granularity: ConsumptionTrendGranularity;
  setGranularity: (v: ConsumptionTrendGranularity) => void;
  refreshNonce: number;
  triggerRefresh: () => void;
  /** Append location, fabricCode, from, to to URLSearchParams (omits empty dates). */
  appendSharedQueryParams: (sp: URLSearchParams) => void;
};

const FabricAnalyticsFiltersContext = React.createContext<
  FabricAnalyticsFiltersContextValue | undefined
>(undefined);

export function FabricAnalyticsFiltersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, setLocation] = React.useState('all');
  const [fabricCode, setFabricCode] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [granularity, setGranularity] =
    React.useState<ConsumptionTrendGranularity>('month');
  const [refreshNonce, setRefreshNonce] = React.useState(0);

  const triggerRefresh = React.useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const appendSharedQueryParams = React.useCallback(
    (sp: URLSearchParams) => {
      if (location && location !== 'all') sp.set('location', location);
      if (fabricCode.trim()) sp.set('fabricCode', fabricCode.trim());
      if (from) sp.set('from', from);
      if (to) sp.set('to', to);
    },
    [location, fabricCode, from, to]
  );

  const value = React.useMemo(
    () =>
      ({
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
        refreshNonce,
        triggerRefresh,
        appendSharedQueryParams,
      }) satisfies FabricAnalyticsFiltersContextValue,
    [
      location,
      fabricCode,
      from,
      to,
      granularity,
      refreshNonce,
      triggerRefresh,
      appendSharedQueryParams,
    ]
  );

  return (
    <FabricAnalyticsFiltersContext.Provider value={value}>
      {children}
    </FabricAnalyticsFiltersContext.Provider>
  );
}

export function useFabricAnalyticsFilters(): FabricAnalyticsFiltersContextValue {
  const ctx = React.useContext(FabricAnalyticsFiltersContext);
  if (!ctx) {
    throw new Error('useFabricAnalyticsFilters must be used within FabricAnalyticsFiltersProvider');
  }
  return ctx;
}
