"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Calendar,
  Newspaper,
  Star,
  Brain,
  Briefcase,
  ChevronRight,
  TrendingUp,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: ListOrdered, label: "Trade View", href: "/trades" },
  { icon: BookOpen, label: "Journal", href: "/journal" },
  { icon: BarChart2, label: "Analytics", href: "/reports" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Newspaper, label: "News", href: "/news" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio" },
  { icon: Star, label: "Watchlist", href: "/watchlist" },
  { icon: Brain, label: "Psychology", href: "/psychology" },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-in-out",
        "border-r border-white/5",
        expanded ? "w-60" : "w-16"
      )}
      style={{ background: "linear-gradient(180deg, #0e0e16 0%, #0a0a12 100%)" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-white/5 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span
          className={cn(
            "ml-3 text-sm font-semibold text-foreground whitespace-nowrap transition-all duration-200",
            expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
          )}
        >
          TradeDesk
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex h-9 w-full items-center rounded-lg px-2 text-left transition-all duration-150",
                "hover:bg-white/5",
                isActive
                  ? "text-foreground bg-white/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "ml-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                  expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Expand indicator */}
      <div className="flex h-10 items-center justify-center border-t border-white/5">
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-300",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
}
