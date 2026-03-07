import { StatCardsRow } from "@/components/dashboard/stat-cards";
import { MarketOverview, EconomicCalendar } from "@/components/dashboard/market-overview";
import { RecentTrades, NewsFeed } from "@/components/dashboard/trades-news";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      <DashboardHeader />

      {/* Row 1 — Stat Cards */}
      <StatCardsRow />

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
  );
}
