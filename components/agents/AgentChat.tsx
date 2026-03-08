"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAgentChat, useSendMessage } from "@/lib/stores/agent-chat";
import { AgentRole, AgentContext } from "@/types/agents";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  BookOpen,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  Pin,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";

// ── Role Configuration ─────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  AgentRole,
  { label: string; icon: React.ReactNode; color: string; description: string }
> = {
  "trade-analyzer": {
    label: "Trade Analyzer",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-blue-400",
    description: "Analyze individual trades and patterns",
  },
  "performance-coach": {
    label: "Performance Coach",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-yellow-400",
    description: "Get coaching on improving your trading",
  },
  "risk-monitor": {
    label: "Risk Monitor",
    icon: <Shield className="w-4 h-4" />,
    color: "text-red-400",
    description: "Monitor risk metrics and warnings",
  },
  "journal-assistant": {
    label: "Journal Assistant",
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-purple-400",
    description: "Help with trade notes and psychology",
  },
  "market-researcher": {
    label: "Market Researcher",
    icon: <Search className="w-4 h-4" />,
    color: "text-green-400",
    description: "Analyze market patterns and symbols",
  },
  general: {
    label: "Trading Assistant",
    icon: <Bot className="w-4 h-4" />,
    color: "text-gray-400",
    description: "General trading questions and help",
  },
};

// ── Tool Name Labels ──────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  get_trades_by_filter: "Querying your trades",
  calculate_metrics: "Calculating metrics",
  get_pattern_performance: "Analyzing patterns",
  get_vix_correlation: "Checking VIX correlation",
  get_time_of_day_analysis: "Analyzing time patterns",
  get_live_market_data: "Fetching market data",
  get_day_detail: "Loading day details",
  get_recent_performance_trend: "Checking recent trend",
  flag_trade_for_review: "Flagging trade",
  save_insight: "Saving insight",
  get_trades: "Querying trades",
  get_trade_by_id: "Loading trade",
  calculate_performance_metrics: "Calculating performance",
  analyze_patterns: "Analyzing patterns",
  get_risk_metrics: "Checking risk",
  get_journal_entries: "Reading journal",
  get_watchlist: "Checking watchlist",
  compare_periods: "Comparing periods",
};

// ── Conversation Starters per Role ────────────────────────────────────

const CONVERSATION_STARTERS: Record<AgentRole, string[]> = {
  "trade-analyzer": [
    "What are my most profitable trading patterns?",
    "Show me my worst trades this month",
    "What time of day am I most profitable?",
    "Which setups should I stop trading?",
  ],
  "performance-coach": [
    "Give me a full performance review",
    "How has my trading improved recently?",
    "What is my biggest weakness right now?",
    "Create an improvement plan for me",
  ],
  "risk-monitor": [
    "Am I overtrading?",
    "What is my current max drawdown risk?",
    "Show me my biggest losing streaks",
    "Am I risking too much per trade?",
  ],
  "journal-assistant": [
    "Summarize my trading week",
    "What mistakes did I repeat this week?",
    "How was my trading psychology this month?",
    "What should I focus on tomorrow?",
  ],
  "market-researcher": [
    "How does VIX affect my trades?",
    "What market conditions suit my style?",
    "Analyze my performance in high vs low volatility",
    "When should I sit out based on market conditions?",
  ],
  general: [
    "Give me a full performance review",
    "What are my best setups?",
    "How is my risk management?",
    "Summarize my trading week",
  ],
};

// ── Markdown Components ───────────────────────────────────────────────

const markdownComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-lg font-semibold text-white mt-4 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-base font-semibold text-white mt-3 mb-1.5" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-sm font-semibold text-white mt-2 mb-1" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm text-gray-300 mb-2 leading-relaxed" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="text-sm text-gray-300 list-disc list-inside mb-2 space-y-0.5" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="text-sm text-gray-300 list-decimal list-inside mb-2 space-y-0.5" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-sm text-gray-300" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-white font-semibold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="text-gray-200 italic" {...props}>{children}</em>
  ),
  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-blue-300 font-mono" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={clsx("block bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-200 overflow-x-auto mb-2", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-gray-800 rounded-lg p-3 overflow-x-auto mb-2" {...props}>{children}</pre>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-2">
      <table className="w-full text-sm border-collapse" {...props}>{children}</table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-gray-800" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-3 py-1.5 text-left text-xs font-semibold text-white border border-gray-700" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-3 py-1.5 text-xs text-gray-300 border border-gray-700" {...props}>{children}</td>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="even:bg-gray-800/50" {...props}>{children}</tr>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-2 border-gray-600 pl-3 my-2 text-gray-400 italic" {...props}>{children}</blockquote>
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="border-gray-700 my-3" {...props} />
  ),
  a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
};

