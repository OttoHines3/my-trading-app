import { TradeSummaryCards } from "@/components/trades/trade-summary-cards";
import { TradeTable } from "@/components/trades/trade-table";
import { FilterBar } from "@/components/filters/filter-bar";

export default function TradesPage() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Trades</h1>
          <p className="text-xs text-muted-foreground">View and analyze your trade history</p>
        </div>
      </div>
      <FilterBar />
      <TradeSummaryCards />
      <TradeTable />
    </div>
  );
}
