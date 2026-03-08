"use client";

import { useState } from "react";
import { AGUnderlyingChart } from "./ag-underlying-chart";
import { AGOptionsChart } from "./ag-options-chart";
import type { Trade } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  trade: Trade;
}

type ChartView = "both" | "underlying" | "options";

export function AGChartsPanel({ trade }: Props) {
  const [chartView, setChartView] = useState<ChartView>("both");
  const isOptions = trade.assetClass === "options";

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      {/* View toggle - only show for options trades */}
      {isOptions && (
        <div className="flex items-center gap-1 self-end">
          <button
            onClick={() => setChartView("both")}
            className={cn(
              "px-3 py-1.5 text-[10px] font-medium rounded-l-lg border transition-colors",
              chartView === "both"
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
          >
            Both
          </button>
          <button
            onClick={() => setChartView("underlying")}
            className={cn(
              "px-3 py-1.5 text-[10px] font-medium border-y transition-colors",
              chartView === "underlying"
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
          >
            Underlying
          </button>
          <button
            onClick={() => setChartView("options")}
            className={cn(
              "px-3 py-1.5 text-[10px] font-medium rounded-r-lg border transition-colors",
              chartView === "options"
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
          >
            Options
          </button>
        </div>
      )}

      {/* Chart layout */}
      {isOptions ? (
        <div className={cn(
          "flex-1",
          chartView === "both" ? "flex flex-col gap-4 min-h-[700px]" : "flex flex-col min-h-[400px]"
        )}>
          {(chartView === "both" || chartView === "underlying") && (
            <AGUnderlyingChart trade={trade} />
          )}
          {(chartView === "both" || chartView === "options") && (
            <AGOptionsChart trade={trade} />
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-[400px]">
          <AGUnderlyingChart trade={trade} />
        </div>
      )}
    </div>
  );
}
