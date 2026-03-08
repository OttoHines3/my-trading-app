import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
import path from "node:path";

// Load .env.local
config({ path: path.join(process.cwd(), ".env.local") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const USER_ID = "local-dev-user";

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  await prisma.trade.deleteMany({ where: { userId: USER_ID } });
  await prisma.watchlistItem.deleteMany({ where: { userId: USER_ID } });
  await prisma.journalEntry.deleteMany({ where: { userId: USER_ID } });

  // ─────────────────────────────────────────────────────────────────────────
  // TRADES - Mix of winners, losers, different asset classes
  // ─────────────────────────────────────────────────────────────────────────
  const trades = await prisma.trade.createMany({
    data: [
      // Stock trades
      {
        userId: USER_ID,
        symbol: "AAPL",
        side: "long",
        assetClass: "stocks",
        entryPrice: 178.5,
        exitPrice: 185.2,
        quantity: 100,
        entryDate: new Date("2024-12-02T09:35:00"),
        exitDate: new Date("2024-12-05T14:22:00"),
        pnl: 670,
        notes: "Bought the dip after earnings pullback. Sold into strength.",
        tags: ["swing", "earnings-play", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "NVDA",
        side: "long",
        assetClass: "stocks",
        entryPrice: 142.3,
        exitPrice: 138.1,
        quantity: 50,
        entryDate: new Date("2024-12-09T10:15:00"),
        exitDate: new Date("2024-12-10T11:30:00"),
        pnl: -210,
        notes: "Stopped out. Should have waited for better entry.",
        tags: ["day-trade", "loser", "revenge-trade"],
      },
      {
        userId: USER_ID,
        symbol: "TSLA",
        side: "long",
        assetClass: "stocks",
        entryPrice: 245.0,
        exitPrice: 268.5,
        quantity: 40,
        entryDate: new Date("2024-12-12T09:45:00"),
        exitDate: new Date("2024-12-18T15:50:00"),
        pnl: 940,
        notes: "Rode the momentum after breakout above 250.",
        tags: ["swing", "momentum", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "AMD",
        side: "short",
        assetClass: "stocks",
        entryPrice: 148.2,
        exitPrice: 145.6,
        quantity: 75,
        entryDate: new Date("2024-12-19T13:20:00"),
        exitDate: new Date("2024-12-19T15:45:00"),
        pnl: 195,
        notes: "Shorted rejection at resistance. Clean setup.",
        tags: ["day-trade", "short", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "META",
        side: "long",
        assetClass: "stocks",
        entryPrice: 585.0,
        exitPrice: 592.3,
        quantity: 20,
        entryDate: new Date("2024-12-20T10:00:00"),
        exitDate: new Date("2024-12-23T14:30:00"),
        pnl: 146,
        notes: "Small position, played the Santa rally.",
        tags: ["swing", "winner"],
      },
      // Options trades
      {
        userId: USER_ID,
        symbol: "SPY 480C 12/29",
        side: "long",
        assetClass: "options",
        entryPrice: 2.45,
        exitPrice: 4.8,
        quantity: 10,
        entryDate: new Date("2024-12-26T09:32:00"),
        exitDate: new Date("2024-12-27T11:15:00"),
        pnl: 2350,
        notes: "Year-end rally play. Doubled up overnight.",
        tags: ["options", "calls", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "QQQ 420P 01/05",
        side: "long",
        assetClass: "options",
        entryPrice: 3.2,
        exitPrice: 1.1,
        quantity: 5,
        entryDate: new Date("2024-12-30T14:00:00"),
        exitDate: new Date("2026-01-02T10:30:00"),
        pnl: -1050,
        notes: "Hedging position. Market kept grinding higher.",
        tags: ["options", "puts", "hedge", "loser"],
      },
      {
        userId: USER_ID,
        symbol: "AMZN 200C 01/17",
        side: "long",
        assetClass: "options",
        entryPrice: 5.6,
        exitPrice: 8.9,
        quantity: 8,
        entryDate: new Date("2026-01-06T09:45:00"),
        exitDate: new Date("2026-01-10T15:00:00"),
        pnl: 2640,
        notes: "Played the gap fill. Perfect timing.",
        tags: ["options", "calls", "winner"],
      },
      // Crypto trades
      {
        userId: USER_ID,
        symbol: "BTC/USD",
        side: "long",
        assetClass: "crypto",
        entryPrice: 42500,
        exitPrice: 44800,
        quantity: 0.5,
        entryDate: new Date("2026-01-08T02:00:00"),
        exitDate: new Date("2026-01-12T18:30:00"),
        pnl: 1150,
        notes: "Bought support, sold at local resistance.",
        tags: ["crypto", "swing", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "ETH/USD",
        side: "long",
        assetClass: "crypto",
        entryPrice: 2280,
        exitPrice: 2190,
        quantity: 2,
        entryDate: new Date("2026-01-14T08:15:00"),
        exitDate: new Date("2026-01-15T22:00:00"),
        pnl: -180,
        notes: "Got chopped up in the range. Cut it.",
        tags: ["crypto", "loser"],
      },
      // More recent trades
      {
        userId: USER_ID,
        symbol: "MSFT",
        side: "long",
        assetClass: "stocks",
        entryPrice: 415.2,
        exitPrice: 422.8,
        quantity: 30,
        entryDate: new Date("2026-01-20T09:40:00"),
        exitDate: new Date("2026-01-24T14:15:00"),
        pnl: 228,
        notes: "Earnings run-up play.",
        tags: ["swing", "earnings-play", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "GOOGL",
        side: "long",
        assetClass: "stocks",
        entryPrice: 178.5,
        exitPrice: 175.2,
        quantity: 60,
        entryDate: new Date("2026-01-27T10:30:00"),
        exitDate: new Date("2026-01-28T11:00:00"),
        pnl: -198,
        notes: "Weak price action. Cut early.",
        tags: ["day-trade", "loser"],
      },
      {
        userId: USER_ID,
        symbol: "SPY 495C 02/07",
        side: "long",
        assetClass: "options",
        entryPrice: 1.85,
        exitPrice: 3.4,
        quantity: 15,
        entryDate: new Date("2026-02-03T09:35:00"),
        exitDate: new Date("2026-02-05T13:20:00"),
        pnl: 2325,
        notes: "FOMC rally. Nailed it.",
        tags: ["options", "calls", "FOMC", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "COIN",
        side: "long",
        assetClass: "stocks",
        entryPrice: 245.0,
        exitPrice: 278.5,
        quantity: 25,
        entryDate: new Date("2026-02-10T09:50:00"),
        exitDate: new Date("2026-02-14T15:30:00"),
        pnl: 837.5,
        notes: "Crypto proxy play. BTC breaking out.",
        tags: ["swing", "crypto-related", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "PLTR",
        side: "long",
        assetClass: "stocks",
        entryPrice: 22.4,
        exitPrice: 24.1,
        quantity: 200,
        entryDate: new Date("2026-02-18T10:15:00"),
        exitDate: new Date("2026-02-21T14:45:00"),
        pnl: 340,
        notes: "AI momentum continues.",
        tags: ["swing", "AI-play", "winner"],
      },
      {
        userId: USER_ID,
        symbol: "SMCI",
        side: "short",
        assetClass: "stocks",
        entryPrice: 892.0,
        exitPrice: 945.0,
        quantity: 10,
        entryDate: new Date("2026-02-25T11:00:00"),
        exitDate: new Date("2026-02-26T09:35:00"),
        pnl: -530,
        notes: "Tried to short the top. Got squeezed.",
        tags: ["day-trade", "short", "loser", "FOMO"],
      },
      {
        userId: USER_ID,
        symbol: "XOM",
        side: "long",
        assetClass: "stocks",
        entryPrice: 108.5,
        exitPrice: 112.3,
        quantity: 50,
        entryDate: new Date("2026-03-03T09:45:00"),
        exitDate: new Date("2026-03-06T15:00:00"),
        pnl: 190,
        notes: "Oil strength. Sector rotation.",
        tags: ["swing", "energy", "winner"],
      },
    ],
  });
  console.log(`✓ Created ${trades.count} trades`);

  // ─────────────────────────────────────────────────────────────────────────
  // WATCHLIST - Stocks being monitored
  // ─────────────────────────────────────────────────────────────────────────
  const watchlist = await prisma.watchlistItem.createMany({
    data: [
      {
        userId: USER_ID,
        symbol: "NVDA",
        notes: "Watching for pullback to 130 support. AI leader.",
        alertPrice: 130.0,
      },
      {
        userId: USER_ID,
        symbol: "AAPL",
        notes: "Consolidating. Break above 195 = breakout.",
        alertPrice: 195.0,
      },
      {
        userId: USER_ID,
        symbol: "TSLA",
        notes: "Volatile. Looking for 220 support test.",
        alertPrice: 220.0,
      },
      {
        userId: USER_ID,
        symbol: "AMD",
        notes: "Competitor to NVDA. Watching 160 resistance.",
        alertPrice: 160.0,
      },
      {
        userId: USER_ID,
        symbol: "AMZN",
        notes: "AWS growth story. Support at 185.",
        alertPrice: 185.0,
      },
      {
        userId: USER_ID,
        symbol: "MSTR",
        notes: "BTC proxy. High beta play.",
        alertPrice: null,
      },
      {
        userId: USER_ID,
        symbol: "ARM",
        notes: "AI chip play. Expensive but momentum.",
        alertPrice: null,
      },
      {
        userId: USER_ID,
        symbol: "CRWD",
        notes: "Cybersecurity leader. Earnings coming up.",
        alertPrice: 380.0,
      },
    ],
  });
  console.log(`✓ Created ${watchlist.count} watchlist items`);

  // ─────────────────────────────────────────────────────────────────────────
  // JOURNAL ENTRIES - Psychology/mood tracking
  // ─────────────────────────────────────────────────────────────────────────
  const journalEntries = await prisma.journalEntry.createMany({
    data: [
      {
        userId: USER_ID,
        date: new Date("2024-12-02"),
        mood: 4,
        notes:
          "Feeling focused today. Slept well. Ready to execute the plan. No revenge trading.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2024-12-09"),
        mood: 2,
        notes:
          "Frustrated from yesterday's losses. Need to stick to the rules. Taking smaller size today.",
        marketBias: "neutral",
      },
      {
        userId: USER_ID,
        date: new Date("2024-12-12"),
        mood: 5,
        notes:
          "Best trading day in weeks. Followed the process. Let winners run. Cut losers fast.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2024-12-19"),
        mood: 3,
        notes:
          "Choppy market. Staying patient. Only taking A+ setups.",
        marketBias: "neutral",
      },
      {
        userId: USER_ID,
        date: new Date("2024-12-26"),
        mood: 4,
        notes:
          "Holiday week, low volume. Expecting melt-up into year end. Light positioning.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-01-06"),
        mood: 4,
        notes:
          "New year, fresh start. Reviewing 2024 stats. Win rate 62%, need to improve R:R.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-01-14"),
        mood: 2,
        notes:
          "Got chopped up in the range. Over-traded. Taking tomorrow off.",
        marketBias: "bearish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-01-20"),
        mood: 3,
        notes:
          "Back from break. Mind is clear. Earnings season starting, being selective.",
        marketBias: "neutral",
      },
      {
        userId: USER_ID,
        date: new Date("2026-01-27"),
        mood: 3,
        notes:
          "Cut a loser early. Good discipline. Market feels heavy.",
        marketBias: "bearish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-02-03"),
        mood: 5,
        notes:
          "FOMC day. Had a plan, executed it perfectly. Big win on SPY calls.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-02-10"),
        mood: 4,
        notes:
          "Crypto is running. Playing it through COIN. Risk management on point.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-02-25"),
        mood: 1,
        notes:
          "Got squeezed on SMCI short. Classic mistake - shorting strength. Lesson learned.",
        marketBias: "bullish",
      },
      {
        userId: USER_ID,
        date: new Date("2026-03-03"),
        mood: 4,
        notes:
          "Sector rotation into energy. Following the flow. Keeping positions small.",
        marketBias: "neutral",
      },
      {
        userId: USER_ID,
        date: new Date("2026-03-07"),
        mood: 4,
        notes:
          "Friday. Closing out weekly positions. Good week overall. Up 3.2%.",
        marketBias: "bullish",
      },
    ],
  });
  console.log(`✓ Created ${journalEntries.count} journal entries`);

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
