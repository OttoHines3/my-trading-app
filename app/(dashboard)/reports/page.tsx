import { ReportsHeader } from "@/components/reports/reports-header";
import { ReportsTabs } from "@/components/reports/reports-tabs";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-full">
      <ReportsHeader />
      <ReportsTabs />
    </div>
  );
}
