"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { LLM_MODELS, type LLMModel } from "@/lib/llm-models";

interface ModelSelectorProps {
  selectedModel: LLMModel;
  onModelChange: (model: LLMModel) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ModelSelector({ selectedModel, onModelChange, isOpen, onToggle }: ModelSelectorProps): React.JSX.Element {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="bg-white dark:bg-black text-black dark:text-white text-sm border-[0.5px] border-black dark:border-white rounded-full px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors flex items-center gap-2 h-auto"
        aria-label="Select model"
      >
        {selectedModel.name}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-96 max-h-96 overflow-y-auto bg-white dark:bg-black border-[0.5px] border-black dark:border-white rounded-2xl p-4 shadow-lg z-50">
          <h3 className="text-sm font-semibold mb-3">Select AI Model</h3>
          <div className="space-y-2">
            {LLM_MODELS.map((model) => (
              <button
                key={model.modelId}
                onClick={() => {
                  onModelChange(model);
                  onToggle?.();
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedModel.modelId === model.modelId
                    ? "bg-gray-100 dark:bg-gray-900"
                    : "hover:bg-gray-50 dark:hover:bg-gray-950"
                }`}
              >
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{model.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
