"use client";

import React from "react";
import { THEME_COLORS } from "@/constants/theme";

interface AnimatedBackgroundProps {
  isDarkMode: boolean;
}

export default function AnimatedBackground({ isDarkMode }: AnimatedBackgroundProps) {
  return (
    <>
      <style jsx>{`
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
      `}</style>

      <div className={`relative h-screen w-full overflow-hidden`}
           style={{ backgroundColor: isDarkMode ? THEME_COLORS.dark.background : THEME_COLORS.light.background }}>
        {isDarkMode ? (
          <div className="absolute inset-0 opacity-70">
            <div className="animated-gradient absolute top-0 -left-1/4 h-[150%] w-[150%] bg-gradient-to-br from-emerald-500/20 via-teal-600/15 to-cyan-500/20 blur-3xl" />
            <div className="animated-gradient-2 absolute -top-1/4 right-0 h-[150%] w-[150%] bg-gradient-to-bl from-violet-600/25 via-fuchsia-600/20 to-pink-500/25 blur-3xl" />
            <div className="animated-gradient-3 absolute bottom-0 left-1/3 h-[120%] w-[120%] bg-gradient-to-tr from-indigo-600/20 via-blue-600/15 to-purple-600/20 blur-3xl" />
            <div className="animated-gradient absolute top-1/2 right-1/4 h-[100%] w-[100%] bg-gradient-to-tl from-rose-600/15 via-orange-600/10 to-amber-600/15 blur-3xl" />
          </div>
        ) : (
          <div className="absolute inset-0 opacity-35">
            <div className="animated-gradient absolute top-0 -right-1/4 h-[140%] w-[140%] bg-gradient-to-bl from-rose-400/60 via-pink-300/40 to-transparent blur-3xl" />
            <div className="animated-gradient-2 absolute -bottom-1/4 left-0 h-[140%] w-[140%] bg-gradient-to-tr from-amber-400/50 via-orange-300/30 to-transparent blur-3xl" />
            <div className="animated-gradient-3 absolute top-1/4 left-1/4 h-[100%] w-[100%] bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-transparent blur-3xl" />
            <div className="animated-gradient-4 absolute bottom-0 right-0 h-[120%] w-[120%] bg-gradient-to-tl from-violet-400/50 via-purple-300/30 to-transparent blur-3xl" />
            <div className="animated-gradient-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] bg-gradient-to-r from-sky-400/30 via-transparent to-indigo-400/30 blur-3xl" />
          </div>
        )}
      </div>
    </>
  );
}