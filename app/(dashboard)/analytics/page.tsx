import { BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold capitalize">Analytics</h1>
      <div className="rounded-xl border border-white/5 bg-card p-12 card-glow">
        <div className="flex flex-col items-center gap-3">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Analytics charts coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
