import { Sidebar } from "@/components/dashboard/sidebar"
import { TickerBar } from "@/components/dashboard/ticker-bar"
import { PnLCard, WinRateCard, TradesTodayCard, NextEventCard } from "@/components/dashboard/stat-cards"
import { MarketOverview, EconomicCalendar } from "@/components/dashboard/market-overview"
import { RecentTrades, NewsFeed } from "@/components/dashboard/trades-news"

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main content — offset by collapsed sidebar width (64px = 4rem) */}
      <div className="flex flex-1 flex-col overflow-hidden pl-16">
        {/* Ticker bar */}
        <TickerBar />

        {/* Scrollable content area with dot pattern */}
        <main
          className="flex-1 overflow-y-auto scrollbar-thin dot-pattern"
          aria-label="Trading dashboard"
        >
          <div className="flex flex-col gap-4 p-4 min-h-full">

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  Friday, March 7, 2026 &middot; Market Open
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" aria-hidden="true" />
                    <span className="text-positive font-medium">LIVE</span>
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-card px-3 py-2">
                <span className="text-xs text-muted-foreground">Account</span>
                <span className="text-xs font-bold text-foreground">$28,450.00</span>
                <span className="text-xs font-medium text-positive">+4.8%</span>
              </div>
            </div>

            {/* Row 1 — Stat Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <PnLCard />
              <WinRateCard />
              <TradesTodayCard />
              <NextEventCard />
            </div>

            {/* Row 2 — Market Overview + Economic Calendar */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <MarketOverview />
              </div>
              <div className="lg:col-span-2 min-h-0">
                <EconomicCalendar />
              </div>
            </div>

            {/* Row 3 — Recent Trades + News Feed */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <RecentTrades />
              </div>
              <div className="lg:col-span-2">
                <NewsFeed />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
