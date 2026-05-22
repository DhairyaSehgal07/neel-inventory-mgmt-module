import { RawMaterialAnalyticsDashboard } from './raw-material-analytics-dashboard';
import { RawMaterialAnalyticsFiltersProvider } from './raw-material-analytics-filters-context';

export default function RawMaterialsAnalyticsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raw material analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Consumption by material and grade, stock comparison, packed-batch aging, low-stock
          alerts, location utilisation, and consumption forecasts.
        </p>
      </div>
      <RawMaterialAnalyticsFiltersProvider>
        <RawMaterialAnalyticsDashboard />
      </RawMaterialAnalyticsFiltersProvider>
    </main>
  );
}
