"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BarChart2, Calendar, Newspaper, Star, Brain, List } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/reports", label: "Analytics", icon: BarChart2 },
  { href: "/trades", label: "Trades", icon: List },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/psychology", label: "Psychology", icon: Brain },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-col border-r border-gray-800 bg-gray-950 py-6">
      <div className="px-6 mb-8">
        <span className="text-xl font-bold tracking-tight text-white">Tradzella</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
