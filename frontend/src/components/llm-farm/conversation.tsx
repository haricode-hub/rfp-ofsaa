"use client";

import React, { useState, useEffect } from "react";
import type { Message } from "@/lib/llm-storage";
import { MessageDisplay } from "@/components/llm-farm/message-display";
import { Sparkles, Zap, Brain, Lightbulb, Stars } from "lucide-react";

interface ConversationProps {
  messages: Message[];
  isLoading: boolean;
}

const LOADING_ICONS = [Sparkles, Zap, Brain, Lightbulb, Stars];

export function Conversation({ messages, isLoading }: ConversationProps): React.JSX.Element {
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % LOADING_ICONS.length);
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const CurrentIcon = LOADING_ICONS[iconIndex];

  return (
    <div className="px-6 py-4">
      <div className="max-w-2xl mx-auto">
        {messages.map((message) => (
          <MessageDisplay key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6">
            <CurrentIcon className="h-5 w-5 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
