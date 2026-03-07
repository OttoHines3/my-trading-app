import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TradeFilters {
  assetClasses: string[];
  sides: string[];
  symbols: string[];
  statuses: string[];  // "win" | "loss" | "breakeven"
  dateFrom: string | null;
  dateTo: string | null;
  tags: string[];
  strategies: string[];
  daysOfWeek: number[];  // 0=Sun..6=Sat
  hoursOfDay: number[];  // 0-23
}

const DEFAULT_FILTERS: TradeFilters = {
  assetClasses: [],
  sides: [],
  symbols: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  tags: [],
  strategies: [],
  daysOfWeek: [],
  hoursOfDay: [],
};

interface TradeFilterState extends TradeFilters {
  setFilter: <K extends keyof TradeFilters>(key: K, value: TradeFilters[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  toQueryString: () => string;
}

export const useTradeFilters = create<TradeFilterState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FILTERS,

      setFilter: (key, value) => set({ [key]: value }),

      resetFilters: () => set(DEFAULT_FILTERS),

      hasActiveFilters: () => {
        const state = get();
        return (
          state.assetClasses.length > 0 ||
          state.sides.length > 0 ||
          state.symbols.length > 0 ||
          state.statuses.length > 0 ||
          state.dateFrom !== null ||
          state.dateTo !== null ||
          state.tags.length > 0 ||
          state.strategies.length > 0 ||
          state.daysOfWeek.length > 0 ||
          state.hoursOfDay.length > 0
        );
      },

      toQueryString: () => {
        const state = get();
        const params = new URLSearchParams();
        if (state.assetClasses.length) params.set("assetClasses", state.assetClasses.join(","));
        if (state.sides.length) params.set("sides", state.sides.join(","));
        if (state.symbols.length) params.set("symbols", state.symbols.join(","));
        if (state.statuses.length) params.set("statuses", state.statuses.join(","));
        if (state.dateFrom) params.set("dateFrom", state.dateFrom);
        if (state.dateTo) params.set("dateTo", state.dateTo);
        if (state.tags.length) params.set("tags", state.tags.join(","));
        if (state.strategies.length) params.set("strategies", state.strategies.join(","));
        if (state.daysOfWeek.length) params.set("daysOfWeek", state.daysOfWeek.join(","));
        if (state.hoursOfDay.length) params.set("hoursOfDay", state.hoursOfDay.join(","));
        return params.toString();
      },
    }),
    { name: "trade-filters" }
  )
);
