"use client";

import { CumulativePnlReport } from "./charts/cumulative-pnl-report";
import { AvgDailyWinLoss } from "./charts/avg-daily-win-loss";
import { PerformanceSummaryGrid } from "./performance-summary-grid";

export function PerformanceTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CumulativePnlReport />
        <AvgDailyWinLoss />
      </div>
      <PerformanceSummaryGrid />
    </div>
  );
}
