import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AgentRole, AgentMessage, AgentConversation, AgentContext } from "@/types/agents";

interface AgentChatState {
  // Current conversation
  currentConversation: AgentConversation | null;

  // Conversation history (persisted)
  conversations: AgentConversation[];

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;

  // Actions
  startConversation: (role: AgentRole, context?: AgentContext) => void;
  addMessage: (message: AgentMessage) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateStreamingMessage: (content: string) => void;
}

export const useAgentChat = create<AgentChatState>()(
  persist(
    (set, get) => ({
      currentConversation: null,
      conversations: [],
      isLoading: false,
      isStreaming: false,
      error: null,

      startConversation: (role: AgentRole, context?: AgentContext) => {
        const newConversation: AgentConversation = {
          id: crypto.randomUUID(),
          agentRole: role,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          context,
        };
        set({ currentConversation: newConversation, error: null });
      },

      addMessage: (message: AgentMessage) => {
        const { currentConversation, conversations } = get();
        if (!currentConversation) return;

        const updatedConversation: AgentConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, message],
          updatedAt: new Date().toISOString(),
        };

        // Update or add to conversations history
        const existingIdx = conversations.findIndex(
          (c) => c.id === currentConversation.id
        );
        const updatedConversations =
          existingIdx >= 0
            ? [
                ...conversations.slice(0, existingIdx),
                updatedConversation,
                ...conversations.slice(existingIdx + 1),
              ]
            : [updatedConversation, ...conversations];

        // Keep only last 50 conversations
        const trimmedConversations = updatedConversations.slice(0, 50);

        set({
          currentConversation: updatedConversation,
          conversations: trimmedConversations,
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),
      setError: (error: string | null) => set({ error }),

      clearCurrentConversation: () => set({ currentConversation: null }),

      loadConversation: (id: string) => {
        const { conversations } = get();
        const conversation = conversations.find((c) => c.id === id);
        if (conversation) {
          set({ currentConversation: conversation });
        }
      },

      deleteConversation: (id: string) => {
        const { conversations, currentConversation } = get();
        const updated = conversations.filter((c) => c.id !== id);
        set({
          conversations: updated,
          currentConversation:
            currentConversation?.id === id ? null : currentConversation,
        });
      },

      updateStreamingMessage: (content: string) => {
        const { currentConversation } = get();
        if (!currentConversation) return;

        const messages = currentConversation.messages;
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.role === "assistant") {
          // Update the last assistant message
          const updatedMessages = [
            ...messages.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + content },
          ];
          set({
            currentConversation: {
              ...currentConversation,
              messages: updatedMessages,
            },
          });
        } else {
          // Create new assistant message
          const newMessage: AgentMessage = {
            role: "assistant",
            content,
            timestamp: new Date().toISOString(),
          };
          set({
            currentConversation: {
              ...currentConversation,
              messages: [...messages, newMessage],
            },
          });
        }
      },
    }),
    {
      name: "agent-chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);

// ── Hook for sending messages ──────────────────────────────────────────

export function useSendMessage() {
  const {
    currentConversation,
    addMessage,
    setLoading,
    setError,
    startConversation,
  } = useAgentChat();

  const sendMessage = async (
    content: string,
    role: AgentRole = "general",
    context?: AgentContext
  ) => {
    // Start conversation if needed
    if (!currentConversation) {
      startConversation(role, context);
    }

    const userMessage: AgentMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const { currentConversation: conv } = useAgentChat.getState();
      if (!conv) throw new Error("No active conversation");

      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: conv.agentRole,
          messages: conv.messages,
          context: conv.context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();
      addMessage(data.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return sendMessage;
}

// ── Hook for streaming messages ────────────────────────────────────────

export function useStreamMessage() {
  const {
    currentConversation,
    addMessage,
    setStreaming,
    setError,
    startConversation,
    updateStreamingMessage,
  } = useAgentChat();

  const streamMessage = async (
    content: string,
    role: AgentRole = "general",
    context?: AgentContext
  ) => {
    // Start conversation if needed
    if (!currentConversation) {
      startConversation(role, context);
    }

    const userMessage: AgentMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setStreaming(true);
    setError(null);

    try {
      const { currentConversation: conv } = useAgentChat.getState();
      if (!conv) throw new Error("No active conversation");

      const response = await fetch("/api/agents/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: conv.agentRole,
          messages: conv.messages,
          context: conv.context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";

      // Create initial assistant message
      addMessage({
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "text" && event.content) {
              assistantContent += event.content;
              updateStreamingMessage(event.content);
            }
          } catch {
            // Ignore parse errors for incomplete JSON
          }
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setStreaming(false);
    }
  };

  return streamMessage;
}
