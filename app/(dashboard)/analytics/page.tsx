import PerformanceCalendar from "@/components/analytics/performance-calendar";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold capitalize">Analytics</h1>
      <PerformanceCalendar />
    </div>
  );
}
