"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "tags", label: "Tags" },
  { id: "time", label: "Day & Time" },
  { id: "strategy", label: "Strategy" },
] as const;

type Category = (typeof CATEGORIES)[number]["id"];

const ASSET_CLASSES = ["stocks", "options", "crypto", "forex", "futures"];
const SIDES = ["long", "short"];
const STATUSES = ["win", "loss", "breakeven"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterPanel({ isOpen, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("general");
  const filters = useTradeFilters();

  if (!isOpen) return null;

  const toggleArrayItem = <K extends "assetClasses" | "sides" | "statuses" | "daysOfWeek" | "hoursOfDay">(
    key: K,
    value: (typeof filters)[K][number]
  ) => {
    const current = filters[key] as unknown[];
    if (current.includes(value)) {
      filters.setFilter(key, current.filter((v) => v !== value) as (typeof filters)[K]);
    } else {
      filters.setFilter(key, [...current, value] as (typeof filters)[K]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[70vh] w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left sidebar */}
        <div className="w-44 border-r border-white/10 bg-gray-950 p-3">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          </div>
          <nav className="space-y-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </nav>
          <div className="mt-4 border-t border-white/10 pt-3 px-1">
            <button
              onClick={() => { filters.resetFilters(); onClose(); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset all
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground capitalize">{activeCategory === "time" ? "Day & Time" : activeCategory}</h3>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/10 transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {activeCategory === "general" && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Asset Class</label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_CLASSES.map((ac) => (
                    <button
                      key={ac}
                      onClick={() => toggleArrayItem("assetClasses", ac)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        filters.assetClasses.includes(ac)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {ac}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Side</label>
                <div className="flex gap-2">
                  {SIDES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleArrayItem("sides", s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        filters.sides.includes(s)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Status</label>
                <div className="flex gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleArrayItem("statuses", s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        filters.statuses.includes(s)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === "tags" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
              <input
                type="text"
                value={filters.tags.join(", ")}
                onChange={(e) => filters.setFilter("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                placeholder="e.g. momentum, scalp, earnings"
                className="w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-xs text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
              />
            </div>
          )}

          {activeCategory === "time" && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Day of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleArrayItem("daysOfWeek", i)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        filters.daysOfWeek.includes(i)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Hour of Day</label>
                <div className="flex flex-wrap gap-1.5">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => toggleArrayItem("hoursOfDay", h)}
                      className={cn(
                        "rounded border px-2 py-1 text-xs font-medium transition-colors min-w-[2rem] text-center",
                        filters.hoursOfDay.includes(h)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === "strategy" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Strategies (comma-separated)</label>
              <input
                type="text"
                value={filters.strategies.join(", ")}
                onChange={(e) => filters.setFilter("strategies", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                placeholder="e.g. breakout, reversal, trend"
                className="w-full rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-xs text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
