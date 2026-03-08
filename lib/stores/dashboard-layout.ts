import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutItem, DashboardTemplate } from "@/types/dashboard";

const DEFAULT_LAYOUT: LayoutItem[] = [
  // Top row: 5 StatCards (colSpan 1 in the 5-col top grid, ~120px)
  { widgetId: "total-pnl", colSpan: 1, rowSpan: 1, order: 0 },
  { widgetId: "win-rate", colSpan: 1, rowSpan: 1, order: 1 },
  { widgetId: "profit-factor", colSpan: 1, rowSpan: 1, order: 2 },
  { widgetId: "day-win-rate", colSpan: 1, rowSpan: 1, order: 3 },
  { widgetId: "expectancy", colSpan: 1, rowSpan: 1, order: 4 },
  // Bottom section: Panels (4 cols, 2 rows ≈ 320px) — 3 per row
  { widgetId: "tradedesk-score", colSpan: 4, rowSpan: 2, order: 5 },
  { widgetId: "cumulative-pnl", colSpan: 4, rowSpan: 2, order: 6 },
  { widgetId: "daily-pnl-bars", colSpan: 4, rowSpan: 2, order: 7 },
  { widgetId: "recent-trades", colSpan: 4, rowSpan: 2, order: 8 },
  { widgetId: "news-feed", colSpan: 4, rowSpan: 2, order: 9 },
  { widgetId: "top-symbols", colSpan: 4, rowSpan: 2, order: 10 },
  // Board row: calendar (6 cols, 3 rows ≈ 500px) + panel beside it
  { widgetId: "performance-calendar", colSpan: 6, rowSpan: 3, order: 11 },
  { widgetId: "performance-summary", colSpan: 6, rowSpan: 3, order: 12 },
  { widgetId: "economic-calendar", colSpan: 4, rowSpan: 2, order: 13 },
];

function createDefaultTemplate(): DashboardTemplate {
  return {
    id: "default",
    name: "Default",
    layout: DEFAULT_LAYOUT,
    createdAt: new Date().toISOString(),
  };
}

interface DashboardLayoutState {
  templates: DashboardTemplate[];
  activeTemplateId: string;
  isEditMode: boolean;

  // Getters
  getActiveTemplate: () => DashboardTemplate;
  getActiveLayout: () => LayoutItem[];

  // Template CRUD
  createTemplate: (name: string) => void;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, name: string) => void;
  switchTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;

  // Widget ops (on active template)
  toggleEditMode: () => void;
  addWidget: (widgetId: string, colSpan: number, rowSpan: number) => void;
  removeWidget: (order: number) => void;
  reorderWidgets: (fromOrder: number, toOrder: number) => void;
  resetToDefault: () => void;
}

export const useDashboardLayout = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      templates: [createDefaultTemplate()],
      activeTemplateId: "default",
      isEditMode: false,

      getActiveTemplate: () => {
        const state = get();
        return state.templates.find((t) => t.id === state.activeTemplateId) ?? state.templates[0];
      },

      getActiveLayout: () => {
        return get().getActiveTemplate().layout;
      },

      createTemplate: (name) =>
        set((state) => {
          const newTemplate: DashboardTemplate = {
            id: crypto.randomUUID(),
            name,
            layout: [...DEFAULT_LAYOUT],
            createdAt: new Date().toISOString(),
          };
          return {
            templates: [...state.templates, newTemplate],
            activeTemplateId: newTemplate.id,
          };
        }),

      deleteTemplate: (id) =>
        set((state) => {
          if (state.templates.length <= 1) return state;
          const filtered = state.templates.filter((t) => t.id !== id);
          return {
            templates: filtered,
            activeTemplateId: state.activeTemplateId === id ? filtered[0].id : state.activeTemplateId,
          };
        }),

      renameTemplate: (id, name) =>
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? { ...t, name } : t)),
        })),

      switchTemplate: (id) => set({ activeTemplateId: id }),

      duplicateTemplate: (id) =>
        set((state) => {
          const source = state.templates.find((t) => t.id === id);
          if (!source) return state;
          const dup: DashboardTemplate = {
            id: crypto.randomUUID(),
            name: `${source.name} (copy)`,
            layout: source.layout.map((l) => ({ ...l })),
            createdAt: new Date().toISOString(),
          };
          return {
            templates: [...state.templates, dup],
            activeTemplateId: dup.id,
          };
        }),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      addWidget: (widgetId, colSpan, rowSpan) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === state.activeTemplateId);
          if (!template) return state;
          const maxOrder = template.layout.reduce((max, item) => Math.max(max, item.order), -1);
          return {
            templates: state.templates.map((t) =>
              t.id === state.activeTemplateId
                ? { ...t, layout: [...t.layout, { widgetId, colSpan, rowSpan, order: maxOrder + 1 }] }
                : t
            ),
          };
        }),

      removeWidget: (order) =>
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id !== state.activeTemplateId) return t;
            const filtered = t.layout.filter((item) => item.order !== order);
            const reindexed = filtered.sort((a, b) => a.order - b.order).map((item, idx) => ({ ...item, order: idx }));
            return { ...t, layout: reindexed };
          }),
        })),

      reorderWidgets: (fromOrder, toOrder) =>
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id !== state.activeTemplateId) return t;
            const items = [...t.layout].sort((a, b) => a.order - b.order);
            const fromIndex = items.findIndex((item) => item.order === fromOrder);
            const toIndex = items.findIndex((item) => item.order === toOrder);
            if (fromIndex === -1 || toIndex === -1) return t;
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            return { ...t, layout: items.map((item, idx) => ({ ...item, order: idx })) };
          }),
        })),

      resetToDefault: () =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === state.activeTemplateId ? { ...t, layout: [...DEFAULT_LAYOUT] } : t
          ),
        })),
    }),
    {
      name: "dashboard-layout",
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        if (version <= 1) {
          return {
            templates: [createDefaultTemplate()],
            activeTemplateId: "default",
            isEditMode: false,
          };
        }
        // v2/v3/v4 → v5: standardize widget sizes (StatCard / Panel / Board)
        if (version >= 2 && version <= 4) {
          const state = persisted as Record<string, unknown>;
          const templates = Array.isArray(state.templates) ? state.templates as DashboardTemplate[] : [];
          const updated = templates.map((t) => {
            if (t.id === "default") {
              return { ...t, layout: [...DEFAULT_LAYOUT] };
            }
            return t;
          });
          return {
            ...state,
            templates: updated.length > 0 ? updated : [createDefaultTemplate()],
            isEditMode: false,
          } as DashboardLayoutState;
        }

        // v5 data — validate templates aren't corrupted
        const state = persisted as Record<string, unknown>;
        const templates = Array.isArray(state.templates) && state.templates.length > 0
          ? state.templates as DashboardTemplate[]
          : [createDefaultTemplate()];
        const activeTemplateId =
          typeof state.activeTemplateId === "string" && templates.some((t) => t.id === state.activeTemplateId)
            ? (state.activeTemplateId as string)
            : templates[0].id;
        return {
          ...state,
          templates,
          activeTemplateId,
          isEditMode: false,
        } as DashboardLayoutState;
      },
    }
  )
);
