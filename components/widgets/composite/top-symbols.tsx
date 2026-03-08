"use client";

import { cn } from "@/lib/utils";
import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

interface SymbolStat {
  symbol: string;
  pnl: number;
  trades: number;
}

const mockData: SymbolStat[] = [
  { symbol: "TSLA", pnl: 1240, trades: 12 },
  { symbol: "SPY", pnl: 890, trades: 18 },
  { symbol: "QQQ", pnl: 560, trades: 8 },
  { symbol: "AAPL", pnl: 320, trades: 6 },
  { symbol: "NVDA", pnl: -450, trades: 10 },
  { symbol: "AMD", pnl: -280, trades: 5 },
];

export default function TopSymbolsWidget() {
  const { data: res } = useWidgetFetch("/api/widget-data?fields=by-symbol", { bySymbol: null as SymbolStat[] | null });
  const data = res.bySymbol?.length ? res.bySymbol.slice(0, 8) : mockData;

  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-card card-glow transition-all duration-200 h-full">
      <div className="border-b border-white/5 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Top Symbols</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Symbol</th>
              <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Trades</th>
              <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">P&L</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5 text-xs font-bold text-foreground">{item.symbol}</td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{item.trades}</td>
                <td className={cn("px-4 py-2.5 text-right text-xs font-bold", item.pnl >= 0 ? "text-positive" : "text-destructive")}>
                  {item.pnl >= 0 ? "+" : "-"}${Math.abs(item.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
