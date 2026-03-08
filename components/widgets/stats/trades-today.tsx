"use client";

import { BarChart, Bar, ResponsiveContainer, Tooltip } from "recharts";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

const defaultBarData = [
  { v: 1 }, { v: 0 }, { v: 1 }, { v: 1 }, { v: 0 },
  { v: 1 }, { v: 0 }, { v: 0 }, { v: 1 }, { v: 0 },
  { v: 0 }, { v: 1 }, { v: 0 }, { v: 0 }, { v: 1 },
];

interface DashboardStats {
  tradesToday?: number;
  tradeWinsToday?: number;
  tradeLossesToday?: number;
}

export default function TradesTodayWidget() {
  const { data } = useWidgetFetch<DashboardStats>("/api/dashboard-stats", {});
  const tradesToday = data.tradesToday ?? 4;
  const winsToday = data.tradeWinsToday ?? 3;
  const lossesToday = data.tradeLossesToday ?? 1;

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Trades Today</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-bold text-white">{tradesToday}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {winsToday} winners &middot; {lossesToday} loser{lossesToday !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={defaultBarData} barCategoryGap={2}>
              <Bar dataKey="v" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Tooltip content={() => null} cursor={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
