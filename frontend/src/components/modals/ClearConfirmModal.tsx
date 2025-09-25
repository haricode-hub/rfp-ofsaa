"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FONT_STYLES } from "@/constants/theme";

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDarkMode: boolean;
}

export default function ClearConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isDarkMode 
}: ClearConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: isDarkMode ? 'rgba(11, 11, 13, 0.8)' : 'rgba(255, 250, 245, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-md flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border-2 ${
          isDarkMode 
            ? 'bg-zinc-900/95 text-zinc-100 border-white/20 shadow-black/50' 
            : 'bg-white/95 text-gray-900 border-blue-200/60 shadow-black/20'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex-shrink-0 flex items-center justify-between p-6 border-b backdrop-blur-sm rounded-t-3xl ${
          isDarkMode 
            ? 'border-white/20 bg-zinc-900/90' 
            : 'border-blue-200/50 bg-white/90'
        }`}>
          <h2 className="text-xl font-medium" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
            Clear Document
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-2xl transition-all duration-200 shadow-lg ${
              isDarkMode 
                ? 'hover:bg-white/10 text-zinc-300/90 hover:text-zinc-200 shadow-white/10' 
                : 'hover:bg-blue-100 text-gray-600 hover:text-blue-900 shadow-black/10'
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 p-6" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
            Are you sure you want to clear the loaded document? This action cannot be undone.
          </p>
        </div>

        <div className={`flex-shrink-0 flex justify-end gap-3 p-6 border-t backdrop-blur-sm rounded-b-3xl ${
          isDarkMode 
            ? 'border-white/20 bg-zinc-900/90' 
            : 'border-blue-200/50 bg-white/90'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/20 shadow-white/10' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-black/10'
            }`}
            style={{ fontWeight: FONT_STYLES.fontWeight.medium }}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg ${
              isDarkMode 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
            }`}
            style={{ fontWeight: FONT_STYLES.fontWeight.medium }}
          >
            Yes, Clear
          </button>
        </div>
      </div>
    </div>
  );
}