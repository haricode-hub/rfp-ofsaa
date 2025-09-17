"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FONT_STYLES } from "@/constants/theme";

interface UploadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDarkMode: boolean;
  currentFileName?: string;
}

export default function UploadConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isDarkMode,
  currentFileName
}: UploadConfirmModalProps) {
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
            Replace Current Document?
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

        <div className="flex-1 p-6" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
            You currently have {currentFileName ? (
              <span className={`font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                &ldquo;{currentFileName}&rdquo;
              </span>
            ) : (
              'a document'
            )} loaded.
          </p>
          <p className={`text-sm mt-3 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
            Uploading a new file will replace the current content. Any selected text references will be cleared.
          </p>
          <p className={`text-sm mt-3 font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-amber-600'}`}>
            Do you want to continue?
          </p>
        </div>

        <div className={`flex-shrink-0 flex justify-end gap-3 p-6 border-t backdrop-blur-sm rounded-b-3xl ${
          isDarkMode 
            ? 'border-white/20 bg-zinc-900/90' 
            : 'border-amber-200/50 bg-white/90'
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-color)',
              fontWeight: FONT_STYLES.fontWeight.medium
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
            }`}
            style={{ fontWeight: FONT_STYLES.fontWeight.medium }}
          >
            Yes, Upload New File
          </button>
        </div>
      </div>
    </div>
  );
}