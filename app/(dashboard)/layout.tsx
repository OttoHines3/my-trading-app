import { Sidebar } from "@/components/dashboard/sidebar";
import { TickerBar } from "@/components/dashboard/ticker-bar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-16">
        <TickerBar />
        <main
          className="flex-1 overflow-y-auto scrollbar-thin dot-pattern"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
