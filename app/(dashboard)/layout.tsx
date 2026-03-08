import { Sidebar } from "@/components/dashboard/sidebar";
import { TickerBar } from "@/components/dashboard/ticker-bar";
import { AGChartsProvider } from "@/components/providers/ag-charts-provider";
import { FloatingAgentButton } from "@/components/agents";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AGChartsProvider>
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
        <FloatingAgentButton />
      </div>
    </AGChartsProvider>
  );
}
