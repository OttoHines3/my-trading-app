"use client";

import { useMemo } from "react";
import { AgCharts } from "ag-charts-react";
import type { AgChartOptions } from "ag-charts-enterprise";
import type { Trade } from "@/types";

interface Props {
  trade: Trade;
}

// Parse options symbol to extract details
// Format examples: "SPY 495C 02/07", "AAPL 250321C00180000", "SPY 03/21/25 C 500"
function parseOptionsSymbol(symbol: string): {
  underlying: string;
  expiry: string;
  type: "call" | "put";
  strike: number;
} | null {
  // Try standard OCC format: AAPL 250321C00180000
  const occMatch = symbol.match(/^([A-Z]+)\s*(\d{6})([CP])(\d{8})$/);
  if (occMatch) {
    const [, underlying, dateStr, typeChar, strikeStr] = occMatch;
    const year = `20${dateStr.slice(0, 2)}`;
    const month = dateStr.slice(2, 4);
    const day = dateStr.slice(4, 6);
    return {
      underlying,
      expiry: `${month}/${day}/${year}`,
      type: typeChar === "C" ? "call" : "put",
      strike: parseInt(strikeStr) / 1000,
    };
  }

  // Try compact format: "SPY 495C 02/07" or "AAPL 180P 03/21"
  // Pattern: SYMBOL STRIKE[C/P] DATE
  const compactMatch = symbol.match(/^([A-Z]+)\s+([\d.]+)([CP])\s+([\d\/]+)/i);
  if (compactMatch) {
    const [, underlying, strikeStr, typeChar, expiry] = compactMatch;
    return {
      underlying,
      expiry,
      type: typeChar.toUpperCase() === "C" ? "call" : "put",
      strike: parseFloat(strikeStr),
    };
  }

  // Try human-readable format: "SPY 03/21/25 C 500" or "AAPL 250321 C 180"
  // Pattern: SYMBOL DATE C/P STRIKE
  const humanMatch = symbol.match(/^([A-Z]+)\s+[\d\/]+\s+([CP])\s*[\$]?([\d.]+)/i);
  if (humanMatch) {
    const [, underlying, typeChar, strikeStr] = humanMatch;
    return {
      underlying,
      expiry: "Unknown",
      type: typeChar.toUpperCase() === "C" ? "call" : "put",
      strike: parseFloat(strikeStr),
    };
  }

  return null;
}

// Generate payoff diagram data
function generatePayoffData(
  strike: number,
  premium: number,
  type: "call" | "put",
  side: "long" | "short",
  quantity: number
): { price: number; pnl: number; breakeven: number }[] {
  const data: { price: number; pnl: number; breakeven: number }[] = [];
  const range = strike * 0.3; // 30% range around strike
  const min = Math.max(0, strike - range);
  const max = strike + range;
  const step = range / 25;

  const breakeven = type === "call" ? strike + premium : strike - premium;

  for (let price = min; price <= max; price += step) {
    let intrinsicValue = 0;

    if (type === "call") {
      intrinsicValue = Math.max(0, price - strike);
    } else {
      intrinsicValue = Math.max(0, strike - price);
    }

    let pnl: number;
    if (side === "long") {
      pnl = (intrinsicValue - premium) * quantity * 100;
    } else {
      pnl = (premium - intrinsicValue) * quantity * 100;
    }

    data.push({ price: Math.round(price * 100) / 100, pnl, breakeven });
  }

  return data;
}

