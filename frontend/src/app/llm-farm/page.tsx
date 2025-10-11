"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Layout } from "@/components/ui/Layout";
import { streamMessage, uploadDocument, type DocumentAttachment } from "@/lib/llm-farm-api";
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
import { Paperclip, X, ChevronDown, Search } from "lucide-react";

export default function LLMFarmPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel>(DEFAULT_MODEL);
  const [inputMessage, setInputMessage] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setUploadedFiles([]);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles = Array.from(files);

    try {
      // Upload all files and get processed documents
      const uploadPromises = newFiles.map(file => uploadDocument(file));
      const results = await Promise.all(uploadPromises);

      // Add to uploaded documents
      setUploadedDocuments((prev) => [...prev, ...results]);

      // Also keep files for display
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(`Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

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

      // Store current documents for this message
      const messageDocuments = uploadedDocuments.length > 0 ? [...uploadedDocuments] : undefined;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
        documents: messageDocuments,  // Attach documents to message
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
      setUploadedFiles([]);
      setUploadedDocuments([]);  // Clear documents after sending

      try {
        let accumulatedContent = "";

        for await (const chunk of streamMessage({
          message: message,
          model: selectedModel.modelId,
          documents: messageDocuments  // Send documents with message
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
    [currentConversationId, currentConversation, conversations, selectedModel, isLoading, uploadedDocuments]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim()) {
        handleSendMessage(inputMessage);
      }
    }
  };

  const filteredModels = LLM_MODELS.filter(model =>
    model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, LLMModel[]>);

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
          className="fixed top-20 left-4 z-50 p-2 rounded-lg transition-all duration-300 hover:opacity-80"
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
                className="w-full mb-4 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:opacity-90"
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
            <div className="space-y-6 mb-32">
              {currentConversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-4"
                  style={{
                    flexDirection: message.role === "user" ? "row-reverse" : "row"
                  }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold"
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
                    {/* Show attached documents for user messages */}
                    {message.role === "user" && message.documents && message.documents.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {message.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <Paperclip className="w-3 h-3" style={{ color: 'var(--blue-primary)' }} />
                            <span>{doc.filename}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              ({Math.round(doc.file_size / 1024)}KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
                        <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
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
              <div className="mb-2">
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span className="font-semibold">{selectedModel.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showModelSelector && (
                    <div
                      className="absolute bottom-full mb-2 left-0 w-[500px] max-h-[500px] rounded-xl shadow-2xl overflow-hidden"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {/* Search Header */}
                      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          <input
                            type="text"
                            placeholder="Search models..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>
                      </div>

                      {/* Model List */}
                      <div className="overflow-y-auto max-h-[400px]">
                        {Object.entries(groupedModels).map(([provider, models]) => (
                          <div key={provider}>
                            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              {provider}
                            </div>
                            {models.map((model) => (
                              <button
                                key={model.modelId}
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowModelSelector(false);
                                  setModelSearchQuery("");
                                }}
                                className="w-full text-left px-4 py-3 transition-all duration-300 hover:opacity-90"
                                style={{
                                  backgroundColor: model.modelId === selectedModel.modelId ? 'var(--blue-primary)' : 'transparent',
                                  color: model.modelId === selectedModel.modelId ? 'white' : 'var(--text-primary)'
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm">{model.name}</div>
                                    <div className="text-xs mt-1" style={{
                                      color: model.modelId === selectedModel.modelId ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                                    }}>
                                      {model.description}
                                    </div>
                                  </div>
                                  <div className="text-xs ml-2" style={{
                                    color: model.modelId === selectedModel.modelId ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'
                                  }}>
                                    ${model.pricing.input.toFixed(2)}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Status */}
              {isUploading && (
                <div className="mb-2 px-3 py-2 rounded-lg text-sm" style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--blue-primary)'
                }}>
                  Uploading and processing documents...
                </div>
              )}

              {/* File Upload Area */}
              {uploadedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <Paperclip className="w-4 h-4" style={{ color: 'var(--blue-primary)' }} />
                      <span className="max-w-[200px] truncate">{file.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        ({Math.round(file.size / 1024)}KB)
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--text-secondary)' }}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.ppt,.pptx,.py,.js,.ts,.java,.cpp,.c,.html,.css,.json,.xml"
                />

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-lg transition-all duration-300 hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message LLM Farm..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 px-4 py-3 rounded-lg transition-all duration-300 resize-none"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      minHeight: '48px',
                      maxHeight: '200px'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-3 rounded-lg font-medium transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--blue-primary)',
                      color: 'white',
                      opacity: (isLoading || !inputMessage.trim()) ? 0.5 : 1,
                      cursor: (isLoading || !inputMessage.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
