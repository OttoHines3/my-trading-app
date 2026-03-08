import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function analyzeNewTrade(
  tradeId: string,
  userId: string
): Promise<string> {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (!trade || trade.userId !== userId) {
    throw new Error("Trade not found");
  }

  // Fetch similar trades: same symbol, same side, for this user
  const similarTrades = await prisma.trade.findMany({
    where: {
      userId,
      symbol: trade.symbol,
      side: trade.side,
      id: { not: trade.id },
    },
    orderBy: { exitDate: "desc" },
    take: 20,
  });

  // Calculate metrics for similar trades
  const count = similarTrades.length;
  const wins = similarTrades.filter((t) => t.pnl > 0).length;
  const winRate = count > 0 ? ((wins / count) * 100).toFixed(1) : "N/A";
  const avgPnl =
    count > 0
      ? (similarTrades.reduce((sum, t) => sum + t.pnl, 0) / count).toFixed(2)
      : "N/A";

  const isWin = trade.pnl > 0;
  const holdingTimeMs =
    new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime();
  const holdingTimeHours = (holdingTimeMs / (1000 * 60 * 60)).toFixed(1);

  const prompt = `You are a concise trading coach. Analyze this closed trade in 2-3 short sentences.

TRADE:
- ${trade.symbol} ${trade.side.toUpperCase()} | ${trade.assetClass}
- Entry: $${trade.entryPrice} → Exit: $${trade.exitPrice} | Qty: ${trade.quantity}
- P&L: $${trade.pnl.toFixed(2)} (${isWin ? "WIN" : "LOSS"})
- Holding time: ${holdingTimeHours} hours
- Tags: ${trade.tags.length > 0 ? trade.tags.join(", ") : "none"}
${trade.notes ? `- Notes: ${trade.notes}` : ""}

HISTORY ON ${trade.symbol} ${trade.side.toUpperCase()} (${count} prior trades):
- Win rate: ${winRate}%
- Avg P&L: $${avgPnl}

Provide:
1. How this trade compares to their history on this setup
2. Whether the execution was typical or unusual
3. One specific actionable observation`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const analysis =
    message.content[0].type === "text" ? message.content[0].text : "";

  await prisma.trade.update({
    where: { id: tradeId },
    data: {
      autoNote: analysis,
      autoNoteAt: new Date(),
    },
  });

  return analysis;
}

export async function regenerateAnalysis(
  tradeId: string,
  userId: string
): Promise<string> {
  // Same logic as analyzeNewTrade — always overwrites existing note
  return analyzeNewTrade(tradeId, userId);
}
