"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Layout } from "@/components/ui/Layout";
import { streamMessage } from "@/lib/llm-farm-api";
import { LLM_MODELS, DEFAULT_MODEL, type LLMModel } from "@/lib/llm-models";
import {
  loadConversations,
  saveConversation,
  deleteConversation as deleteConversationFromStorage,
  createNewConversation,
  generateConversationTitle,
  type Message,
  type Conversation,
} from "@/lib/llm-storage";
import ReactMarkdown from 'react-markdown';

export default function LLMFarmPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel>(DEFAULT_MODEL);
  const [inputMessage, setInputMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);

    if (loaded.length > 0) {
      setCurrentConversationId(loaded[0].id);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, currentConversationId]);

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  const handleNewChat = useCallback((): void => {
    const newConversation = createNewConversation();
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    saveConversation(newConversation);
    setShowSidebar(false);
  }, []);

  const handleSelectConversation = useCallback((conversationId: string): void => {
    setCurrentConversationId(conversationId);
    setShowSidebar(false);
  }, []);

  const handleDeleteConversation = useCallback((conversationId: string): void => {
    deleteConversationFromStorage(conversationId);
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

    if (currentConversationId === conversationId) {
      const remaining = conversations.filter((conv) => conv.id !== conversationId);
      if (remaining.length > 0) {
        setCurrentConversationId(remaining[0].id);
      } else {
        const newConversation = createNewConversation();
        setConversations([newConversation]);
        setCurrentConversationId(newConversation.id);
        saveConversation(newConversation);
      }
    }
  }, [conversations, currentConversationId]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      let conversationId = currentConversationId;
      let conversation = currentConversation;

      if (!conversationId) {
        const newConversation = createNewConversation();
        setConversations((prev) => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);
        saveConversation(newConversation);
        conversationId = newConversation.id;
        conversation = newConversation;
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: selectedModel.name,
      };

      const updatedConversation: Conversation = {
        ...conversation!,
        messages: [...(conversation?.messages || []), userMessage, assistantMessage],
        updatedAt: new Date(),
        modelId: selectedModel.modelId,
      };

      if (updatedConversation.messages.length === 2) {
        updatedConversation.title = generateConversationTitle([userMessage]);
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? updatedConversation : conv
        )
      );

      setIsLoading(true);
      setInputMessage("");

      try {
        let accumulatedContent = "";

        for await (const chunk of streamMessage({
          message,
          model: selectedModel.modelId
        })) {
          accumulatedContent += chunk.content;

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== conversationId) return conv;

              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ),
                updatedAt: new Date(),
              };
            })
          );
        }

        const finalConversation = conversations.find(
          (conv) => conv.id === conversationId
        );
        if (finalConversation) {
          saveConversation(finalConversation);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== conversationId) return conv;

            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: `**Error**: ${errorMessage}\n\nPlease try again or check your connection.`,
                    }
                  : msg
              ),
              updatedAt: new Date(),
            };
          })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversationId, currentConversation, conversations, selectedModel, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage);
    }
  };

  const hasMessages = (currentConversation?.messages.length || 0) > 0;

  return (
    <Layout showNavigation={true} showFooter={false}>
      <div className="min-h-screen transition-colors duration-300"
           style={{
             backgroundColor: 'var(--bg-primary)',
             color: 'var(--text-primary)',
             paddingTop: '64px'
           }}>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-20 left-4 z-50 p-2 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 z-40 flex" onClick={() => setShowSidebar(false)}>
            <div
              className="w-80 h-full p-4 overflow-y-auto"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleNewChat}
                className="w-full mb-4 px-4 py-2 rounded-lg font-medium transition-all duration-300"
                style={{
                  backgroundColor: 'var(--blue-primary)',
                  color: 'white'
                }}
              >
                + New Chat
              </button>

              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div key={conv.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectConversation(conv.id)}
                      className="flex-1 text-left px-4 py-2 rounded-lg transition-all duration-300 truncate"
                      style={{
                        backgroundColor: conv.id === currentConversationId ? 'var(--blue-primary)' : 'transparent',
                        color: conv.id === currentConversationId ? 'white' : 'var(--text-primary)',
                      }}
                    >
                      {conv.title}
                    </button>
                    <button
                      onClick={() => handleDeleteConversation(conv.id)}
                      className="p-2 rounded-lg hover:bg-red-500 hover:bg-opacity-20 transition-all duration-300"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {hasMessages ? (
            <div className="space-y-6 mb-24">
              {currentConversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-4"
                  style={{
                    flexDirection: message.role === "user" ? "row-reverse" : "row"
                  }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: message.role === "user" ? 'var(--blue-primary)' : 'var(--bg-secondary)',
                      color: message.role === "user" ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    {message.role === "user" ? "U" : "AI"}
                  </div>
                  <div
                    className="flex-1 p-4 rounded-lg"
                    style={{
                      backgroundColor: message.role === "user" ? 'var(--bg-secondary)' : 'transparent',
                      border: message.role === "assistant" ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
                        <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.model && (
                      <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Model: {message.model}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--blue-primary)' }}>
                LLM Farm
              </h1>
              <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
                Chat with multiple AI models in one place
              </p>
            </div>
          )}

          {/* Input Area - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="max-w-4xl mx-auto">
              {/* Model Selector */}
              <div className="mb-2 relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="px-4 py-2 rounded-lg text-sm transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {selectedModel.name} <span className="ml-2">▼</span>
                </button>

                {showModelSelector && (
                  <div
                    className="absolute bottom-full mb-2 left-0 w-96 max-h-96 overflow-y-auto rounded-lg p-2 shadow-lg"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {LLM_MODELS.map((model) => (
                      <button
                        key={model.modelId}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelSelector(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg transition-all duration-300 hover:bg-opacity-80"
                        style={{
                          backgroundColor: model.modelId === selectedModel.modelId ? 'var(--blue-primary)' : 'transparent',
                          color: model.modelId === selectedModel.modelId ? 'white' : 'var(--text-primary)'
                        }}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs" style={{ color: model.modelId === selectedModel.modelId ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                          {model.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 input"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-300 btn btn-primary"
                  style={{
                    opacity: (isLoading || !inputMessage.trim()) ? 0.5 : 1
                  }}
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
