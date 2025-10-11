"use client";

import React, { useState, useRef, useCallback } from "react";
import { ArrowUp, Globe, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/llm-farm/model-selector";
import type { LLMModel } from "@/lib/llm-models";

interface SearchInputProps {
  onSendMessage: (message: string, modelId: string, modelName: string) => void;
  isLoading: boolean;
  selectedModel: LLMModel;
  onModelChange: (model: LLMModel) => void;
}

export function SearchInput({
  onSendMessage,
  isLoading,
  selectedModel,
  onModelChange,
}: SearchInputProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState("");
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number): void => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleSubmit = useCallback((): void => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading) return;

    onSendMessage(trimmedValue, selectedModel.modelId, selectedModel.name);
    setInputValue("");
    textareaRef.current?.focus();
  }, [inputValue, isLoading, onSendMessage, selectedModel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-[0.5px] border-black dark:border-white rounded-[32px] bg-white dark:bg-black overflow-hidden">
      {/* Text Area Compartment */}
      <div className="px-6 pt-4 pb-2">
        {uploadedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white dark:bg-black border-[0.5px] border-black dark:border-white rounded-full px-3 py-1.5 text-sm"
              >
                <span className="text-black dark:text-white truncate max-w-[200px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to know?"
          rows={1}
          disabled={isLoading}
          className="w-full bg-white dark:bg-black text-black dark:text-white text-base placeholder:text-black dark:placeholder:text-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none shadow-none min-h-[60px] max-h-[300px] overflow-auto p-0 disabled:opacity-50"
        />
      </div>

      {/* Separator (invisible) */}
      <div />

      {/* Buttons Compartment */}
      <div className="px-5 pt-1 pb-4 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload files"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFileButtonClick}
            className="w-9 h-9 border-[0.5px] rounded-full flex items-center justify-center transition-colors bg-white dark:bg-black border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer"
            aria-label="Upload file"
            title="Upload file"
          >
            <Paperclip className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
            className={`w-9 h-9 border-[0.5px] rounded-full flex items-center justify-center transition-colors ${
              isWebSearchEnabled
                ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black cursor-pointer"
                : "bg-white dark:bg-black border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer"
            }`}
            aria-label="Toggle web search"
            title={isWebSearchEnabled ? "Web search enabled" : "Web search disabled"}
          >
            <Globe className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={isLoading || !inputValue.trim()}
            className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Submit"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
