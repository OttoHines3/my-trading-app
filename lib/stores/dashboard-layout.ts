import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutItem, DashboardTemplate } from "@/types/dashboard";

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
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0 || version === 1) {
          // v1 had flat { layout, isEditMode }
          const old = persisted as { layout?: LayoutItem[]; isEditMode?: boolean };
          const migratedTemplate: DashboardTemplate = {
            id: "default",
            name: "Default",
            layout: old.layout ?? DEFAULT_LAYOUT,
            createdAt: new Date().toISOString(),
          };
          return {
            templates: [migratedTemplate],
            activeTemplateId: "default",
            isEditMode: false,
          };
        }
        // v2 data — validate templates aren't corrupted
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
