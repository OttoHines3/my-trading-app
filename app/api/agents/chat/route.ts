import { NextRequest, NextResponse } from "next/server";
import { AgentRole, AgentMessage } from "@/types/agents";
import { createAgentConfig, executeAgent } from "@/lib/agents/executor";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for agent execution

interface ChatRequest {
  role: AgentRole;
  messages: AgentMessage[];
  context?: {
    tradeId?: string;
    symbol?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { role, messages, context } = body;

    if (!role || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: role and messages" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: AgentRole[] = [
      "trade-analyzer",
      "performance-coach",
      "risk-monitor",
      "journal-assistant",
      "market-researcher",
      "general",
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Create agent config
    const config = createAgentConfig(role);

    // If there's context, prepend it to the first user message
    let processedMessages = messages;
    if (context && (context.tradeId || context.symbol)) {
      processedMessages = messages.map((msg, idx) => {
        if (idx === 0 && msg.role === "user") {
          let contextPrefix = "";
          if (context.tradeId) {
            contextPrefix += `[Context: Analyzing trade ID ${context.tradeId}]\n\n`;
          }
          if (context.symbol) {
            contextPrefix += `[Context: Focus on symbol ${context.symbol}]\n\n`;
          }
          return {
            ...msg,
            content: contextPrefix + msg.content,
          };
        }
        return msg;
      });
    }

    // Execute agent
    const result = await executeAgent(config, processedMessages);

    return NextResponse.json({
      success: true,
      message: result.message,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      stopReason: result.stopReason,
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
