import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DisplayMode =
  | "dollar"
  | "percentage"
  | "privacy"
  | "r-multiple"
  | "ticks"
  | "pips"
  | "points";

interface DisplayModeState {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
}

export const useDisplayMode = create<DisplayModeState>()(
  persist(
    (set) => ({
      mode: "dollar",
      setMode: (mode) => set({ mode }),
    }),
    { name: "display-mode" }
  )
);
