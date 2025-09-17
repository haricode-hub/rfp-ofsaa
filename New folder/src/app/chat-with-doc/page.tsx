"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, useTheme } from '@/components/ui/Layout';
import {
  ChevronDownIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ClockIcon,
  ArrowRightCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowUpTrayIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import MarkdownCanvas, { MarkdownCanvasRef } from "@/components/MarkdownCanvas";
import DocumentDisplay from "@/components/DocumentDisplay";
import UploadConfirmModal from "@/components/modals/UploadConfirmModal";
import TypingIndicator from "@/components/TypingIndicator";

function ChatWithDocContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showHelp, setShowHelp] = useState(false);
  const [canvasName, setCanvasName] = useState("New");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isCanvasMinimized, setIsCanvasMinimized] = useState(true);
  const [documentContent, setDocumentContent] = useState("");
  const [documentFilename, setDocumentFilename] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedTextReference, setSelectedTextReference] = useState<string>("");
  const [textToMoveToCanvas, setTextToMoveToCanvas] = useState<string>("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [chatQuery, setChatQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  interface HistoryEntry {
    value: string;
    timestamp: number;
    id: string;
  }
  const [, setVersionHistory] = useState<HistoryEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<MarkdownCanvasRef>(null);

  // Handle escape key to close modals and keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Handle escape for modals
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (showClearConfirm) {
          setShowClearConfirm(false);
        } else if (showVersionHistory) {
          setShowVersionHistory(false);
        } else if (showUploadConfirm) {
          setShowUploadConfirm(false);
        }
      }
      
      // Handle undo/redo shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        canvasRef.current?.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        canvasRef.current?.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        canvasRef.current?.redo();
      }
    };

    if (showHelp || showClearConfirm || showVersionHistory || showUploadConfirm) {
      document.addEventListener('keydown', handleKeyboard);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Still listen for undo/redo when no modals are open
      document.addEventListener('keydown', handleKeyboard);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      if (!showHelp && !showClearConfirm && !showVersionHistory && !showUploadConfirm) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [showHelp, showClearConfirm, showVersionHistory, showUploadConfirm]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Handle canvas name editing
  const startEditing = () => {
    setTempName(canvasName);
    setIsEditingName(true);
  };

  const saveName = () => {
    if (tempName.trim()) {
      setCanvasName(tempName.trim());
    }
    setIsEditingName(false);
    setTempName("");
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    setTempName("");
  };

  // Download canvas content as markdown file
  const downloadCanvasContent = () => {
    // Get content from the MarkdownCanvas component
    const content = canvasRef.current?.getContent() || '';
    
    if (!content.trim()) {
      alert('No content to download. Please add some text to the canvas first.');
      return;
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${canvasName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Handle canvas minimize/restore
  const minimizeCanvas = () => {
    setIsCanvasMinimized(true);
  };

  const restoreCanvas = () => {
    setIsCanvasMinimized(false);
  };

  // Handle file upload
  const handleFileSelect = () => {
    // Check if there's already content loaded
    if (documentContent.trim()) {
      setShowUploadConfirm(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleConfirmedUpload = () => {
    setShowUploadConfirm(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setShowProgress(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setDocumentContent(result.content);
      setDocumentFilename(result.filename);
      
      // Clear any selected text reference from previous file
      setSelectedTextReference("");
      
      // Clear canvas content when new file is uploaded
      canvasRef.current?.reset();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload and convert document. Please try again.');
    } finally {
      setIsUploading(false);
      setShowProgress(false);
    }
  };

  // Handle clear document
  const handleClearDocument = () => {
    setDocumentContent("");
    setDocumentFilename("");
    setShowClearConfirm(false);
  };

  // Handle text selection actions
  const handleAskWrite = (selectedText: string) => {
    setSelectedTextReference(selectedText);
    // Focus the chat input
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 100);
  };

  const handleMoveToCanvas = (selectedText: string, markdownText?: string) => {
    // Restore canvas if minimized
    if (isCanvasMinimized) {
      setIsCanvasMinimized(false);
    }
    // Set text to be moved to canvas - use markdown if available, otherwise use plain text
    setTextToMoveToCanvas(markdownText || selectedText);
  };

  // Clear textToMoveToCanvas after it's been processed
  useEffect(() => {
    if (textToMoveToCanvas) {
      const timer = setTimeout(() => {
        setTextToMoveToCanvas("");
      }, 200); // Clear after a short delay to ensure MarkdownCanvas processes it
      
      return () => clearTimeout(timer);
    }
  }, [textToMoveToCanvas]);

  // Handle chat submission
  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Automatically restore canvas if minimized when user submits
    if (isCanvasMinimized) {
      setIsCanvasMinimized(false);
    }
    
    if (!chatQuery.trim() || !documentContent.trim() || isGenerating) {
      return;
    }

    console.log('Starting chat submission:', { query: chatQuery, context: selectedTextReference });
    
    setIsGenerating(true);
    const currentQuery = chatQuery;
    const currentContext = selectedTextReference;
    setChatQuery("");
    setSelectedTextReference("");

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          context: currentContext,
          canvas_content: canvasRef.current?.getHistory().slice(-1)[0]?.value || ""
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      let accumulatedResponse = "";
      const decoder = new TextDecoder();

      console.log('Starting to read stream...');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream finished');
          break;
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('Received [DONE] signal');
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                console.error('Stream error:', parsed.error);
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                accumulatedResponse += parsed.content;
                console.log('Accumulated response length:', accumulatedResponse.length);
              }
            } catch (err) {
              console.error('Error parsing chunk:', err, 'Data:', data);
            }
          }
        }
      }

      console.log('Final accumulated response:', accumulatedResponse);
      
      // Add response to canvas
      if (accumulatedResponse.trim()) {
        setTextToMoveToCanvas(accumulatedResponse);
        console.log('Added response to canvas');
      } else {
        console.warn('No response content to add to canvas');
        setTextToMoveToCanvas("**No response generated. Please try again.**");
      }

    } catch (error) {
      console.error('Chat submission error:', error);
      // Show error message to user
      const errorMessage = `**Error:** ${error instanceof Error ? error.message : 'Failed to get response from AI. Please try again.'}`;
      setTextToMoveToCanvas(errorMessage);
    } finally {
      setIsGenerating(false);
      console.log('Chat submission finished');
    }
  };

  return (
    <div
      className="min-h-screen w-full transition-colors duration-300"
      style={{
        // Inter Medium across the app
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        fontWeight: 500,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Import Inter 500 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap');
        
        @keyframes gradient-shift {
          0%, 100% {
            transform: translate(0%, 0%) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(10%, -10%) rotate(90deg) scale(1.1);
          }
          50% {
            transform: translate(-15%, 15%) rotate(180deg) scale(0.9);
          }
          75% {
            transform: translate(20%, -5%) rotate(270deg) scale(1.05);
          }
        }
        
        @keyframes gradient-rotate {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.2);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        
        @keyframes gradient-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        @keyframes gradient-flow {
          0% {
            transform: translateX(-100%) translateY(0%) rotate(0deg);
          }
          50% {
            transform: translateX(100%) translateY(-50%) rotate(180deg);
          }
          100% {
            transform: translateX(-100%) translateY(0%) rotate(360deg);
          }
        }
        
        .animated-gradient {
          animation: gradient-shift 25s ease-in-out infinite;
        }
        
        .animated-gradient-2 {
          animation: gradient-shift 20s ease-in-out infinite reverse;
        }
        
        .animated-gradient-3 {
          animation: gradient-rotate 30s ease-in-out infinite;
        }
        
        .animated-gradient-4 {
          animation: gradient-flow 35s ease-in-out infinite;
        }
        
        .animated-gradient-5 {
          animation: gradient-pulse 15s ease-in-out infinite;
        }
        
        @keyframes squiggly-wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .squiggly-progress {
          position: relative;
          overflow: hidden;
          border-radius: inherit;
        }
        
        .squiggly-progress::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            currentColor 50%,
            transparent 100%
          );
          border-radius: inherit;
          animation: squiggly-wave 2s ease-in-out infinite;
        }
        
        .squiggly-progress::after {
          content: '';
          position: absolute;
          top: 50%;
          left: -100%;
          width: 200%;
          height: 2px;
          background: currentColor;
          transform: translateY(-50%);
          clip-path: polygon(
            0% 50%,
            5% 20%, 10% 80%, 15% 20%, 20% 80%,
            25% 20%, 30% 80%, 35% 20%, 40% 80%,
            45% 20%, 50% 80%, 55% 20%, 60% 80%,
            65% 20%, 70% 80%, 75% 20%, 80% 80%,
            85% 20%, 90% 80%, 95% 20%, 100% 50%
          );
          animation: squiggly-wave 2s ease-in-out infinite;
        }
      `}</style>

      {/* App background */}
      <div className={`relative w-full overflow-hidden ${isDarkMode ? 'bg-[#0B0B0D]' : 'bg-[#FFFAF5]'}`}
           style={{ height: 'calc(100vh - 4rem)', marginTop: '4rem' }}>
        {/* Animated gradient backgrounds */}
        {isDarkMode ? (
          <>
            <div className="absolute inset-0 opacity-70">
              <div className="animated-gradient absolute top-0 -left-1/4 h-[150%] w-[150%] bg-gradient-to-br from-emerald-500/20 via-teal-600/15 to-cyan-500/20 blur-3xl" />
              <div className="animated-gradient-2 absolute -top-1/4 right-0 h-[150%] w-[150%] bg-gradient-to-bl from-violet-600/25 via-fuchsia-600/20 to-pink-500/25 blur-3xl" />
              <div className="animated-gradient-3 absolute bottom-0 left-1/3 h-[120%] w-[120%] bg-gradient-to-tr from-indigo-600/20 via-blue-600/15 to-purple-600/20 blur-3xl" />
              <div className="animated-gradient absolute top-1/2 right-1/4 h-[100%] w-[100%] bg-gradient-to-tl from-rose-600/15 via-orange-600/10 to-amber-600/15 blur-3xl" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-35">
              <div className="animated-gradient absolute top-0 -right-1/4 h-[140%] w-[140%] bg-gradient-to-bl from-rose-400/60 via-pink-300/40 to-transparent blur-3xl" />
              <div className="animated-gradient-2 absolute -bottom-1/4 left-0 h-[140%] w-[140%] bg-gradient-to-tr from-amber-400/50 via-orange-300/30 to-transparent blur-3xl" />
              <div className="animated-gradient-3 absolute top-1/4 left-1/4 h-[100%] w-[100%] bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-transparent blur-3xl" />
              <div className="animated-gradient-4 absolute bottom-0 right-0 h-[120%] w-[120%] bg-gradient-to-tl from-violet-400/50 via-purple-300/30 to-transparent blur-3xl" />
              <div className="animated-gradient-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] bg-gradient-to-r from-sky-400/30 via-transparent to-indigo-400/30 blur-3xl" />
            </div>
          </>
        )}

        {/* Top left controls */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all duration-200 shadow-md hover:transform hover:scale-105"
            style={{
              backgroundColor: 'var(--blue-secondary)',
              color: 'var(--blue-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--blue-light)';
              e.currentTarget.style.color = 'var(--blue-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
              e.currentTarget.style.color = 'var(--blue-primary)';
            }}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
          
          {/* Upload button */}
          <button
            onClick={handleFileSelect}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium border-2 shadow-lg hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--blue-secondary)',
              borderColor: 'var(--blue-secondary)',
              color: 'var(--blue-primary)'
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                e.currentTarget.style.borderColor = 'var(--blue-light)';
                e.currentTarget.style.color = 'var(--blue-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                e.currentTarget.style.borderColor = 'var(--blue-secondary)';
                e.currentTarget.style.color = 'var(--blue-primary)';
              }
            }}
            aria-label="Upload file"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {isUploading ? 'Uploading...' : 'Upload'}
            </span>
          </button>

          {/* Clear button - only show when there's content */}
          {documentContent && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium border-2 shadow-lg hover:transform hover:scale-105"
              style={{
                backgroundColor: 'var(--blue-secondary)',
                borderColor: 'var(--blue-secondary)',
                color: 'var(--blue-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                e.currentTarget.style.borderColor = 'var(--blue-light)';
                e.currentTarget.style.color = 'var(--blue-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                e.currentTarget.style.borderColor = 'var(--blue-secondary)';
                e.currentTarget.style.color = 'var(--blue-primary)';
              }}
              aria-label="Clear document"
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}

          {/* Filename display */}
          {documentFilename && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              isDarkMode 
                ? 'bg-white/5 text-zinc-300' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              <span className={`${
                !isCanvasMinimized ? 'max-w-[200px] truncate block' : ''
              }`}>
                {documentFilename}
              </span>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Two-panel layout */}
        <div className="relative h-full w-full flex flex-col md:flex-row">
          {/* Left: Chat column */}
          <div className={`relative flex h-full flex-col flex-shrink-0 ${
            isCanvasMinimized ? 'w-full' : 'w-full md:w-1/2'
          }`}>
            {/* Document content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <DocumentDisplay 
                isDarkMode={isDarkMode}
                content={documentContent}
                isCanvasMinimized={isCanvasMinimized}
                onAskWrite={handleAskWrite}
                onMoveToCanvas={handleMoveToCanvas}
              />
            </div>
            
            {/* Bottom composer - centered */}
            <div className="flex items-center justify-center pb-8 pt-8">
              <div className={`w-full max-w-[720px] px-4 transition-all duration-300 ${
                isGenerating ? 'transform scale-[1.02]' : ''
              }`}>
                <div className="flex flex-col gap-2">
                  {/* Selected text reference */}
                  {selectedTextReference && (
                    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${
                      isDarkMode 
                        ? 'border-white/10 bg-white/[0.03]' 
                        : 'border-amber-200/50 bg-[#FFF8F0]'
                    }`}>
                      <div className={`mt-0.5 ${
                        isDarkMode ? 'text-zinc-400' : 'text-gray-600'
                      }`}>
                        <ArrowUturnRightIcon className="h-4 w-4" />
                      </div>
                      <div 
                        className={`flex-1 text-sm ${
                          isDarkMode ? 'text-zinc-300' : 'text-gray-700'
                        }`}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.4'
                        }}
                      >
                        &ldquo;{selectedTextReference}&rdquo;
                      </div>
                      <button
                        onClick={() => setSelectedTextReference("")}
                        className={`transition-colors p-1 rounded ${
                          isDarkMode 
                            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-amber-100'
                        }`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Composer */}
                  <div className="flex items-center gap-2">
                    <div className={`flex w-full items-center gap-3 rounded-full border px-4 py-3 transition-all backdrop-blur-xl shadow-lg ${
                      !documentContent.trim() 
                        ? (isDarkMode 
                          ? 'border-white/30 bg-zinc-900/80 opacity-70' 
                          : 'border-amber-300/60 bg-white/85 opacity-70'
                        )
                        : (isDarkMode 
                          ? 'border-white/40 bg-zinc-900/90' 
                          : 'border-amber-300/80 bg-white/95'
                        )
                    } ${
                      isGenerating 
                        ? (isDarkMode 
                          ? 'ring-2 ring-blue-500/20 shadow-blue-500/10' 
                          : 'ring-2 ring-blue-400/30 shadow-blue-400/15'
                        ) 
                        : ''
                    }`}>
                      <button 
                        disabled={!documentContent.trim()}
                        className={`transition-colors ${
                          !documentContent.trim()
                            ? 'text-zinc-500/50 cursor-not-allowed'
                            : (isDarkMode 
                              ? 'text-zinc-300/90 hover:text-zinc-200' 
                              : 'text-gray-600 hover:text-gray-800'
                            )
                        }`}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                      <form onSubmit={handleChatSubmit} className="w-full">
                        <input
                          ref={chatInputRef}
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          disabled={!documentContent.trim() || isGenerating}
                          className={`w-full bg-transparent text-[15px] focus:outline-none ${
                            !documentContent.trim() || isGenerating
                              ? 'cursor-not-allowed'
                              : ''
                          } ${
                            isDarkMode 
                              ? 'text-zinc-200 placeholder:text-zinc-400/70' 
                              : 'text-gray-900 placeholder:text-gray-500'
                          }`}
                          placeholder={!documentContent.trim() ? "Upload a document first to start chatting" : (isGenerating ? "Generating response..." : "Ask or Make changes")}
                          style={{ fontWeight: 500 }}
                        />
                      </form>
                      {/* Right actions */}
                      <button 
                        type="button"
                        onClick={handleChatSubmit}
                        disabled={!documentContent.trim() || !chatQuery.trim() || isGenerating}
                        className={`transition-colors ${
                          !documentContent.trim() || !chatQuery.trim() || isGenerating
                            ? 'text-zinc-500/50 cursor-not-allowed'
                            : (isDarkMode 
                              ? 'text-zinc-300/90 hover:text-zinc-200' 
                              : 'text-gray-600 hover:text-gray-800'
                            )
                        }`}
                      >
                        <ArrowRightCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Canvas column */}
          {!isCanvasMinimized && (
            <div className={`relative hidden h-full flex-col border-l-2 md:flex w-full md:w-1/2 flex-shrink-0 ${
              isDarkMode ? 'border-white/30' : 'border-gray-300'
            }`}>
            {/* Canvas header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${
              isDarkMode ? 'border-white/30' : 'border-gray-300'
            }`}>
              <div className={`flex items-center gap-2 ${
                isDarkMode ? 'text-zinc-200' : 'text-gray-700'
              }`}>
                <button
                  onClick={minimizeCanvas}
                  className="p-2 rounded-lg transition-all duration-200 shadow-sm hover:transform hover:scale-110"
                  style={{
                    backgroundColor: 'var(--blue-secondary)',
                    color: 'var(--blue-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                    e.currentTarget.style.color = 'var(--blue-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                    e.currentTarget.style.color = 'var(--blue-primary)';
                  }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1 text-sm">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      onBlur={saveName}
                      className={`bg-transparent border-none outline-none text-sm px-1 py-0.5 rounded ${
                        isDarkMode ? 'text-zinc-200' : 'text-gray-700'
                      }`}
                      style={{ minWidth: '60px', maxWidth: '200px' }}
                    />
                  ) : (
                    <span 
                      className="opacity-90 cursor-pointer hover:opacity-100 transition-opacity px-1 py-0.5 rounded hover:bg-white/5"
                      onClick={startEditing}
                    >
                      {canvasName}
                    </span>
                  )}
                  <ChevronDownIcon className="h-4 w-4 opacity-80" />
                </div>
              </div>
              <div className={`flex items-center gap-3 ml-auto ${
                isDarkMode ? 'text-zinc-300/80' : 'text-gray-600'
              }`}>
                <button 
                  onClick={() => {
                    const history = canvasRef.current?.getHistory();
                    if (history) {
                      setVersionHistory(history);
                      setShowVersionHistory(true);
                    }
                  }}
                  className="p-2 rounded-lg transition-all duration-200 shadow-sm hover:transform hover:scale-110"
                  style={{
                    backgroundColor: 'var(--blue-secondary)',
                    color: 'var(--blue-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                    e.currentTarget.style.color = 'var(--blue-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                    e.currentTarget.style.color = 'var(--blue-primary)';
                  }}
                  title="Version History"
                >
                  <ClockIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => canvasRef.current?.undo()}
                  disabled={!canUndo}
                  className="p-2 rounded-lg transition-all duration-200 shadow-sm hover:transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canUndo ? 'var(--blue-secondary)' : 'var(--bg-tertiary)',
                    color: canUndo ? 'var(--blue-primary)' : 'var(--text-muted)'
                  }}
                  onMouseEnter={(e) => {
                    if (canUndo) {
                      e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                      e.currentTarget.style.color = 'var(--blue-accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canUndo) {
                      e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                      e.currentTarget.style.color = 'var(--blue-primary)';
                    }
                  }}
                  title="Undo (Ctrl+Z)"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => canvasRef.current?.redo()}
                  disabled={!canRedo}
                  className="p-2 rounded-lg transition-all duration-200 shadow-sm hover:transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canRedo ? 'var(--blue-secondary)' : 'var(--bg-tertiary)',
                    color: canRedo ? 'var(--blue-primary)' : 'var(--text-muted)'
                  }}
                  onMouseEnter={(e) => {
                    if (canRedo) {
                      e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                      e.currentTarget.style.color = 'var(--blue-accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canRedo) {
                      e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                      e.currentTarget.style.color = 'var(--blue-primary)';
                    }
                  }}
                  title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
                >
                  <ArrowUturnRightIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={downloadCanvasContent}
                  className="p-2 rounded-lg transition-all duration-200 shadow-sm hover:transform hover:scale-110"
                  style={{
                    backgroundColor: 'var(--blue-secondary)',
                    color: 'var(--blue-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                    e.currentTarget.style.color = 'var(--blue-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                    e.currentTarget.style.color = 'var(--blue-primary)';
                  }}
                  title="Download Canvas Content"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setShowHelp(true)}
                  className="p-2 rounded-lg transition-all duration-200 shadow-sm hover:transform hover:scale-110"
                  style={{
                    backgroundColor: 'var(--blue-secondary)',
                    color: 'var(--blue-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                    e.currentTarget.style.color = 'var(--blue-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                    e.currentTarget.style.color = 'var(--blue-primary)';
                  }}
                  aria-label="Help & Guide"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Canvas body */}
            <div className={`relative flex-1 flex flex-col p-2 min-h-0 overflow-hidden transition-all duration-500 ${
              isGenerating 
                ? (isDarkMode 
                  ? 'ring-2 ring-blue-500/30 ring-inset animate-pulse' 
                  : 'ring-2 ring-blue-400/40 ring-inset animate-pulse'
                ) 
                : ''
            }`}>
              <MarkdownCanvas 
                ref={canvasRef}
                isDarkMode={isDarkMode}
                selectedTextToAdd={textToMoveToCanvas}
                onStateChange={(canUndo, canRedo) => {
                  setCanUndo(canUndo);
                  setCanRedo(canRedo);
                }}
              />
              
              {/* Centered Waveform Animation Overlay */}
              {isGenerating && (
                <TypingIndicator isDarkMode={isDarkMode} />
              )}
            </div>
          </div>
          )}

          {/* Restore Canvas Button (when minimized) */}
          {isCanvasMinimized && (
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={restoreCanvas}
                className="px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--blue-secondary)',
                  color: 'var(--blue-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--blue-light)';
                  e.currentTarget.style.color = 'var(--blue-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--blue-secondary)';
                  e.currentTarget.style.color = 'var(--blue-primary)';
                }}
                aria-label="Restore canvas"
              >
                <span className="text-sm font-medium">{canvasName}</span>
                <ChevronDownIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Progress Modal */}
        {showProgress && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ backgroundColor: isDarkMode ? 'rgba(11, 11, 13, 0.8)' : 'rgba(255, 250, 245, 0.8)' }}
          >
            <div 
              className={`relative w-full max-w-md flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border-2 ${
                isDarkMode 
                  ? 'bg-zinc-900/95 text-zinc-100 border-white/20 shadow-blue-500/50' 
                  : 'bg-white/95 text-gray-900 border-amber-200/60 shadow-blue-500/20'
              }`}
            >
              {/* Modal Header */}
              <div className={`flex-shrink-0 flex items-center justify-center p-6 border-b backdrop-blur-sm rounded-t-3xl ${
                isDarkMode 
                  ? 'border-white/20 bg-zinc-900/90' 
                  : 'border-amber-200/50 bg-white/90'
              }`}>
                <h2 className="text-xl font-medium" style={{ fontWeight: 500, color: 'var(--blue-primary)' }}>
                  Processing Document
                </h2>
              </div>

              {/* Modal Content */}
              <div className="flex-1 p-8 flex flex-col items-center" style={{ fontWeight: 500 }}>
                <p className={`text-sm text-center mb-6 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Converting your document to markdown format...
                </p>
                
                {/* Squiggly Progress Bar */}
                <div className="w-full max-w-xs">
                  <div className={`h-3 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'
                  }`}>
                    <div className={`h-full w-full rounded-full squiggly-progress ${
                      isDarkMode 
                        ? 'text-blue-400' 
                        : 'text-blue-600'
                    }`}></div>
                  </div>
                  
                  {/* Progress Text */}
                  <div className="mt-4 text-center">
                    <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Please wait...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Confirmation Modal */}
        <UploadConfirmModal
          isOpen={showUploadConfirm}
          onClose={() => setShowUploadConfirm(false)}
          onConfirm={handleConfirmedUpload}
          isDarkMode={isDarkMode}
          currentFileName={documentFilename}
        />

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ backgroundColor: isDarkMode ? 'rgba(11, 11, 13, 0.8)' : 'rgba(255, 250, 245, 0.8)' }}
            onClick={() => setShowClearConfirm(false)}
          >
            <div 
              className={`relative w-full max-w-md flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border-2 ${
                isDarkMode 
                  ? 'bg-zinc-900/95 text-zinc-100 border-white/20 shadow-blue-500/50' 
                  : 'bg-white/95 text-gray-900 border-amber-200/60 shadow-blue-500/20'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`flex-shrink-0 flex items-center justify-between p-6 border-b backdrop-blur-sm rounded-t-3xl ${
                isDarkMode 
                  ? 'border-white/20 bg-zinc-900/90' 
                  : 'border-amber-200/50 bg-white/90'
              }`}>
                <h2 className="text-xl font-medium" style={{ fontWeight: 500 }}>
                  Clear Document
                </h2>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`p-2 rounded-2xl transition-all duration-200 shadow-lg ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-zinc-300/90 hover:text-zinc-200 shadow-white/10' 
                      : 'hover:bg-amber-100 text-gray-600 hover:text-amber-900 shadow-blue-500/10'
                  }`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 p-6" style={{ fontWeight: 500 }}>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                  Are you sure you want to clear the loaded document? This action cannot be undone.
                </p>
              </div>

              {/* Modal Footer */}
              <div className={`flex-shrink-0 flex justify-end gap-3 p-6 border-t backdrop-blur-sm rounded-b-3xl ${
                isDarkMode 
                  ? 'border-white/20 bg-zinc-900/90' 
                  : 'border-amber-200/50 bg-white/90'
              }`}>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg ${
                    isDarkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/20 shadow-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-blue-500/10'
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  No
                </button>
                <button
                  onClick={handleClearDocument}
                  className={`px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg ${
                    isDarkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30' 
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  Yes, Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWithDoc() {
  return (
    <Layout showNavigation={true} showFooter={true}>
      <ChatWithDocContent />
    </Layout>
  );
}