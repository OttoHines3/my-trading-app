import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TradingAccount {
  id: string;
  name: string;
  broker: string; // "tradestation" | "generic" | etc.
  createdAt: string;
  tradeCount: number;
}

interface TradingAccountsState {
  accounts: TradingAccount[];
  /** Selected account IDs — empty means "All accounts" */
  selectedIds: string[];
  addAccount: (account: Omit<TradingAccount, "id" | "createdAt">) => string;
  removeAccount: (id: string) => void;
  renameAccount: (id: string, name: string) => void;
  updateTradeCount: (id: string, count: number) => void;
  toggleAccount: (id: string) => void;
  selectAll: () => void;
  selectOnly: (id: string) => void;
}

export const useTradingAccounts = create<TradingAccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedIds: [],

      addAccount: (account) => {
        const id = `acct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newAccount: TradingAccount = {
          ...account,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ accounts: [...s.accounts, newAccount] }));
        return id;
      },

      removeAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          selectedIds: s.selectedIds.filter((sid) => sid !== id),
        }));
      },

      renameAccount: (id, name) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, name } : a)),
        }));
      },

      updateTradeCount: (id, count) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, tradeCount: count } : a)),
        }));
      },

      toggleAccount: (id) => {
        set((s) => {
          const isSelected = s.selectedIds.includes(id);
          const newIds = isSelected
            ? s.selectedIds.filter((sid) => sid !== id)
            : [...s.selectedIds, id];
          return { selectedIds: newIds };
        });
      },

      selectAll: () => set({ selectedIds: [] }),

      selectOnly: (id) => set({ selectedIds: [id] }),
    }),
    {
      name: "trading-accounts-v1",
    }
  )
);
