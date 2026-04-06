import { WidthStrengthStockMatrix } from "./width-strength-stock-matrix"

export default function AnalyticsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fabric inventory insights — spot gaps and imbalances across width and strength.
        </p>
      </div>
      <WidthStrengthStockMatrix />
    </main>
  )
}
