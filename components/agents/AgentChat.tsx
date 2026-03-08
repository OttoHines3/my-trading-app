"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentChat, useSendMessage } from "@/lib/stores/agent-chat";
import { AgentRole, AgentContext } from "@/types/agents";
import { QUICK_PROMPTS } from "@/lib/agents/prompts";
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

// ── Quick Actions ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { key: "dailyReview", label: "Daily Review", role: "performance-coach" as AgentRole },
  { key: "riskCheck", label: "Risk Check", role: "risk-monitor" as AgentRole },
  { key: "bestSetups", label: "Best Setups", role: "trade-analyzer" as AgentRole },
  { key: "improvementPlan", label: "Improvement Plan", role: "performance-coach" as AgentRole },
];

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
    error,
    startConversation,
    clearCurrentConversation,
  } = useAgentChat();
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

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

  const handleQuickAction = (actionKey: string, role: AgentRole) => {
    const prompt = QUICK_PROMPTS[actionKey as keyof typeof QUICK_PROMPTS];
    if (typeof prompt === "string") {
      setSelectedRole(role);
      sendMessage(prompt, role, context);
    }
  };

  const handleNewChat = () => {
    clearCurrentConversation();
    startConversation(selectedRole, context);
  };

  const roleConfig = ROLE_CONFIG[selectedRole];

  return (
    <div
      className={clsx(
        "flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden",
        compact ? "h-[400px]" : "h-[600px]",
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
        {/* Welcome message / Quick Actions */}
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

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  onClick={() => handleQuickAction(action.key, action.role)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    "bg-gray-800 hover:bg-gray-700 transition-colors",
                    "text-sm text-gray-300 hover:text-white"
                  )}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  {action.label}
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
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className={clsx("flex-shrink-0 p-2 rounded-full bg-gray-800", roleConfig.color)}>
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={clsx(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              )}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>

              {/* Tool calls indicator */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    Used {message.toolCalls.length} tool(s):{" "}
                    {message.toolCalls.map((tc) => tc.name).join(", ")}
                  </div>
                </div>
              )}
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 p-2 rounded-full bg-blue-600">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className={clsx("flex-shrink-0 p-2 rounded-full bg-gray-800", roleConfig.color)}>
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          </div>
        )}

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
