"use client";

// ── SPY intraday demo data ───────────────────────────────────────────────────

const spyData = [
  { time: "9:30", open: 519.2, close: 520.8, high: 521.4, low: 518.7 },
  { time: "9:45", open: 520.8, close: 520.1, high: 521.2, low: 519.6 },
  { time: "10:00", open: 520.1, close: 521.9, high: 522.5, low: 519.9 },
  { time: "10:15", open: 521.9, close: 521.2, high: 522.8, low: 521.0 },
  { time: "10:30", open: 521.2, close: 522.7, high: 523.2, low: 520.9 },
  { time: "10:45", open: 522.7, close: 521.5, high: 523.1, low: 521.2 },
  { time: "11:00", open: 521.5, close: 523.4, high: 524.0, low: 521.3 },
  { time: "11:15", open: 523.4, close: 522.8, high: 524.2, low: 522.5 },
  { time: "11:30", open: 522.8, close: 524.1, high: 524.8, low: 522.6 },
  { time: "11:45", open: 524.1, close: 523.6, high: 524.9, low: 523.2 },
  { time: "12:00", open: 523.6, close: 524.8, high: 525.4, low: 523.4 },
  { time: "12:15", open: 524.8, close: 524.1, high: 525.2, low: 523.9 },
  { time: "12:30", open: 524.1, close: 524.5, high: 525.0, low: 523.8 },
  { time: "12:45", open: 524.5, close: 524.2, high: 525.1, low: 524.0 },
  { time: "13:00", open: 524.2, close: 524.8, high: 525.3, low: 523.9 },
];

// ── Candlestick chart (SVG) ─────────────────────────────────────────────────

function CandlestickChart() {
  const MIN_PRICE = 518;
  const MAX_PRICE = 526;
  const chartH = 140;
  const paddingY = 8;
  const usableH = chartH - paddingY * 2;

  function priceToY(price: number) {
    return paddingY + ((MAX_PRICE - price) / (MAX_PRICE - MIN_PRICE)) * usableH;
  }

  const candleCount = spyData.length;
  const candleWidth = (100 / candleCount) * 0.6;
  const candleSpacing = 100 / candleCount;

  return (
    <div className="relative w-full" style={{ height: chartH }}>
      <svg
        viewBox={`0 0 100 ${chartH}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-label="SPY intraday candlestick chart"
      >
        {[519, 521, 523, 525].map((price) => (
          <line
            key={price} x1="0" x2="100"
            y1={priceToY(price)} y2={priceToY(price)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.3"
          />
        ))}

        {spyData.map((d, i) => {
          const cx = i * candleSpacing + candleSpacing / 2;
          const bullish = d.close >= d.open;
          const color = bullish ? "#22c55e" : "#ef4444";
          const bodyTop = priceToY(Math.max(d.open, d.close));
          const bodyBottom = priceToY(Math.min(d.open, d.close));
          const bodyH = Math.max(bodyBottom - bodyTop, 0.5);
          const wickTop = priceToY(d.high);
          const wickBottom = priceToY(d.low);

          return (
            <g key={i}>
              <line x1={cx} x2={cx} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth="0.5" />
              <rect x={cx - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyH} fill={color} rx="0.3" />
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
        {[525, 523, 521, 519].map((price) => (
          <span key={price} className="text-right text-[10px] text-gray-500/60 pr-1">
            {price}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── SPY Chart Widget ─────────────────────────────────────────────────────────

export default function SpyChartWidget() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-card p-5 card-glow transition-all duration-200 h-full">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">SPY Intraday</p>
      <CandlestickChart />
      <div className="flex justify-between px-1 text-[10px] text-gray-500/50">
        {["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
