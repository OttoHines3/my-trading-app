"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const mockData = [
  { assetClass: "Stocks", pnl: 2400 }, { assetClass: "Options", pnl: 1800 },
  { assetClass: "Futures", pnl: 900 }, { assetClass: "Crypto", pnl: -400 },
];

export default function PnlByAssetClassWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=by-asset-class", { byAssetClass: null as { assetClass: string; pnl: number }[] | null });
  const data = res.byAssetClass?.length ? res.byAssetClass : mockData;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">P&L by Asset Class</p>
      <div className="flex flex-1 items-center gap-4 min-h-0">
        <div className="h-full w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="pnl" nameKey="assetClass" cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" paddingAngle={2}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`$${Number(value).toFixed(2)}`, "P&L"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((item, i) => (
            <div key={item.assetClass} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">{item.assetClass}</span>
              <span className={item.pnl >= 0 ? "text-positive font-medium" : "text-destructive font-medium"}>
                ${item.pnl.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
