/**
 * Shared palette for fabric & compound analytics dashboards.
 * Prefer CSS vars in charts so colors follow light/dark theme.
 */

export const ANALYTICS_CHART_CSS_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--chart-9)',
  'var(--chart-10)',
] as const;

/** Hex fallbacks for hash-based series (aligned with :root chart tokens). */
export const ANALYTICS_CHART_HEX = [
  '#378ADD',
  '#1D9E75',
  '#D85A30',
  '#BA7517',
  '#7F77DD',
  '#0891B2',
  '#DB2777',
  '#CA8A04',
  '#4F46E5',
  '#9333EA',
] as const;

export function analyticsChartCssVar(index: number): string {
  const n = ANALYTICS_CHART_CSS_VARS.length;
  return ANALYTICS_CHART_CSS_VARS[((index % n) + n) % n]!;
}

export function analyticsChartHex(index: number): string {
  const n = ANALYTICS_CHART_HEX.length;
  return ANALYTICS_CHART_HEX[((index % n) + n) % n]!;
}

function hashKey(key: string): number {
  const trimmed = key.trim();
  let h = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    h = (h * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function analyticsChartCssVarByKey(key: string): string {
  return analyticsChartCssVar(hashKey(key));
}

export function analyticsChartHexByKey(key: string): string {
  return analyticsChartHex(hashKey(key));
}