// ── Tool Pills Component ──────────────────────────────────────────────

function ToolPills({ tools }: { tools: string[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tools.map((tool) => (
        <span
          key={tool}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-700/50 text-xs text-gray-300 animate-pulse"
        >
          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          {TOOL_LABELS[tool] || tool}
        </span>
      ))}
    </div>
  );
}

// ── Feedback Buttons Component ────────────────────────────────────────

function FeedbackButtons({
  messageContent,
  agentType,
  onRegenerate,
}: {
  messageContent: string;
  agentType: string;
  onRegenerate: () => void;
}) {
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleFeedback = async (type: "thumbsUp" | "thumbsDown") => {
    setFeedbackGiven(type);
    // Feedback on general messages is a no-op since there's no insightId yet
    // This is a UX affordance — real feedback happens on saved insights
  };

  const handleSaveInsight = async () => {
    setSaved(true);
    try {
      // Extract a short title from the first line or first 60 chars
      const firstLine = messageContent.split("\n").find((l) => l.trim()) || messageContent;
      const title = firstLine.replace(/^[#*\s]+/, "").slice(0, 80) || "AI Insight";

      await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: messageContent,
          category: "recommendation",
          agentType: agentType || "general",
        }),
      });
    } catch {
      setSaved(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleFeedback("thumbsUp")}
        className={clsx(
          "p-1 rounded hover:bg-gray-700 transition-colors",
          feedbackGiven === "thumbsUp" ? "text-green-400" : "text-gray-500 hover:text-gray-300"
        )}
        title="Helpful"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleFeedback("thumbsDown")}
        className={clsx(
          "p-1 rounded hover:bg-gray-700 transition-colors",
          feedbackGiven === "thumbsDown" ? "text-red-400" : "text-gray-500 hover:text-gray-300"
        )}
        title="Not helpful"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleSaveInsight}
        className={clsx(
          "p-1 rounded hover:bg-gray-700 transition-colors",
          saved ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
        )}
        title="Save insight"
      >
        <Pin className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onRegenerate}
        className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-300"
        title="Regenerate"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────

