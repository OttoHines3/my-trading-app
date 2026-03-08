"use client";
export default function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-950 px-6">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
        <span className="text-xs text-gray-400">Market Open</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">SPY —</span>
        <span className="text-sm text-gray-400">QQQ —</span>
        <span className="text-sm text-gray-400">BTC —</span>
      </div>
    </header>
  );
}
