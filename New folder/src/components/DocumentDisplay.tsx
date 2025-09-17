"use client";

import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import TextSelectionToolbar from "./TextSelectionToolbar";
import { FONT_STYLES } from "@/constants/theme";

interface DocumentDisplayProps {
  isDarkMode: boolean;
  content: string;
  isCanvasMinimized?: boolean;
  onAskWrite?: (selectedText: string) => void;
  onMoveToCanvas?: (selectedText: string, markdownText?: string) => void;
}

export default function DocumentDisplay({ 
  isDarkMode, 
  content, 
  isCanvasMinimized = false, 
  onAskWrite, 
  onMoveToCanvas 
}: DocumentDisplayProps) {
  if (!content) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Document header separator */}
        <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${
          isDarkMode ? 'border-white/30' : 'border-gray-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1">
              <div className="h-5 w-5"></div>
            </div>
          </div>
        </div>
        
        <div className={`flex-1 flex items-center justify-center ${
          isCanvasMinimized ? 'px-20' : 'px-6'
        }`}>
          <div className={`text-center ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
            <p className="text-sm">Upload a document to view its content here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Document header separator */}
      <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${
        isDarkMode ? 'border-white/30' : 'border-gray-300'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1">
            <div className="h-5 w-5"></div>
          </div>
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto overflow-x-hidden py-6 pb-4 ${
        isCanvasMinimized ? 'px-20' : 'px-6'
      }`}>
        <TextSelectionToolbar
          isDarkMode={isDarkMode}
          onAskWrite={onAskWrite}
          onMoveToCanvas={onMoveToCanvas}
        >
          <div 
            className="prose prose-sm max-w-none"
            style={{ 
              wordWrap: "break-word", 
              overflowWrap: "break-word",
              maxWidth: "100%",
              fontFamily: FONT_STYLES.fontFamily,
              fontWeight: FONT_STYLES.fontWeight.normal,
              fontSize: FONT_STYLES.fontSize.base,
              lineHeight: FONT_STYLES.lineHeight.relaxed,
            }}
          >
            <MarkdownRenderer content={content} isDarkMode={isDarkMode} />
          </div>
        </TextSelectionToolbar>
      </div>
    </div>
  );
}