// ── Agent System Exports ───────────────────────────────────────────────

// Types
export type {
  AgentRole,
  AgentMessage,
  AgentConversation,
  AgentContext,
  AgentConfig,
  ToolDefinition,
  ToolCall,
  ToolResult,
  AgentStreamEvent,
  TradeAnalysis,
  PerformanceReport,
  RiskAlert,
} from "@/types/agents";

// Tools
export { AGENT_TOOLS, executeTool } from "./tools";

// Prompts
export { AGENT_SYSTEM_PROMPTS, QUICK_PROMPTS } from "./prompts";

// Executor
export {
  createAgentConfig,
  executeAgent,
  streamAgent,
  quickAnalysis,
} from "./executor";
export type { AgentExecutionResult } from "./executor";
