"use client";

import { useEffect, useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

const mockData = [
  { metric: "Consistency", score: 75 }, { metric: "Risk Mgmt", score: 82 },
  { metric: "Win Rate", score: 67 }, { metric: "Profit Factor", score: 71 },
  { metric: "Discipline", score: 88 }, { metric: "Growth", score: 60 },
];

export default function TradedeskScoreWidget() {
  const [data, setData] = useState(mockData);
  const [overallScore, setOverallScore] = useState(74);

  useEffect(() => {
    fetch("/api/widget-data?fields=stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.stats) {
          const s = res.stats;
          const newData = [
            { metric: "Consistency", score: Math.min(100, s.dayWinRate ?? 75) },
            { metric: "Risk Mgmt", score: Math.min(100, s.profitFactor ? s.profitFactor * 30 : 82) },
            { metric: "Win Rate", score: s.winRate ?? 67 },
            { metric: "Profit Factor", score: Math.min(100, s.profitFactor ? s.profitFactor * 25 : 71) },
            { metric: "Discipline", score: 88 },
            { metric: "Growth", score: Math.min(100, s.expectancy ? (s.expectancy > 0 ? 70 : 40) : 60) },
          ];
          setData(newData);
          setOverallScore(Math.round(newData.reduce((sum, d) => sum + d.score, 0) / newData.length));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 card-glow transition-all duration-200 h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">TradeDesk Score</p>
        <span className="text-lg font-bold text-primary">{overallScore}/100</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }} />
            <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