interface AgentChatProps {
  defaultRole?: AgentRole;
  context?: AgentContext;
  className?: string;
  compact?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────

export function AgentChat({
  defaultRole = "general",
  context,
  className,
  compact = false,
}: AgentChatProps) {
  const [input, setInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<AgentRole>(defaultRole);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentConversation,
    isLoading,
    isStreaming,
    error,
    activeToolCalls,
    startConversation,
    clearCurrentConversation,
  } = useAgentChat();
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, activeToolCalls]);

  // Start conversation when role changes
  useEffect(() => {
    if (!currentConversation) {
      startConversation(selectedRole, context);
    }
  }, [selectedRole, context, currentConversation, startConversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage(input, selectedRole, context);
    setInput("");
  };

  const handleStarterClick = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt, selectedRole, context);
  };

  const handleRegenerate = useCallback(
    (messageIdx: number) => {
      if (isLoading || !currentConversation) return;
      // Find the user message right before this assistant message
      const messages = currentConversation.messages;
      for (let i = messageIdx - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          sendMessage(messages[i].content, selectedRole, context);
          break;
        }
      }
    },
    [isLoading, currentConversation, sendMessage, selectedRole, context]
  );

  const handleNewChat = () => {
    clearCurrentConversation();
    startConversation(selectedRole, context);
  };

  const roleConfig = ROLE_CONFIG[selectedRole];
  const starters = CONVERSATION_STARTERS[selectedRole];

  return (
    <div
      className={clsx(
        "flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden",
        compact ? "h-[400px]" : "",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {/* Role Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSelect(!showRoleSelect)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "bg-gray-800 hover:bg-gray-700 transition-colors",
                roleConfig.color
              )}
            >
              {roleConfig.icon}
              <span className="text-sm font-medium text-white">
                {roleConfig.label}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showRoleSelect && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                {(Object.entries(ROLE_CONFIG) as [AgentRole, typeof roleConfig][]).map(
                  ([role, config]) => (
                    <button
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleSelect(false);
                        if (currentConversation?.agentRole !== role) {
                          clearCurrentConversation();
                          startConversation(role, context);
                        }
                      }}
                      className={clsx(
                        "w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors",
                        "first:rounded-t-lg last:rounded-b-lg",
                        selectedRole === role && "bg-gray-700"
                      )}
                    >
                      <span className={config.color}>{config.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">
                          {config.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {config.description}
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleNewChat}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message / Conversation Starters */}
        {(!currentConversation?.messages.length || currentConversation.messages.length === 0) && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className={clsx("inline-flex p-3 rounded-full bg-gray-800 mb-3", roleConfig.color)}>
                {roleConfig.icon}
              </div>
              <h3 className="text-lg font-medium text-white mb-1">
                {roleConfig.label}
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                {roleConfig.description}. Ask me anything about your trading data.
              </p>
            </div>

            {/* Conversation Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  onClick={() => handleStarterClick(starter)}
                  className={clsx(
                    "flex items-start gap-2 px-3 py-2.5 rounded-lg text-left",
                    "bg-gray-800 hover:bg-gray-700 transition-colors",
                    "text-sm text-gray-300 hover:text-white"
                  )}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{starter}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {currentConversation?.messages.map((message, idx) => (
          <div
            key={idx}
            className={clsx(
              "flex gap-3 group",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className={clsx("flex-shrink-0 p-2 rounded-full bg-gray-800 h-fit", roleConfig.color)}>
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className="max-w-[80%]">
              <div
                className={clsx(
                  "rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                )}
              >
                {message.role === "user" ? (
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                ) : (
                  <div className="text-sm prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Tool calls indicator */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400">
                      Used {message.toolCalls.length} tool(s):{" "}
                      {message.toolCalls
                        .map((tc) => TOOL_LABELS[tc.name] || tc.name)
                        .join(", ")}
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback buttons for assistant messages */}
              {message.role === "assistant" && message.content && (
                <FeedbackButtons
                  messageContent={message.content}
                  agentType={selectedRole}
                  onRegenerate={() => handleRegenerate(idx)}
                />
              )}
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 p-2 rounded-full bg-blue-600 h-fit">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator with tool pills */}
        {(isLoading || isStreaming) && (() => {
          const msgs = currentConversation?.messages ?? [];
          const lastMsg = msgs[msgs.length - 1];
          const hasStreamedContent = lastMsg?.role === "assistant" && lastMsg.content;

          if (hasStreamedContent && activeToolCalls.length > 0) {
            // Show tool pills inline when text is already streaming
            return (
              <div className="flex gap-3 pl-11">
                <div className="bg-gray-800/50 rounded-lg px-4 py-2">
                  <ToolPills tools={activeToolCalls} />
                </div>
              </div>
            );
          }

          if (!hasStreamedContent) {
            // Show full loading indicator before any text arrives
            return (
              <div className="flex gap-3">
                <div className={clsx("shrink-0 p-2 rounded-full bg-gray-800 h-fit", roleConfig.color)}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    <span className="text-sm text-gray-400">
                      {activeToolCalls.length > 0 ? "Working..." : "Thinking..."}
                    </span>
                  </div>
                  <ToolPills tools={activeToolCalls} />
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${roleConfig.label.toLowerCase()}...`}
            className={clsx(
              "flex-1 px-4 py-2 rounded-lg",
              "bg-gray-800 border border-gray-700",
              "text-white placeholder-gray-500",
              "focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
            )}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={clsx(
              "px-4 py-2 rounded-lg",
              "bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700",
              "text-white disabled:text-gray-500",
              "transition-colors"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Floating Chat Button ───────────────────────────────────────────────

interface FloatingAgentButtonProps {
  context?: AgentContext;
}

export function FloatingAgentButton({ context }: FloatingAgentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-blue-600 hover:bg-blue-500",
          "shadow-lg shadow-blue-600/25",
          "flex items-center justify-center",
          "transition-transform hover:scale-105"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px]">
          <AgentChat context={context} compact />
        </div>
      )}
    </>
  );
}
