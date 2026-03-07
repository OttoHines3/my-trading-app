"use client";

import { FilterBar } from "@/components/filters/filter-bar";

export function ReportsHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-lg font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground">Analyze your trading performance</p>
      </div>
      <FilterBar />
    </div>
  );
}
