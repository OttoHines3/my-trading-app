"use client";

import { useEffect, useState } from "react";
import { Settings, RotateCcw } from "lucide-react";
import { DisplayModeSwitcher } from "@/components/ui/display-mode-switcher";
import { useDisplayMode } from "@/lib/stores/display-mode";
import { useDashboardLayout } from "@/lib/stores/dashboard-layout";
import { formatPnl } from "@/lib/utils/format-pnl";
import { cn } from "@/lib/utils";

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
  const { mode } = useDisplayMode();
  const pnlDisplay = formatPnl({ pnl, mode });
  const { isEditMode, toggleEditMode, resetToDefault } = useDashboardLayout();

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
      <div className="flex items-center gap-3">
        <button
          onClick={toggleEditMode}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
            isEditMode
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/5 bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          {isEditMode ? "Done Editing" : "Edit Dashboard"}
        </button>
        {isEditMode && (
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
        <DisplayModeSwitcher />
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-card px-3 py-2">
          <span className="text-xs text-muted-foreground">Today&apos;s P&amp;L</span>
          <span className={`text-xs font-bold ${mode === "privacy" ? "text-muted-foreground" : pnl >= 0 ? "text-positive" : "text-destructive"}`}>
            {mode === "privacy" ? pnlDisplay : pnl >= 0 ? `+${pnlDisplay}` : pnlDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
