// ── Agent System Types ─────────────────────────────────────────────────

export type AgentRole =
  | "trade-analyzer"      // Analyzes individual trades or patterns
  | "performance-coach"   // Reviews overall performance, suggests improvements
  | "risk-monitor"        // Monitors risk metrics, warns about issues
  | "journal-assistant"   // Helps with trade notes and psychology
  | "market-researcher"   // Analyzes market conditions and context
  | "general";            // General-purpose trading assistant

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  isError?: boolean;
}

export interface AgentConversation {
  id: string;
  agentRole: AgentRole;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
  context?: AgentContext;
}

export interface AgentContext {
  tradeId?: string;           // If analyzing a specific trade
  symbol?: string;            // If focused on a symbol
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: Record<string, unknown>;
}

// ── Tool Definitions ───────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

// ── Agent Configuration ────────────────────────────────────────────────

export interface AgentConfig {
  role: AgentRole;
  systemPrompt: string;
  tools: ToolDefinition[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// ── Streaming Types ────────────────────────────────────────────────────

export type AgentStreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; toolCallId: string; result: unknown }
  | { type: "done"; message: AgentMessage }
  | { type: "error"; error: string };

// ── Analysis Result Types ──────────────────────────────────────────────

export interface TradeAnalysis {
  trade: {
    id: string;
    symbol: string;
    pnl: number;
    side: string;
  };
  insights: string[];
  suggestions: string[];
  riskAssessment?: {
    level: "low" | "medium" | "high";
    factors: string[];
  };
}

export interface PerformanceReport {
  period: string;
  metrics: {
    totalPnl: number;
    winRate: number;
    expectancy: number;
    profitFactor: number;
    maxDrawdown: number;
    averageWin: number;
    averageLoss: number;
    totalTrades: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface RiskAlert {
  level: "info" | "warning" | "critical";
  type: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
}
