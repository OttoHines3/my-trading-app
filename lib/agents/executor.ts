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
  const allToolCalls: ToolCall[] = [];
  const allToolResults: ToolResult[] = [];

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

// ── Streaming Execution with Agentic Tool Loop ────────────────────────

export async function* streamAgent(
  config: AgentConfig,
  messages: AgentMessage[],
  maxToolIterations = 10
): AsyncGenerator<{
  type: "text" | "tool_start" | "tool_end" | "done";
  content?: string;
  name?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  message?: AgentMessage;
}> {
  const tools = convertTools(config.tools);
  let currentMessages = convertToAnthropicMessages(messages);
  const allToolCalls: ToolCall[] = [];
  const allToolResults: ToolResult[] = [];
  let iterations = 0;

  while (iterations < maxToolIterations) {
    iterations++;

    // Collect the full response first using non-streaming for tool-use iterations,
    // and streaming only for the final text response
    const response = await anthropic.messages.create({
      model: config.model || "claude-sonnet-4-20250514",
      max_tokens: config.maxTokens || 4096,
      system: config.systemPrompt,
      messages: currentMessages,
      tools,
    });

    // Extract content blocks
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

    // If no tool calls or end_turn, stream the final text and we're done
    if (toolCalls.length === 0 || response.stop_reason === "end_turn") {
      // Stream text word-by-word for typewriter effect
      if (textContent) {
        const words = textContent.split(" ");
        for (const word of words) {
          yield { type: "text", content: word + " " };
        }
      }

      yield {
        type: "done",
        message: {
          role: "assistant",
          content: textContent,
          timestamp: new Date().toISOString(),
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
          toolResults: allToolResults.length > 0 ? allToolResults : undefined,
        },
      };
      return;
    }

    // We have tool calls — yield them, execute, and loop
    for (const call of toolCalls) {
      yield {
        type: "tool_start",
        name: call.name,
        toolCall: call,
      };
    }

    // Execute all tool calls
    const toolResults: ToolResult[] = [];
    for (const call of toolCalls) {
      try {
        const result = await executeTool(call.name, call.input);
        const toolResult: ToolResult = {
          toolCallId: call.id,
          result,
          isError: false,
        };
        toolResults.push(toolResult);
        yield {
          type: "tool_end",
          name: call.name,
          toolCall: call,
          toolResult,
        };
      } catch (error) {
        const toolResult: ToolResult = {
          toolCallId: call.id,
          result: { error: error instanceof Error ? error.message : "Unknown error" },
          isError: true,
        };
        toolResults.push(toolResult);
        yield {
          type: "tool_end",
          name: call.name,
          toolCall: call,
          toolResult,
        };
      }
    }

    // Track all tool interactions
    allToolCalls.push(...toolCalls);
    allToolResults.push(...toolResults);

    // Feed tool results back to Claude for next iteration
    currentMessages = [
      ...currentMessages,
      {
        role: "assistant" as const,
        content: response.content,
      },
      {
        role: "user" as const,
        content: toolResults.map((r) => ({
          type: "tool_result" as const,
          tool_use_id: r.toolCallId,
          content: JSON.stringify(r.result),
          is_error: r.isError,
        })),
      },
    ];

    // Loop continues — Claude will process tool results and either call more tools or respond
  }

  // Max iterations reached
  yield {
    type: "done",
    message: {
      role: "assistant",
      content: "I've reached the maximum number of analysis iterations. Here's what I found so far.",
      timestamp: new Date().toISOString(),
      toolCalls: allToolCalls,
      toolResults: allToolResults,
    },
  };
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
