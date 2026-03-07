export type TradeSide = "long" | "short";
export type AssetClass = "stocks" | "options" | "crypto" | "forex" | "futures";

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  assetClass: AssetClass;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: string;
  exitDate: string;
  pnl: number;
  notes?: string;
  tags?: string[];
  strategy?: string;
  commissions?: number;
  reviewed?: boolean;
  tradeRating?: number;
  screenshotUrl?: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  notes?: string;
  alertPrice?: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;       // 1-5
  notes: string;
  marketBias?: string;
}
