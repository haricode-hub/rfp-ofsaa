"use client";

import React from "react";

interface TypingIndicatorProps {
  isDarkMode: boolean;
}

export default function TypingIndicator({ isDarkMode }: TypingIndicatorProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Three thinking dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              isDarkMode 
                ? 'bg-blue-400' 
                : 'bg-blue-600'
            }`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animation: 'thinkingBounce 1.4s ease-in-out infinite'
            }}
          />
        ))}
      </div>

      {/* AI Status Text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className={`text-sm font-medium ${
          isDarkMode 
            ? 'text-blue-300' 
            : 'text-blue-600'
        } animate-pulse`}>
          AI is thinking...
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes thinkingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}