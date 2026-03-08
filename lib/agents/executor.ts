import Anthropic from "@anthropic-ai/sdk";
import { AgentConfig, AgentMessage, ToolCall, ToolResult, AgentRole } from "@/types/agents";
import { AGENT_TOOLS, executeTool } from "./tools";
import { AGENT_SYSTEM_PROMPTS } from "./prompts";

// ── Anthropic Client Singleton ─────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Agent Configuration Factory ────────────────────────────────────────

export function createAgentConfig(role: AgentRole): AgentConfig {
  return {
    role,
    systemPrompt: AGENT_SYSTEM_PROMPTS[role],
    tools: AGENT_TOOLS,
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.7,
  };
}

// ── Message Conversion ─────────────────────────────────────────────────

type AnthropicMessage = Anthropic.MessageParam;
type AnthropicContent = Anthropic.ContentBlockParam;

function convertToAnthropicMessages(messages: AgentMessage[]): AnthropicMessage[] {
  return messages.map((msg) => {
    const content: AnthropicContent[] = [];

    // Add text content
    if (msg.content) {
      content.push({ type: "text", text: msg.content });
    }

    // Add tool use blocks for assistant messages
    if (msg.role === "assistant" && msg.toolCalls) {
      for (const call of msg.toolCalls) {
        content.push({
          type: "tool_use",
          id: call.id,
          name: call.name,
          input: call.input,
        });
      }
    }

    // Add tool results for user messages
    if (msg.role === "user" && msg.toolResults) {
      for (const result of msg.toolResults) {
        content.push({
          type: "tool_result",
          tool_use_id: result.toolCallId,
          content: JSON.stringify(result.result),
          is_error: result.isError,
        });
      }
    }

    return {
      role: msg.role,
      content: content.length > 0 ? content : msg.content,
    };
  });
}

// ── Tool Conversion ────────────────────────────────────────────────────

function convertTools(tools: AgentConfig["tools"]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as Anthropic.Tool.InputSchema,
  }));
}

// ── Main Agent Execution ───────────────────────────────────────────────

export interface AgentExecutionResult {
  message: AgentMessage;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  stopReason: string;
}

export async function executeAgent(
  config: AgentConfig,
  messages: AgentMessage[],
  maxToolIterations = 10
): Promise<AgentExecutionResult> {
  const anthropicMessages = convertToAnthropicMessages(messages);
  const tools = convertTools(config.tools);

  let iterations = 0;
  let currentMessages = [...anthropicMessages];
  let allToolCalls: ToolCall[] = [];
  let allToolResults: ToolResult[] = [];

  while (iterations < maxToolIterations) {
    iterations++;

    const response = await anthropic.messages.create({
      model: config.model || "claude-sonnet-4-20250514",
      max_tokens: config.maxTokens || 4096,
      system: config.systemPrompt,
      messages: currentMessages,
      tools,
    });

    // Extract text content
    let textContent = "";
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0 || response.stop_reason === "end_turn") {
      return {
        message: {
          role: "assistant",
          content: textContent,
          timestamp: new Date().toISOString(),
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
          toolResults: allToolResults.length > 0 ? allToolResults : undefined,
        },
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        toolResults: allToolResults.length > 0 ? allToolResults : undefined,
        stopReason: response.stop_reason ?? "unknown",
      };
    }

    // Execute tools
    const toolResults: ToolResult[] = [];
    for (const call of toolCalls) {
      try {
        const result = await executeTool(call.name, call.input);
        toolResults.push({
          toolCallId: call.id,
          result,
          isError: false,
        });
      } catch (error) {
        toolResults.push({
          toolCallId: call.id,
          result: { error: error instanceof Error ? error.message : "Unknown error" },
          isError: true,
        });
      }
    }

    // Track all tool interactions
    allToolCalls.push(...toolCalls);
    allToolResults.push(...toolResults);

    // Add assistant message with tool calls
    currentMessages.push({
      role: "assistant",
      content: response.content,
    });

    // Add tool results as user message
    currentMessages.push({
      role: "user",
      content: toolResults.map((r) => ({
        type: "tool_result" as const,
        tool_use_id: r.toolCallId,
        content: JSON.stringify(r.result),
        is_error: r.isError,
      })),
    });
  }

  // Max iterations reached
  return {
    message: {
      role: "assistant",
      content: "I've reached the maximum number of tool iterations. Here's what I found so far based on my analysis.",
      timestamp: new Date().toISOString(),
      toolCalls: allToolCalls,
      toolResults: allToolResults,
    },
    toolCalls: allToolCalls,
    toolResults: allToolResults,
    stopReason: "max_iterations",
  };
}

// ── Streaming Execution ────────────────────────────────────────────────

export async function* streamAgent(
  config: AgentConfig,
  messages: AgentMessage[]
): AsyncGenerator<{
  type: "text" | "tool_start" | "tool_end" | "done";
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}> {
  const anthropicMessages = convertToAnthropicMessages(messages);
  const tools = convertTools(config.tools);

  const stream = await anthropic.messages.stream({
    model: config.model || "claude-sonnet-4-20250514",
    max_tokens: config.maxTokens || 4096,
    system: config.systemPrompt,
    messages: anthropicMessages,
    tools,
  });

  let currentToolCall: Partial<ToolCall> | null = null;

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      const delta = event.delta;
      if ("text" in delta) {
        yield { type: "text", content: delta.text };
      } else if ("partial_json" in delta && currentToolCall) {
        // Accumulate tool input JSON
      }
    } else if (event.type === "content_block_start") {
      const block = event.content_block;
      if (block.type === "tool_use") {
        currentToolCall = {
          id: block.id,
          name: block.name,
          input: {},
        };
        yield { type: "tool_start", toolCall: currentToolCall as ToolCall };
      }
    } else if (event.type === "content_block_stop" && currentToolCall) {
      // Execute the tool
      const toolCall = currentToolCall as ToolCall;
      try {
        const result = await executeTool(toolCall.name, toolCall.input);
        yield {
          type: "tool_end",
          toolCall,
          toolResult: { toolCallId: toolCall.id, result, isError: false },
        };
      } catch (error) {
        yield {
          type: "tool_end",
          toolCall,
          toolResult: {
            toolCallId: toolCall.id,
            result: { error: error instanceof Error ? error.message : "Unknown error" },
            isError: true,
          },
        };
      }
      currentToolCall = null;
    }
  }

  yield { type: "done" };
}

// ── Quick Analysis Functions ───────────────────────────────────────────

export async function quickAnalysis(
  role: AgentRole,
  userMessage: string,
  context?: { tradeId?: string; symbol?: string }
): Promise<string> {
  const config = createAgentConfig(role);

  // Build context-aware message
  let fullMessage = userMessage;
  if (context?.tradeId) {
    fullMessage = `[Context: Analyzing trade ID ${context.tradeId}]\n\n${userMessage}`;
  } else if (context?.symbol) {
    fullMessage = `[Context: Focus on symbol ${context.symbol}]\n\n${userMessage}`;
  }

  const messages: AgentMessage[] = [
    {
      role: "user",
      content: fullMessage,
      timestamp: new Date().toISOString(),
    },
  ];

  const result = await executeAgent(config, messages);
  return result.message.content;
}
