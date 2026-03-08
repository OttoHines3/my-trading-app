import { NextRequest } from "next/server";
import { AgentRole, AgentMessage } from "@/types/agents";
import { createAgentConfig, streamAgent } from "@/lib/agents/executor";

export const runtime = "nodejs";
export const maxDuration = 60;

interface StreamRequest {
  role: AgentRole;
  messages: AgentMessage[];
  context?: {
    tradeId?: string;
    symbol?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: StreamRequest = await req.json();
    const { role, messages, context } = body;

    if (!role || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: role and messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create agent config
    const config = createAgentConfig(role);

    // Process context
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

    // Create readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamAgent(config, processedMessages)) {
            const data = JSON.stringify(event) + "\n";
            controller.enqueue(encoder.encode(`data: ${data}\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to start stream",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
