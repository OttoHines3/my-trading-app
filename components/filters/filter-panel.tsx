"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Calendar as CalendarIcon, Briefcase, Tag, Clock, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradeFilters } from "@/lib/stores/trade-filters";

const CATEGORIES = [
  { id: "general", label: "General", icon: Briefcase },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "time", label: "Day & Time", icon: Clock },
  { id: "strategy", label: "Strategy", icon: Lightbulb },
] as const;

type Category = (typeof CATEGORIES)[number]["id"];

const ASSET_CLASSES = ["stocks", "options", "crypto", "forex", "futures"];
const SIDES = ["long", "short"];
const STATUSES = ["win", "loss", "breakeven"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// General category sub-items with checkbox groups
const GENERAL_ITEMS = [
  { id: "assetClasses", label: "Asset Class", options: ASSET_CLASSES },
  { id: "sides", label: "Side", options: SIDES },
  { id: "statuses", label: "Status", options: STATUSES },
] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterPanel({ isOpen, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("general");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const filters = useTradeFilters();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

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
    <div
      ref={panelRef}
      className="absolute left-0 top-full mt-1 z-50 flex w-[520px] rounded-xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden"
    >
      {/* Left sidebar */}
      <div className="w-44 border-r border-white/10 bg-gray-950 py-2">
        <nav className="space-y-0.5 px-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                <ChevronDown className={cn("ml-auto h-3 w-3 transition-transform", activeCategory === cat.id && "-rotate-90")} />
              </button>
            );
          })}
        </nav>
        <div className="mt-3 border-t border-white/10 pt-3 px-3">
          <button
            onClick={() => filters.resetFilters()}
            className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Reset all
          </button>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-3 overflow-y-auto max-h-[350px]">
          {activeCategory === "general" && (
            <div className="space-y-1">
              {GENERAL_ITEMS.map((item) => {
                const isExpanded = expandedItem === item.id;
                const filterKey = item.id as "assetClasses" | "sides" | "statuses";
                const activeValues = filters[filterKey] as string[];
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-white/5 transition-colors"
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        activeValues.length > 0
                          ? "border-primary bg-primary text-white"
                          : "border-white/20"
                      )}>
                        {activeValues.length > 0 && (
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {item.label}
                      {activeValues.length > 0 && (
                        <span className="ml-auto text-[10px] text-primary">{activeValues.length}</span>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-6 space-y-0.5 pb-1">
                        {item.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleArrayItem(filterKey, opt)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <div className={cn(
                              "flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors",
                              activeValues.includes(opt)
                                ? "border-primary bg-primary text-white"
                                : "border-white/20"
                            )}>
                              {activeValues.includes(opt) && (
                                <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="capitalize">{opt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeCategory === "tags" && (
            <div className="p-1">
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
            <div className="space-y-4 p-1">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Day of Week</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => toggleArrayItem("daysOfWeek", i)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
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
                <div className="flex flex-wrap gap-1">
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
            <div className="p-1">
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-3 py-2.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
