import Link from "next/link";

export default function JournalPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trade Journal</h1>
        <Link href="/journal/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700">
          + Add Trade
        </Link>
      </div>
      <p className="text-gray-400">No trades yet. Add your first trade to get started.</p>
    </div>
  );
}
