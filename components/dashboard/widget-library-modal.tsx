"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWidgetsByCategory } from "@/lib/widgets/registry";
import { useDashboardLayout } from "@/lib/stores/dashboard-layout";
import type { WidgetCategory } from "@/types/dashboard";

const categoryLabels: Record<WidgetCategory, string> = {
  stats: "Statistics",
  charts: "Charts",
  composite: "Composite",
  calendar: "Calendar",
  market: "Market",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetLibraryModal({ isOpen, onClose }: Props) {
  const addWidget = useDashboardLayout((s) => s.addWidget);
  const activeLayout = useDashboardLayout((s) => {
    const template = s.templates.find((t) => t.id === s.activeTemplateId) ?? s.templates[0];
    return template?.layout ?? [];
  });
  const activeWidgetIds = new Set(activeLayout.map((item) => item.widgetId));
  const widgetsByCategory = getWidgetsByCategory();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Widget Library</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {(Object.entries(widgetsByCategory) as [WidgetCategory, typeof widgetsByCategory[WidgetCategory]][]).map(([category, widgets]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {categoryLabels[category]}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {widgets.map((widget) => {
                const isActive = activeWidgetIds.has(widget.id);
                return (
                  <button
                    key={widget.id}
                    disabled={isActive}
                    onClick={() => {
                      addWidget(widget.id, widget.defaultColSpan, widget.defaultRowSpan);
                      onClose();
                    }}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border border-white/5 p-3 text-left transition-all",
                      isActive
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:border-white/20 hover:bg-white/5 cursor-pointer"
                    )}
                  >
                    <span className="text-sm font-medium text-foreground">{widget.name}</span>
                    <span className="text-xs text-muted-foreground">{widget.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
