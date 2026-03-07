export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Total P&L", "Win Rate", "Trades This Week", "Open Positions"].map((label) => (
          <div key={label} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
