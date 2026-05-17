import { FabricAnalyticsDashboard } from './fabric-analytics-dashboard';

export default function FabricsAnalyticsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fabric analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fabric inventory insights — consumption, stock mix by width and strength, partial
          rolls, and open / in-use and packed aging.
        </p>
      </div>
      <FabricAnalyticsDashboard />
    </main>
  );
}
