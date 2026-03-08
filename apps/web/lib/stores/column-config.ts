import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortField?: string;
}

export const ALL_COLUMNS: ColumnDef[] = [
  { key: "checkbox", label: "", align: "center" },
  { key: "entryDate", label: "Date", sortField: "entryDate" },
  { key: "symbol", label: "Symbol", sortField: "symbol" },
  { key: "side", label: "Side" },
  { key: "assetClass", label: "Asset Class" },
  { key: "quantity", label: "Qty", align: "right" },
  { key: "entryPrice", label: "Entry", align: "right", sortField: "entryPrice" },
  { key: "exitPrice", label: "Exit", align: "right", sortField: "exitPrice" },
  { key: "pnl", label: "P&L", align: "right", sortField: "pnl" },
  { key: "roi", label: "ROI", align: "right" },
  { key: "duration", label: "Duration" },
  { key: "status", label: "Status", align: "center" },
  { key: "exitDate", label: "Close Date", sortField: "exitDate" },
  { key: "strategy", label: "Strategy" },
  { key: "commissions", label: "Commissions", align: "right" },
  { key: "tags", label: "Tags" },
  { key: "notes", label: "Notes" },
  { key: "reviewed", label: "Reviewed", align: "center" },
  { key: "tradeRating", label: "Rating", align: "center" },
];

const DEFAULT_VISIBLE = [
  "checkbox",
  "entryDate",
  "symbol",
  "side",
  "quantity",
  "entryPrice",
  "exitPrice",
  "pnl",
  "roi",
  "duration",
  "status",
];

interface ColumnConfigState {
  visibleKeys: string[];
  setVisibleKeys: (keys: string[]) => void;
  resetToDefault: () => void;
}

export const useColumnConfig = create<ColumnConfigState>()(
  persist(
    (set) => ({
      visibleKeys: DEFAULT_VISIBLE,
      setVisibleKeys: (keys) => set({ visibleKeys: keys }),
      resetToDefault: () => set({ visibleKeys: DEFAULT_VISIBLE }),
    }),
    { name: "trade-column-config" }
  )
);

export { DEFAULT_VISIBLE };
