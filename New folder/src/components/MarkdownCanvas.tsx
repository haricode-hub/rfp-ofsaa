"use client";

import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { useHistory } from "@/hooks/useHistory";
import { FONT_STYLES, TIMING } from "@/constants/theme";

interface MarkdownCanvasProps {
  isDarkMode: boolean;
  selectedTextToAdd?: string;
  onStateChange?: (canUndo: boolean, canRedo: boolean) => void;
}

interface HistoryEntry {
  value: string;
  timestamp: number;
  id: string;
}

export interface MarkdownCanvasRef {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getHistory: () => HistoryEntry[];
  goToVersion: (index: number) => void;
  reset: () => void;
  getContent: () => string;
}

const MarkdownCanvas = forwardRef<MarkdownCanvasRef, MarkdownCanvasProps>(
  ({ isDarkMode, selectedTextToAdd, onStateChange }, ref) => {
  const history = useHistory<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [localText, setLocalText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useImperativeHandle(ref, () => ({
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    getHistory: history.getHistory,
    goToVersion: history.goToVersion,
    getContent: () => localText,
    reset: () => {
      history.reset();
      setLocalText("");
      setIsEditMode(true);
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }
    }
  }));

  // Sync localText with history value (on mount and history changes)
  useEffect(() => {
    setLocalText(history.value);
  }, [history.value]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(history.canUndo, history.canRedo);
  }, [history.canUndo, history.canRedo, onStateChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalText(text);
    
    // Clear previous timeout
    if (autoPreviewTimeoutRef.current) {
      clearTimeout(autoPreviewTimeoutRef.current);
    }
    
    // After 5 seconds of inactivity: save to history AND switch to preview
    if (text.trim()) {
      autoPreviewTimeoutRef.current = setTimeout(() => {
        history.set(text);
        setIsEditMode(false);
      }, TIMING.delay.autoPreview);
    }
  }, [history]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Press Escape to preview immediately
    if (e.key === 'Escape' && localText.trim()) {
      e.preventDefault();
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }
      history.set(localText);
      setIsEditMode(false);
    }
    // Press Ctrl/Cmd + Enter to preview immediately (keep Tab for normal tab behavior)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && localText.trim()) {
      e.preventDefault();
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }
      history.set(localText);
      setIsEditMode(false);
    }
    // Let Enter key work normally for new lines - don't prevent default
  }, [localText, history]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text/plain");
    if (pastedText && pastedText.trim().length > 0) {
      const textarea = textareaRef.current;
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const currentText = localText;
        
        // Insert pasted text at cursor position, replacing any selected text
        const newText = currentText.substring(0, startPos) + pastedText + currentText.substring(endPos);
        
        setLocalText(newText);
        
        // Clear any pending timeout
        if (autoPreviewTimeoutRef.current) {
          clearTimeout(autoPreviewTimeoutRef.current);
        }
        
        // Update history immediately for paste
        history.set(newText);
        
        // Set cursor position after the pasted text
        setTimeout(() => {
          if (textarea) {
            const newCursorPos = startPos + pastedText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }
        }, 0);
        
        // Show preview after pasting large content
        if (pastedText.length > 100) {
          setTimeout(() => {
            setIsEditMode(false);
          }, TIMING.animation.fast);
        }
      }
    }
  }, [history, localText]);

  const handleClick = useCallback(() => {
    // Switch to edit mode when clicked
    setIsEditMode(true);
    // Sync localText with current history value
    setLocalText(history.value);
    // Clear any pending timeout
    if (autoPreviewTimeoutRef.current) {
      clearTimeout(autoPreviewTimeoutRef.current);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  }, [history.value]);

  useEffect(() => {
    // Focus textarea when in edit mode
    if (isEditMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditMode]);

  // Handle adding selected text to canvas
  useEffect(() => {
    if (selectedTextToAdd && selectedTextToAdd.trim()) {
      const textToAdd = selectedTextToAdd.trim();
      
      const separator = history.value.trim() ? '\n\n' : '';
      const newContent = history.value + separator + textToAdd;
      
      // Update both local text and history
      setLocalText(newContent);
      history.set(newContent);
      
      // Focus the textarea after updating content
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Set cursor to end of text
          const length = newContent.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, TIMING.animation.fast);
      
      setIsEditMode(true);
      
      // Clear any pending timeout
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }
      
      // Automatically switch to preview mode after adding text
      setTimeout(() => {
        setIsEditMode(false);
      }, TIMING.animation.slow);
    }
  }, [selectedTextToAdd, history]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }
    };
  }, []);

  if (!isEditMode && history.value.trim()) {
    // Show rendered markdown
    return (
      <div
        onClick={handleClick}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 cursor-text"
        style={{
          fontFamily: FONT_STYLES.fontFamily,
          fontWeight: FONT_STYLES.fontWeight.normal,
          fontSize: FONT_STYLES.fontSize.base,
          lineHeight: FONT_STYLES.lineHeight.relaxed,
          wordWrap: "break-word",
          overflowWrap: "break-word",
          hyphens: "auto",
          maxWidth: "100%",
        }}
      >
        <div 
          className="prose prose-sm max-w-none overflow-hidden"
          style={{ 
            wordWrap: "break-word", 
            overflowWrap: "break-word",
            maxWidth: "100%",
          }}
        >
          <MarkdownRenderer content={history.value} isDarkMode={isDarkMode} />
        </div>
      </div>
    );
  }

  // Show textarea for editing
  return (
    <textarea
      ref={textareaRef}
      value={localText}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`flex-1 w-full resize-none bg-transparent p-4 focus:outline-none overflow-y-auto ${
        isDarkMode 
          ? 'text-zinc-200 placeholder:text-zinc-400/30' 
          : 'text-gray-900 placeholder:text-gray-500/50'
      }`}
      placeholder="Type or paste Markdown here..."
      style={{
        fontFamily: FONT_STYLES.fontFamily,
        fontWeight: FONT_STYLES.fontWeight.normal,
        fontSize: FONT_STYLES.fontSize.base,
        lineHeight: FONT_STYLES.lineHeight.relaxed,
        wordWrap: "break-word",
        overflowWrap: "break-word",
        minHeight: 0,
      }}
    />
  );
});

MarkdownCanvas.displayName = 'MarkdownCanvas';

export default MarkdownCanvas;