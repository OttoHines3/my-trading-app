import { NextRequest, NextResponse } from "next/server";
import { AgentRole } from "@/types/agents";
import { quickAnalysis } from "@/lib/agents/executor";
import { QUICK_PROMPTS } from "@/lib/agents/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type QuickPromptKey = keyof typeof QUICK_PROMPTS;

interface QuickRequest {
  action: QuickPromptKey | "custom";
  customPrompt?: string;
  role?: AgentRole;
  context?: {
    tradeId?: string;
    symbol?: string;
  };
}

// Map actions to appropriate agent roles
const ACTION_ROLES: Record<QuickPromptKey, AgentRole> = {
  dailyReview: "performance-coach",
  weeklyReport: "performance-coach",
  riskCheck: "risk-monitor",
  tradeReview: "trade-analyzer",
  symbolAnalysis: "market-researcher",
  improvementPlan: "performance-coach",
  moodCorrelation: "journal-assistant",
  bestSetups: "trade-analyzer",
  worstMistakes: "performance-coach",
};

export async function POST(req: NextRequest) {
  try {
    const body: QuickRequest = await req.json();
    const { action, customPrompt, role, context } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    let prompt: string;
    let agentRole: AgentRole;

    if (action === "custom") {
      if (!customPrompt) {
        return NextResponse.json(
          { error: "customPrompt is required when action is 'custom'" },
          { status: 400 }
        );
      }
      prompt = customPrompt;
      agentRole = role || "general";
    } else {
      // Get the prompt template
      const promptTemplate = QUICK_PROMPTS[action];
      if (!promptTemplate) {
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
      }

      // Handle function-based prompts
      if (typeof promptTemplate === "function") {
        if (action === "tradeReview" && context?.tradeId) {
          prompt = promptTemplate(context.tradeId);
        } else if (action === "symbolAnalysis" && context?.symbol) {
          prompt = promptTemplate(context.symbol);
        } else {
          return NextResponse.json(
            { error: `${action} requires context (tradeId or symbol)` },
            { status: 400 }
          );
        }
      } else {
        prompt = promptTemplate;
      }

      agentRole = role || ACTION_ROLES[action];
    }

    // Execute quick analysis
    const result = await quickAnalysis(agentRole, prompt, context);

    return NextResponse.json({
      success: true,
      action,
      role: agentRole,
      response: result,
    });
  } catch (error) {
    console.error("Quick analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute quick analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list available quick actions
export async function GET() {
  return NextResponse.json({
    actions: Object.keys(QUICK_PROMPTS).map((key) => ({
      name: key,
      role: ACTION_ROLES[key as QuickPromptKey] || "general",
      requiresContext:
        key === "tradeReview" ? "tradeId" : key === "symbolAnalysis" ? "symbol" : null,
    })),
    roles: [
      "trade-analyzer",
      "performance-coach",
      "risk-monitor",
      "journal-assistant",
      "market-researcher",
      "general",
    ],
  });
}
