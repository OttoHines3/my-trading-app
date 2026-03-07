import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutItem } from "@/types/dashboard";

const DEFAULT_LAYOUT: LayoutItem[] = [
  { widgetId: "total-pnl", colSpan: 3, rowSpan: 1, order: 0 },
  { widgetId: "win-rate", colSpan: 3, rowSpan: 1, order: 1 },
  { widgetId: "trades-today", colSpan: 3, rowSpan: 1, order: 2 },
  { widgetId: "profit-factor", colSpan: 3, rowSpan: 1, order: 3 },
  { widgetId: "cumulative-pnl", colSpan: 8, rowSpan: 2, order: 4 },
  { widgetId: "performance-summary", colSpan: 4, rowSpan: 2, order: 5 },
  { widgetId: "recent-trades", colSpan: 6, rowSpan: 2, order: 6 },
  { widgetId: "news-feed", colSpan: 6, rowSpan: 2, order: 7 },
  { widgetId: "economic-calendar", colSpan: 6, rowSpan: 2, order: 8 },
  { widgetId: "market-overview", colSpan: 6, rowSpan: 2, order: 9 },
];

interface DashboardLayoutState {
  layout: LayoutItem[];
  isEditMode: boolean;
  toggleEditMode: () => void;
  addWidget: (widgetId: string, colSpan: number, rowSpan: number) => void;
  removeWidget: (order: number) => void;
  reorderWidgets: (fromOrder: number, toOrder: number) => void;
  resetToDefault: () => void;
}

export const useDashboardLayout = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      layout: DEFAULT_LAYOUT,
      isEditMode: false,

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      addWidget: (widgetId, colSpan, rowSpan) =>
        set((state) => {
          const maxOrder = state.layout.reduce((max, item) => Math.max(max, item.order), -1);
          return {
            layout: [
              ...state.layout,
              { widgetId, colSpan, rowSpan, order: maxOrder + 1 },
            ],
          };
        }),

      removeWidget: (order) =>
        set((state) => {
          const filtered = state.layout.filter((item) => item.order !== order);
          // Re-index orders to keep them sequential
          const reindexed = filtered
            .sort((a, b) => a.order - b.order)
            .map((item, idx) => ({ ...item, order: idx }));
          return { layout: reindexed };
        }),

      reorderWidgets: (fromOrder, toOrder) =>
        set((state) => {
          const items = [...state.layout].sort((a, b) => a.order - b.order);
          const fromIndex = items.findIndex((item) => item.order === fromOrder);
          const toIndex = items.findIndex((item) => item.order === toOrder);
          if (fromIndex === -1 || toIndex === -1) return state;

          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);

          return {
            layout: items.map((item, idx) => ({ ...item, order: idx })),
          };
        }),

      resetToDefault: () => set({ layout: DEFAULT_LAYOUT }),
    }),
    { name: "dashboard-layout" }
  )
);
