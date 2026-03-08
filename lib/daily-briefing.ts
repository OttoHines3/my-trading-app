import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { finnhub } from "@/lib/finnhub";

const anthropic = new Anthropic();

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function generateDailyBriefing(
  userId: string
): Promise<{
  content: string;
  vixLevel: number | null;
  spyPrice: number | null;
}> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const dayName = DAY_NAMES[dayOfWeek];

  // --- Fetch trades that exited on this same day of week ---
  const allUserTrades = await prisma.trade.findMany({
    where: { userId },
    select: { exitDate: true, pnl: true, symbol: true, side: true, tags: true },
  });

  const sameDayTrades = allUserTrades.filter(
    (t) => new Date(t.exitDate).getDay() === dayOfWeek
  );
  const sameDayWins = sameDayTrades.filter((t) => t.pnl > 0).length;
  const sameDayWinRate =
    sameDayTrades.length > 0
      ? ((sameDayWins / sameDayTrades.length) * 100).toFixed(1)
      : "N/A";
  const sameDayAvgPnl =
    sameDayTrades.length > 0
      ? (
          sameDayTrades.reduce((sum, t) => sum + t.pnl, 0) /
          sameDayTrades.length
        ).toFixed(2)
      : "N/A";

  // --- Fetch trades from last 7 days ---
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentTrades = allUserTrades.filter(
    (t) => new Date(t.exitDate) >= sevenDaysAgo
  );
  const recentWins = recentTrades.filter((t) => t.pnl > 0).length;
  const recentWinRate =
    recentTrades.length > 0
      ? ((recentWins / recentTrades.length) * 100).toFixed(1)
      : "N/A";
  const recentTotalPnl = recentTrades.reduce((sum, t) => sum + t.pnl, 0);
  const recentAvgPnl =
    recentTrades.length > 0
      ? (recentTotalPnl / recentTrades.length).toFixed(2)
      : "N/A";

  // --- Fetch SPY and VIX quotes ---
  let spyPrice: number | null = null;
  let vixLevel: number | null = null;

  try {
    const [spyQuote, vixQuote] = await Promise.all([
      finnhub.quote("SPY"),
      finnhub.quote("VIX"),
    ]);
    spyPrice = spyQuote.c || null;
    vixLevel = vixQuote.c || null;
  } catch (err) {
    console.error("Failed to fetch market quotes for briefing:", err);
  }

  // --- Build the prompt ---
  const systemPrompt = `You are a concise trading coach AI. Generate a morning briefing for a day trader. Keep it actionable and under 300 words. Use markdown formatting with bold headers for each section. Do not use generic filler — base everything on the data provided.`;

  const userPrompt = `Today is ${dayName}.

TRADER'S ${dayName.toUpperCase()} HISTORY:
- Total ${dayName} trades: ${sameDayTrades.length}
- ${dayName} win rate: ${sameDayWinRate}%
- ${dayName} avg P&L per trade: $${sameDayAvgPnl}

LAST 7 DAYS:
- Trades taken: ${recentTrades.length}
- Win rate: ${recentWinRate}%
- Total P&L: $${recentTotalPnl.toFixed(2)}
- Avg P&L per trade: $${recentAvgPnl}

MARKET CONDITIONS:
- SPY: ${spyPrice !== null ? `$${spyPrice.toFixed(2)}` : "unavailable"}
- VIX: ${vixLevel !== null ? vixLevel.toFixed(2) : "unavailable"}

Generate a morning briefing covering exactly these 5 points:
1. **Should I trade today?** — Based on my ${dayName} historical performance
2. **Market conditions** — VIX assessment and what it means for today's trading
3. **Highest probability setup** — Based on recent winning patterns
4. **Risk warning** — One specific warning based on recent trading behavior
5. **Limits** — Recommended max trades and max daily loss limit for today`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "";

  return { content, vixLevel, spyPrice };
}
