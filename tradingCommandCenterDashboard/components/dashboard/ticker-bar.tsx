"use client"

import { useEffect, useRef } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

const tickerData = [
  { symbol: "SPY", price: "524.18", change: "+1.24", pct: "+0.24%", up: true },
  { symbol: "QQQ", price: "448.92", change: "+2.87", pct: "+0.64%", up: true },
  { symbol: "DXY", price: "104.32", change: "-0.18", pct: "-0.17%", up: false },
  { symbol: "VIX", price: "14.76", change: "+0.43", pct: "+3.00%", up: true },
  { symbol: "BTC/USD", price: "68,420.50", change: "-324.10", pct: "-0.47%", up: false },
  { symbol: "GLD", price: "218.54", change: "+0.92", pct: "+0.42%", up: true },
  { symbol: "SPY", price: "524.18", change: "+1.24", pct: "+0.24%", up: true },
  { symbol: "QQQ", price: "448.92", change: "+2.87", pct: "+0.64%", up: true },
  { symbol: "DXY", price: "104.32", change: "-0.18", pct: "-0.17%", up: false },
  { symbol: "VIX", price: "14.76", change: "+0.43", pct: "+3.00%", up: true },
  { symbol: "BTC/USD", price: "68,420.50", change: "-324.10", pct: "-0.47%", up: false },
  { symbol: "GLD", price: "218.54", change: "+0.92", pct: "+0.42%", up: true },
]

export function TickerBar() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let pos = 0
    let animId: number
    const speed = 0.5

    function animate() {
      pos -= speed
      const halfWidth = track!.scrollWidth / 2
      if (Math.abs(pos) >= halfWidth) {
        pos = 0
      }
      track!.style.transform = `translateX(${pos}px)`
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div
      className="flex h-8 items-center overflow-hidden border-b border-white/5 bg-card"
      aria-label="Market ticker"
    >
      <div className="flex shrink-0 items-center border-r border-white/10 px-3 h-full">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          LIVE
        </span>
        <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-positive animate-pulse" aria-hidden="true" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={trackRef}
          className="flex items-center gap-0 whitespace-nowrap will-change-transform"
          aria-hidden="true"
        >
          {tickerData.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 border-r border-white/5 px-4 h-8"
            >
              <span className="text-xs font-semibold text-foreground">{item.symbol}</span>
              <span className="text-xs text-foreground/80">{item.price}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  item.up ? "text-positive" : "text-destructive"
                )}
              >
                {item.up ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {item.pct}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
