"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FONT_STYLES, SPACING } from "@/constants/theme";

interface HistoryEntry {
  value: string;
  timestamp: number;
  id: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  history: HistoryEntry[];
  onRestoreVersion: (index: number) => void;
}

export default function VersionHistoryModal({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  history,
  onRestoreVersion 
}: VersionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: isDarkMode ? 'rgba(11, 11, 13, 0.8)' : 'rgba(255, 250, 245, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[80vh] flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border-2 ${
          isDarkMode 
            ? 'bg-zinc-900/95 text-zinc-100 border-white/20 shadow-black/50' 
            : 'bg-white/95 text-gray-900 border-amber-200/60 shadow-black/20'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex-shrink-0 flex items-center justify-between p-6 border-b backdrop-blur-sm rounded-t-3xl ${
          isDarkMode 
            ? 'border-white/20 bg-zinc-900/90' 
            : 'border-amber-200/50 bg-white/90'
        }`}>
          <h2 className="text-xl font-medium" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
            Version History
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-2xl transition-all duration-200 shadow-lg ${
              isDarkMode 
                ? 'hover:bg-white/10 text-zinc-300/90 hover:text-zinc-200 shadow-white/10' 
                : 'hover:bg-amber-100 text-gray-600 hover:text-amber-900 shadow-black/10'
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto min-h-0" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
          {history.length === 0 ? (
            <p className={`text-center ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              No version history available yet. Start editing the canvas to create history.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <VersionHistoryItem
                  key={entry.id}
                  entry={entry}
                  index={index}
                  isCurrent={index === history.length - 1}
                  isDarkMode={isDarkMode}
                  onRestore={() => {
                    onRestoreVersion(index);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`flex-shrink-0 flex justify-end p-6 border-t backdrop-blur-sm rounded-b-3xl ${
          isDarkMode 
            ? 'border-white/20 bg-zinc-900/90' 
            : 'border-amber-200/50 bg-white/90'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/20 shadow-white/10' 
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200/50 shadow-amber-200/30'
            }`}
            style={{ fontWeight: FONT_STYLES.fontWeight.medium }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function VersionHistoryItem({ 
  entry, 
  index, 
  isCurrent, 
  isDarkMode, 
  onRestore 
}: {
  entry: HistoryEntry;
  index: number;
  isCurrent: boolean;
  isDarkMode: boolean;
  onRestore: () => void;
}) {
  const date = new Date(entry.timestamp);
  const timeString = date.toLocaleTimeString();
  const dateString = date.toLocaleDateString();
  const preview = entry.value.slice(0, SPACING.maxCharPreview) + 
                  (entry.value.length > SPACING.maxCharPreview ? '...' : '');
  
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isDarkMode 
          ? `${isCurrent ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'}` 
          : `${isCurrent ? 'bg-blue-50 border-blue-300' : 'bg-[#FFF8F0] border-amber-200/50 hover:bg-amber-50'}`
      }`}
      onClick={onRestore}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`text-sm font-medium ${
            isDarkMode ? 'text-zinc-200' : 'text-gray-900'
          }`}>
            Version {index + 1}
            {isCurrent && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDarkMode 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                Current
              </span>
            )}
          </span>
          <div className={`text-xs mt-1 ${
            isDarkMode ? 'text-zinc-400' : 'text-gray-500'
          }`}>
            {dateString} at {timeString}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestore();
          }}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-white/10 hover:bg-white/20 text-zinc-200' 
              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
          }`}
        >
          Restore
        </button>
      </div>
      {preview && (
        <div className={`text-sm mt-2 font-mono ${
          isDarkMode ? 'text-zinc-400/70' : 'text-gray-600'
        }`}>
          {preview}
        </div>
      )}
    </div>
  );
}