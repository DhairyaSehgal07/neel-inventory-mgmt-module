import { CompoundAnalyticsDashboard } from './compound-analytics-dashboard';

export default function CompoundsAnalyticsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compound analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Production and consumption by compound name, timelines, location share, and comparison
          views. Weights use stored fields: produced (total), in stock (remaining), consumed
          (derived in DB as produced minus remaining).
        </p>
      </div>
      <CompoundAnalyticsDashboard />
    </main>
  );
}
