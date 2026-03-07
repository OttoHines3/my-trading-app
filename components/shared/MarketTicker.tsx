"use client";
export default function MarketTicker() {
  const symbols = ["SPY", "QQQ", "AAPL", "TSLA", "BTC", "ETH", "GLD", "IWM"];
  return (
    <div className="overflow-hidden whitespace-nowrap bg-gray-900 py-1 text-xs text-gray-400 border-b border-gray-800">
      <div className="inline-flex animate-[ticker_20s_linear_infinite] gap-8 px-4">
        {[...symbols, ...symbols].map((s, i) => (
          <span key={i}>{s} <span className="text-gray-500">—</span></span>
        ))}
      </div>
    </div>
  );
}
