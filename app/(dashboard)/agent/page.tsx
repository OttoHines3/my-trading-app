"use client";

import { AgentChat } from "@/components/agents/AgentChat";

export default function AgentPage() {
  return (
    <div className="flex flex-col h-full p-6">
      <AgentChat className="flex-1 h-full" />
    </div>
  );
}
