import { ConsumptionTrendChart } from "./consumption-trend-chart"
import { OpenInUseAgingChart } from "./open-in-use-aging-chart"
import { PartialRollRemnantChart } from "./partial-roll-remnant-chart"
import { StockCoverBySkuChart } from "./stock-cover-by-sku-chart"
import { WidthStrengthStockMatrix } from "./width-strength-stock-matrix"

export default function AnalyticsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fabric inventory insights — coverage, aging, consumption, remnants, and
          imbalances across SKUs, width, and strength.
        </p>
      </div>
      <StockCoverBySkuChart />
      <OpenInUseAgingChart />
      <ConsumptionTrendChart />
      <WidthStrengthStockMatrix />
      <PartialRollRemnantChart />
    </main>
  )
}
