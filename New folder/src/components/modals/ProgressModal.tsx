"use client";

import React from "react";
import { FONT_STYLES } from "@/constants/theme";

interface ProgressModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  title?: string;
  message?: string;
}

export default function ProgressModal({ 
  isOpen, 
  isDarkMode,
  title = "Processing Document",
  message = "Converting your document to markdown format..."
}: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: isDarkMode ? 'rgba(11, 11, 13, 0.8)' : 'rgba(255, 250, 245, 0.8)' }}
    >
      <div 
        className={`relative w-full max-w-md flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border-2 ${
          isDarkMode 
            ? 'bg-zinc-900/95 text-zinc-100 border-white/20 shadow-black/50' 
            : 'bg-white/95 text-gray-900 border-amber-200/60 shadow-black/20'
        }`}
      >
        <div className={`flex-shrink-0 flex items-center justify-center p-6 border-b backdrop-blur-sm rounded-t-3xl ${
          isDarkMode 
            ? 'border-white/20 bg-zinc-900/90' 
            : 'border-amber-200/50 bg-white/90'
        }`}>
          <h2 className="text-xl font-medium" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
            {title}
          </h2>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
          <p className={`text-sm text-center mb-6 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
            {message}
          </p>
          
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
            
            <div className="mt-4 text-center">
              <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                Please wait...
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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
    </div>
  );
}