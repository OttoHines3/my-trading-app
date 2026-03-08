"use client";

import { useWidgetFetch } from "@/lib/hooks/use-widget-fetch";

interface DashboardStats {
  winRate?: number;
  wins?: number;
  breakevens?: number;
  losses?: number;
}

const R = 50;
const CX = 60;
const CY = 55;
const STROKE = 8;
const FULL_CIRC = 2 * Math.PI * R;
const HALF_CIRC = Math.PI * R;
const GAP = 5;

interface Segment {
  count: number;
  color: string;
  length: number;
  offset: number;
}

function buildGauge(winners: number, breakevens: number, losers: number): Segment[] {
  const total = winners + breakevens + losers;
  if (total === 0) return [];

  const raw = [
    { count: winners, color: "#22c55e" },
    { count: breakevens, color: "#3b82f6" },
    { count: losers, color: "#ef4444" },
  ].filter((s) => s.count > 0);

  const numGaps = Math.max(0, raw.length - 1);
  const usableArc = HALF_CIRC - numGaps * GAP;

  let offset = 0;
  return raw.map((seg, i) => {
    const length = (seg.count / total) * usableArc;
    const result = { ...seg, length, offset };
    offset += length + (i < raw.length - 1 ? GAP : 0);
    return result;
  });
}

export default function WinRateWidget() {
  const { data } = useWidgetFetch<DashboardStats>("/api/dashboard-stats", {});
  const winRate = data.winRate ?? 67;
  const winners = data.wins ?? 43;
  const breakevens = data.breakevens ?? 2;
  const losers = data.losses ?? 19;

  const segments = buildGauge(winners, breakevens, losers);

  return (
    <div className="relative flex flex-row items-center rounded-xl border border-white/[0.08] bg-card p-5 transition-all duration-200 card-glow h-full">
      {/* Left column: label + percentage */}
      <div className="flex flex-col min-w-0 mr-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Trade win %
        </p>
        <p className="text-2xl font-bold text-white mt-1">
          {winRate}%
        </p>
      </div>

      {/* Right column: gauge + counts */}
      <div className="flex flex-col items-center ml-auto shrink-0">
        <svg viewBox="0 8 120 52" className="w-[100px]" aria-hidden="true">
          {/* Background track */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
            strokeDasharray={`${HALF_CIRC} ${FULL_CIRC}`}
            transform={`rotate(180 ${CX} ${CY})`}
          />
          {/* Colored segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${seg.length} ${FULL_CIRC}`}
              strokeDashoffset={-seg.offset}
              transform={`rotate(180 ${CX} ${CY})`}
              style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
            />
          ))}
        </svg>

        {/* Counts below gauge */}
        <div className="flex items-center justify-between w-[100px] -mt-1 px-0.5">
          <span className="text-[10px] font-bold text-[#22c55e]">{winners}</span>
          {breakevens > 0 && (
            <span className="text-[10px] font-bold text-[#3b82f6]">{breakevens}</span>
          )}
          <span className="text-[10px] font-bold text-[#ef4444]">{losers}</span>
        </div>
      </div>
    </div>
  );
}
