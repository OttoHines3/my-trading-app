"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  todayPnl: number;
  todayPnlPct: number;
}

export function DashboardHeader() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const pnl = stats?.todayPnl ?? 0;
  const pnlFormatted = `$${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">
          {dateStr}
          <span className="ml-2 inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" aria-hidden="true" />
            <span className="text-positive font-medium">LIVE</span>
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-card px-3 py-2">
        <span className="text-xs text-muted-foreground">Today&apos;s P&amp;L</span>
        <span className={`text-xs font-bold ${pnl >= 0 ? "text-positive" : "text-destructive"}`}>
          {pnl >= 0 ? "+" : "-"}{pnlFormatted}
        </span>
      </div>
    </div>
  );
}
