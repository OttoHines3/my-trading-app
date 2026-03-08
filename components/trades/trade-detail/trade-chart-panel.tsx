"use client";

import type { Trade } from "@/types";

interface Props {
  trade: Trade;
}

export function TradeChartPanel({ trade }: Props) {
  return (
    <div className="flex-1 rounded-xl bg-[#16161f] border border-white/5 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Price Chart — {trade.symbol}
        </h4>
        <span className="text-[10px] text-gray-600">Candlestick chart coming soon</span>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-[300px] border border-dashed border-white/10 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Candlestick Chart</p>
          <p className="text-xs text-gray-600">
            lightweight-charts integration placeholder
          </p>
          <div className="mt-3 flex justify-center gap-4 text-xs text-gray-600">
            <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
            <span>Exit: ${trade.exitPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
