"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PerformanceTab } from "./performance-tab";
import { OverviewTab } from "./overview-tab";
import { CompareTab } from "./compare-tab";
import { CalendarTab } from "./calendar-tab";

const TABS = [
  { id: "performance", label: "Performance" },
  { id: "overview", label: "Overview" },
  { id: "compare", label: "Compare" },
  { id: "calendar", label: "Calendar" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function ReportsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("performance");

  return (
    <div>
      <div className="flex gap-1 border-b border-white/5 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "performance" && <PerformanceTab />}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "compare" && <CompareTab />}
      {activeTab === "calendar" && <CalendarTab />}
    </div>
  );
}
