"use client";

import { useState, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";
import { FilterPanel } from "./filter-panel";
import { DateRangePicker } from "./date-range-picker";

export function FilterBar() {
  const [showPanel, setShowPanel] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const filters = useTradeFilters();

  useEffect(() => setHydrated(true), []);

  const hasActive = hydrated && filters.hasActiveFilters();

  const activeCount = hydrated
    ? [
        filters.assetClasses.length,
        filters.sides.length,
        filters.symbols.length,
        filters.statuses.length,
        filters.tags.length,
        filters.strategies.length,
        filters.daysOfWeek.length,
        filters.hoursOfDay.length,
      ].filter((n) => n > 0).length
    : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Filters dropdown container */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            hasActive
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 ml-0.5 transition-transform", showPanel && "rotate-180")} />
        </button>
        <FilterPanel isOpen={showPanel} onClose={() => setShowPanel(false)} />
      </div>

      {/* Date range picker */}
      <DateRangePicker
        dateFrom={hydrated ? filters.dateFrom : null}
        dateTo={hydrated ? filters.dateTo : null}
        onDateFromChange={(val) => filters.setFilter("dateFrom", val)}
        onDateToChange={(val) => filters.setFilter("dateTo", val)}
      />

      {hasActive && (
        <button
          onClick={() => filters.resetFilters()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
