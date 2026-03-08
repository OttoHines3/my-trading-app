import { NextRequest, NextResponse } from "next/server";
import { AgentRole, AgentMessage } from "@/types/agents";
import { createAgentConfig, executeAgent } from "@/lib/agents/executor";
import { loadMemory, updateMemory } from "@/lib/agent-memory";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const userId = "default";

    // Load persistent memory and inject into system prompt
    const memory = await loadMemory(userId, role);
    const config = createAgentConfig(role);
    config.systemPrompt = `${config.systemPrompt}\n\n${memory}`;

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
          return { ...msg, content: contextPrefix + msg.content };
        }
        return msg;
      });
    }

    // Execute agent
    const result = await executeAgent(config, processedMessages);

    // Update memory in background (don't block response)
    const allMessages = [
      ...processedMessages,
      result.message,
    ];
    updateMemory(
      userId,
      role,
      allMessages.map((m) => ({ role: m.role, content: m.content }))
    ).catch((err) => console.error("Memory update failed:", err));

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
