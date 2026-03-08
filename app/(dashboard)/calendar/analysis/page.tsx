"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Loader2, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalysisPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-4 min-h-full max-w-4xl">
          <div className="rounded-xl border border-white/5 bg-card p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <AnalysisPage />
    </Suspense>
  );
}

function AnalysisPage() {
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const name = searchParams.get("name") ?? "";
  const impact = searchParams.get("impact") ?? "";
  const forecast = searchParams.get("forecast") ?? "";
  const previous = searchParams.get("previous") ?? "";
  const time = searchParams.get("time") ?? "";
  const day = searchParams.get("day") ?? "";

  useEffect(() => {
    if (!name) {
      setError("No event specified");
      setLoading(false);
      return;
    }

    fetch("/api/calendar/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, impact, forecast, previous, time, day }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setAnalysis(data.analysis);
      })
      .catch(() => setError("Failed to fetch analysis"))
      .finally(() => setLoading(false));
  }, [name, impact, forecast, previous, time, day]);

  return (
    <div className="flex flex-col gap-6 p-4 min-h-full max-w-4xl">
      {/* Back link */}
      <Link
        href="/calendar"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Calendar
      </Link>

      {/* Event header */}
      <div className="rounded-xl border border-white/5 bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">AI Market Analysis</h1>
            </div>
            <h2 className="text-base font-semibold text-foreground mb-3">{name}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {day} {time}
              </span>
              {impact && (
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    impact === "HIGH"
                      ? "bg-destructive/20 text-destructive"
                      : impact === "MED"
                      ? "bg-amber-400/20 text-amber-400"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {impact}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Forecast</p>
              <p className="text-sm font-semibold text-foreground">{forecast || "\u2014"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Previous</p>
              <p className="text-sm font-semibold text-muted-foreground">{previous || "\u2014"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis content */}
      {loading ? (
        <div className="rounded-xl border border-white/5 bg-card p-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing economic release...</p>
            <p className="text-xs text-muted-foreground/60">This may take a few seconds</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <p className="text-xs text-muted-foreground">
              Make sure the <code className="rounded bg-white/10 px-1.5 py-0.5">ANTHROPIC_API_KEY</code> environment variable is set.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-card p-6">
          <MarkdownRenderer content={analysis ?? ""} />
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-foreground mt-6 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2 py-1.5 ml-2">
            <span className="text-xs font-semibold text-primary whitespace-nowrap">{match[1]}:</span>
            <span className="text-xs text-muted-foreground">{match[2]}</span>
          </div>
        );
      } else {
        elements.push(<p key={i} className="text-xs text-muted-foreground ml-2 py-0.5">{line.slice(2)}</p>);
      }
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2 py-0.5 ml-2">
          <span className="text-primary mt-1.5">&#8226;</span>
          <span className="text-xs text-muted-foreground">{line.slice(2)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-xs leading-relaxed text-muted-foreground">{line}</p>
      );
    }
  }

  return <>{elements}</>;
}
