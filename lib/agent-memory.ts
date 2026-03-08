import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────

export interface AgentMemoryData {
  knownStrengths: string[];
  knownWeaknesses: string[];
  tradingPatterns: string[];
  keyFindings: string[];
  openQuestions: string[];
  lastAnalysisDate: string;
  totalConversations: number;
  traderProfile: {
    tradingStyle: string;
    primarySymbols: string[];
    preferredTimeframes: string[];
    riskTolerance: string;
    mainChallenges: string[];
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

export function getDefaultMemory(): AgentMemoryData {
  return {
    knownStrengths: [],
    knownWeaknesses: [],
    tradingPatterns: [],
    keyFindings: [],
    openQuestions: [],
    lastAnalysisDate: "",
    totalConversations: 0,
    traderProfile: {
      tradingStyle: "",
      primarySymbols: [],
      preferredTimeframes: [],
      riskTolerance: "",
      mainChallenges: [],
    },
  };
}

function formatMemoryForPrompt(data: AgentMemoryData): string {
  const sections: string[] = [];

  if (data.traderProfile.tradingStyle) {
    sections.push(`Trading Style: ${data.traderProfile.tradingStyle}`);
  }
  if (data.traderProfile.primarySymbols.length > 0) {
    sections.push(`Primary Symbols: ${data.traderProfile.primarySymbols.join(", ")}`);
  }
  if (data.traderProfile.preferredTimeframes.length > 0) {
    sections.push(`Preferred Timeframes: ${data.traderProfile.preferredTimeframes.join(", ")}`);
  }
  if (data.traderProfile.riskTolerance) {
    sections.push(`Risk Tolerance: ${data.traderProfile.riskTolerance}`);
  }
  if (data.traderProfile.mainChallenges.length > 0) {
    sections.push(`Main Challenges: ${data.traderProfile.mainChallenges.join("; ")}`);
  }
  if (data.knownStrengths.length > 0) {
    sections.push(`Known Strengths:\n${data.knownStrengths.map((s) => `  - ${s}`).join("\n")}`);
  }
  if (data.knownWeaknesses.length > 0) {
    sections.push(`Known Weaknesses:\n${data.knownWeaknesses.map((w) => `  - ${w}`).join("\n")}`);
  }
  if (data.tradingPatterns.length > 0) {
    sections.push(`Observed Patterns:\n${data.tradingPatterns.map((p) => `  - ${p}`).join("\n")}`);
  }
  if (data.keyFindings.length > 0) {
    sections.push(`Key Findings:\n${data.keyFindings.map((f) => `  - ${f}`).join("\n")}`);
  }
  if (data.openQuestions.length > 0) {
    sections.push(`Open Questions:\n${data.openQuestions.map((q) => `  - ${q}`).join("\n")}`);
  }
  if (data.lastAnalysisDate) {
    sections.push(`Last Analysis: ${data.lastAnalysisDate}`);
  }
  sections.push(`Total Conversations: ${data.totalConversations}`);

  return sections.join("\n\n");
}

// ── Core Functions ────────────────────────────────────────────────────

export async function loadMemory(
  userId: string,
  agentType: string
): Promise<string> {
  const record = await prisma.agentMemory.findUnique({
    where: {
      userId_agentType: { userId, agentType },
    },
  });

  if (!record) {
    return "No previous observations for this trader.";
  }

  const data = record.memories as unknown as AgentMemoryData;
  const formatted = formatMemoryForPrompt(data);

  if (record.rawSummary) {
    return `${formatted}\n\nPrevious Summary:\n${record.rawSummary}`;
  }

  return formatted;
}

export async function updateMemory(
  userId: string,
  agentType: string,
  conversation: Array<{ role: string; content: string }>
): Promise<void> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Fetch existing memory
  const existing = await prisma.agentMemory.findUnique({
    where: {
      userId_agentType: { userId, agentType },
    },
  });

  const currentMemory: AgentMemoryData = existing
    ? (existing.memories as unknown as AgentMemoryData)
    : getDefaultMemory();

  // Take the last 10 messages from the conversation
  const recentMessages = conversation.slice(-10);

  const extractionPrompt = `You are a memory extraction system for an AI trading coach. Analyze the conversation below and update the trader's memory profile.

CURRENT MEMORY:
${JSON.stringify(currentMemory, null, 2)}

RECENT CONVERSATION:
${recentMessages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

Based on the conversation, update the memory profile. Merge new information with existing data — do not discard previous observations unless they are clearly outdated or contradicted. Increment totalConversations by 1. Set lastAnalysisDate to today's date.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "knownStrengths": ["string array of trader strengths"],
  "knownWeaknesses": ["string array of trader weaknesses"],
  "tradingPatterns": ["string array of observed trading patterns"],
  "keyFindings": ["string array of important findings"],
  "openQuestions": ["string array of unresolved questions to follow up on"],
  "lastAnalysisDate": "YYYY-MM-DD",
  "totalConversations": number,
  "traderProfile": {
    "tradingStyle": "description of trading style",
    "primarySymbols": ["symbols they trade"],
    "preferredTimeframes": ["timeframes they use"],
    "riskTolerance": "low | medium | high | unknown",
    "mainChallenges": ["key challenges they face"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: extractionPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[agent-memory] No text block in Claude response");
      return;
    }

    const rawText = textBlock.text.trim();
    const updatedMemory: AgentMemoryData = JSON.parse(rawText);

    // Build a human-readable summary for the rawSummary field
    const rawSummary = formatMemoryForPrompt(updatedMemory);

    await prisma.agentMemory.upsert({
      where: {
        userId_agentType: { userId, agentType },
      },
      create: {
        userId,
        agentType,
        memories: JSON.parse(JSON.stringify(updatedMemory)),
        rawSummary,
      },
      update: {
        memories: JSON.parse(JSON.stringify(updatedMemory)),
        rawSummary,
      },
    });
  } catch (error) {
    console.error("[agent-memory] Failed to update memory:", error);
  }
}
