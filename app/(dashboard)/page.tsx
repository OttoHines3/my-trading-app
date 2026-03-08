import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MorningBriefing } from "@/components/dashboard/morning-briefing";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      <MorningBriefing />
      <DashboardHeader />
      <DashboardGrid />
    </div>
  );
}