export function AGOptionsChart({ trade }: Props) {
  const optionDetails = useMemo(() => parseOptionsSymbol(trade.symbol), [trade.symbol]);

  const chartOptions = useMemo((): AgChartOptions => {
    if (!optionDetails) {
      // Fallback: show simple P&L visualization
      const pnlData = [
        { category: "Entry", value: -trade.entryPrice * trade.quantity * 100 },
        { category: "Exit", value: trade.exitPrice * trade.quantity * 100 },
        { category: "Net P&L", value: trade.pnl },
      ];

      return {
        theme: {
          baseTheme: "ag-financial-dark",
          overrides: {
            common: {
              background: { fill: "#16161f" },
            },
          },
        },
        title: {
          text: "Trade P&L Summary",
          fontSize: 14,
          fontWeight: "bold",
          color: "rgba(255,255,255,0.8)",
        },
        data: pnlData,
        series: [
          {
            type: "bar",
            xKey: "category",
            yKey: "value",
            fill: trade.pnl >= 0 ? "#22c55e" : "#ef4444",
            stroke: trade.pnl >= 0 ? "#22c55e" : "#ef4444",
            cornerRadius: 4,
            label: {
              enabled: true,
              formatter: ({ value }: { value: number }) => `$${value.toFixed(2)}`,
              color: "rgba(255,255,255,0.8)",
            },
          },
        ],
        axes: [
          {
            type: "category",
            position: "bottom",
            label: { color: "rgba(255,255,255,0.6)" },
          },
          {
            type: "number",
            position: "left",
            label: {
              color: "rgba(255,255,255,0.4)",
              formatter: ({ value }: { value: number }) => `$${value}`,
            },
            crossLines: [
              {
                type: "line",
                value: 0,
                stroke: "rgba(255,255,255,0.2)",
                strokeWidth: 1,
              },
            ],
          },
        ],
      } as unknown as AgChartOptions;
    }

    // Full options payoff diagram
    const { strike, type } = optionDetails;
    const premium = trade.entryPrice;
    const payoffData = generatePayoffData(strike, premium, type, trade.side, trade.quantity);
    const breakeven = type === "call" ? strike + premium : strike - premium;
    const currentPrice = trade.exitPrice > 0
      ? strike + (trade.pnl / (trade.quantity * 100)) + (trade.side === "long" ? premium : -premium)
      : strike;

    return {
      theme: {
        baseTheme: "ag-financial-dark",
        overrides: {
          common: {
            background: { fill: "#16161f" },
          },
        },
      },
      title: {
        text: `${optionDetails.underlying} ${type.toUpperCase()} @ $${strike}`,
        fontSize: 14,
        fontWeight: "bold",
        color: "rgba(255,255,255,0.8)",
      },
      subtitle: {
        text: `${trade.side.toUpperCase()} ${trade.quantity} contract${trade.quantity > 1 ? "s" : ""} | Premium: $${premium.toFixed(2)}`,
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
      },
      data: payoffData,
      series: [
        {
          type: "area",
          xKey: "price",
          yKey: "pnl",
          yName: "P&L at Expiration",
          fill: "rgba(99, 102, 241, 0.2)",
          stroke: "#6366f1",
          strokeWidth: 2,
          marker: {
            enabled: false,
          },
          tooltip: {
            renderer: ({ datum }: { datum: { price: number; pnl: number } }) => ({
              title: `Stock Price: $${datum.price.toFixed(2)}`,
              content: `P&L: $${datum.pnl.toFixed(2)}`,
            }),
          },
        },
      ],
      axes: [
        {
          type: "number",
          position: "bottom",
          title: {
            text: "Underlying Price",
            color: "rgba(255,255,255,0.5)",
            fontSize: 10,
          },
          label: {
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            formatter: ({ value }: { value: number }) => `$${value}`,
          },
          gridLine: {
            style: [{ stroke: "rgba(255,255,255,0.06)" }],
          },
          crossLines: [
            {
              type: "line",
              value: strike,
              stroke: "#f59e0b",
              strokeWidth: 2,
              lineDash: [6, 4],
              label: {
                text: `Strike $${strike}`,
                position: "top",
                fontSize: 10,
                color: "#f59e0b",
              },
            },
            {
              type: "line",
              value: breakeven,
              stroke: "#8b5cf6",
              strokeWidth: 1,
              lineDash: [4, 4],
              label: {
                text: `B/E $${breakeven.toFixed(2)}`,
                position: "top",
                fontSize: 10,
                color: "#8b5cf6",
              },
            },
          ],
        },
        {
          type: "number",
          position: "left",
          title: {
            text: "Profit / Loss",
            color: "rgba(255,255,255,0.5)",
            fontSize: 10,
          },
          label: {
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            formatter: ({ value }: { value: number }) => {
              const absVal = Math.abs(value);
              if (absVal >= 1000) return `$${(value / 1000).toFixed(1)}K`;
              return `$${value}`;
            },
          },
          gridLine: {
            style: [{ stroke: "rgba(255,255,255,0.06)" }],
          },
          crossLines: [
            {
              type: "line",
              value: 0,
              stroke: "rgba(255,255,255,0.3)",
              strokeWidth: 1,
            },
            {
              type: "line",
              value: trade.pnl,
              stroke: trade.pnl >= 0 ? "#22c55e" : "#ef4444",
              strokeWidth: 2,
              lineDash: [4, 2],
              label: {
                text: `Actual P&L: $${trade.pnl.toFixed(2)}`,
                position: "right",
                fontSize: 10,
                color: trade.pnl >= 0 ? "#22c55e" : "#ef4444",
              },
            },
          ],
        },
      ],
      crosshair: {
        enabled: true,
      },
      tooltip: {
        enabled: true,
      },
    } as unknown as AgChartOptions;
  }, [optionDetails, trade]);

  // Key stats for options
  const stats = useMemo(() => {
    if (!optionDetails) return null;

    const { strike, type } = optionDetails;
    const premium = trade.entryPrice;
    const breakeven = type === "call" ? strike + premium : strike - premium;
    const maxLoss = trade.side === "long" ? premium * trade.quantity * 100 : Infinity;
    const maxGain = trade.side === "long" ? Infinity : premium * trade.quantity * 100;
    const roi = (trade.pnl / (premium * trade.quantity * 100)) * 100;

    return {
      strike,
      type,
      premium,
      breakeven,
      maxLoss,
      maxGain,
      roi,
    };
  }, [optionDetails, trade]);

  return (
    <div className="flex-1 rounded-xl bg-[#16161f] border border-white/5 p-4 flex flex-col min-h-[350px]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Options Analysis
        </h4>
        {stats && (
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-gray-500">
              Type: <span className={stats.type === "call" ? "text-green-400" : "text-red-400"}>
                {stats.type.toUpperCase()}
              </span>
            </span>
            <span className="text-gray-500">
              B/E: <span className="text-purple-400">${stats.breakeven.toFixed(2)}</span>
            </span>
            <span className="text-gray-500">
              ROI: <span className={stats.roi >= 0 ? "text-green-400" : "text-red-400"}>
                {stats.roi >= 0 ? "+" : ""}{stats.roi.toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[280px]" style={{ width: "100%", height: "280px" }}>
        <AgCharts options={chartOptions} style={{ width: "100%", height: "100%" }} />
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Strike</p>
            <p className="text-sm font-semibold text-amber-400">${stats.strike}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Premium</p>
            <p className="text-sm font-semibold text-gray-300">${stats.premium.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Max Loss</p>
            <p className="text-sm font-semibold text-red-400">
              {stats.maxLoss === Infinity ? "Unlimited" : `$${stats.maxLoss.toFixed(0)}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase">Max Gain</p>
            <p className="text-sm font-semibold text-green-400">
              {stats.maxGain === Infinity ? "Unlimited" : `$${stats.maxGain.toFixed(0)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
