export type TradeSide = "long" | "short";
export type AssetClass = "stocks" | "options" | "crypto" | "forex" | "futures";

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  side: TradeSide;
  assetClass: AssetClass;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string;
  exitDate: string | null;
  pnl: number | null;
  fees: number;
  notes: string | null;
  tags: string[];
  screenshots: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  notes: string | null;
  targetPrice: number | null;
  alertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  marketBias: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
