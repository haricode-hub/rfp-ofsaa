"use client";

import React from "react";
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  BoltIcon, 
  CheckIcon, 
  CommandLineIcon, 
  BookOpenIcon, 
  RocketLaunchIcon, 
  LightBulbIcon, 
  SparklesIcon, 
  ViewfinderCircleIcon, 
  DevicePhoneMobileIcon, 
  MoonIcon 
} from "@heroicons/react/24/outline";
import { FONT_STYLES } from "@/constants/theme";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function HelpModal({ isOpen, onClose, isDarkMode }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: isDarkMode ? 'rgba(11, 11, 13, 0.8)' : 'rgba(255, 250, 245, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl backdrop-blur-xl border-2 ${
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
          <h2 className="text-2xl font-medium flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
            <DocumentTextIcon className="h-6 w-6" />
            Markdown Canvas Guide
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

        <div className="flex-1 p-6 space-y-8 overflow-y-auto min-h-0" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
          <HowItWorksSection isDarkMode={isDarkMode} />
          <KeyboardShortcutsSection isDarkMode={isDarkMode} />
          <MarkdownSyntaxSection isDarkMode={isDarkMode} />
          <AdvancedFeaturesSection isDarkMode={isDarkMode} />
          <TipsSection isDarkMode={isDarkMode} />
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
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <section>
      <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
        <BoltIcon className="h-5 w-5" />
        How the Canvas Works
      </h3>
      <div className="space-y-3 text-sm">
        <p className={isDarkMode ? 'text-zinc-200' : 'text-gray-900'}>
          The Markdown Canvas is a smart editor that switches between <strong>Edit Mode</strong> and <strong>Preview Mode</strong>:
        </p>
        <ul className="space-y-2 ml-4">
          <li className="flex items-start gap-2">
            <CheckIcon className="h-4 w-4 text-green-500 mt-1" />
            <span><strong>Edit Mode:</strong> Type or paste Markdown - shows as plain text</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="h-4 w-4 text-blue-500 mt-1" />
            <span><strong>Preview Mode:</strong> Shows beautifully rendered Markdown with formatting</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="h-4 w-4 text-purple-500 mt-1" />
            <span><strong>Auto-Switch:</strong> Automatically switches to preview 1.5 seconds after you stop typing</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckIcon className="h-4 w-4 text-orange-500 mt-1" />
            <span><strong>Click to Edit:</strong> Click anywhere in preview mode to edit again</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function KeyboardShortcutsSection({ isDarkMode }: { isDarkMode: boolean }) {
  const shortcuts = [
    { keys: ['Escape'], description: 'Preview Now', note: 'Instantly switch to preview mode' },
    { keys: ['Ctrl', 'Enter'], description: 'Preview Now', note: 'Alternative preview shortcut' },
    { keys: ['Enter'], description: 'New Line', note: 'Create new line (normal behavior)' },
    { keys: ['Click'], description: 'Edit Mode', note: 'Click preview to return to editing' },
  ];

  return (
    <section>
      <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
        <CommandLineIcon className="h-5 w-5" />
        Keyboard Shortcuts
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className={`p-4 rounded-lg border shadow-sm ${
            isDarkMode 
              ? 'bg-white/[0.03] border-white/10' 
              : 'bg-[#FFF8F0] border-amber-200/50'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-1 items-center">
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span className={`text-xs ${
                        isDarkMode ? 'text-zinc-400' : 'text-gray-500'
                      }`}>+</span>
                    )}
                    <kbd className={`px-3 py-1.5 text-xs rounded-full ${
                      isDarkMode 
                        ? 'bg-white/10 text-zinc-300' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>{key}</kbd>
                  </React.Fragment>
                ))}
              </div>
              <span className={`text-sm ${
                isDarkMode ? 'text-zinc-200' : 'text-gray-900'
              }`}>{shortcut.description}</span>
            </div>
            <p className={`text-xs ${
              isDarkMode ? 'text-zinc-400/70' : 'text-gray-500'
            }`}>{shortcut.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarkdownSyntaxSection({ isDarkMode }: { isDarkMode: boolean }) {
  const syntaxItems = [
    { title: 'Headings', color: 'blue', examples: ['# Heading 1', '## Heading 2', '### Heading 3'] },
    { title: 'Text Formatting', color: 'green', examples: ['**bold text**', '*italic text*', '`inline code`', '~~strikethrough~~'] },
    { title: 'Lists', color: 'purple', examples: ['- Bullet point', '- Another item', '1. Numbered list', '2. Second item'] },
    { title: 'Links & Images', color: 'orange', examples: ['[Link text](https://url.com)', '![Image](image-url.jpg)'] },
    { title: 'Code Blocks', color: 'red', examples: ['```javascript', 'const code = "here";', '```'] },
    { title: 'Tables', color: 'teal', examples: ['| Header | Header |', '|--------|--------|', '| Cell   | Cell   |'] },
  ];

  return (
    <section>
      <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
        <BookOpenIcon className="h-5 w-5" />
        Markdown Syntax Guide
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {syntaxItems.map((item, index) => (
          <div key={index}>
            <h4 className={`mb-2 text-${item.color}-${isDarkMode ? '400' : '600'}`} 
                style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
              {item.title}
            </h4>
            <div className={`p-3 rounded-lg text-sm font-mono border ${
              isDarkMode 
                ? 'bg-white/[0.03] border-white/10' 
                : 'bg-[#FFF8F0] border-amber-200/50'
            }`}>
              {item.examples.map((example, i) => (
                <div key={i}>{example}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdvancedFeaturesSection({ isDarkMode }: { isDarkMode: boolean }) {
  const features = [
    { icon: SparklesIcon, title: 'Smart Paste', description: 'Paste large Markdown content and it automatically switches to preview mode for instant visualization.' },
    { icon: ViewfinderCircleIcon, title: 'Syntax Highlighting', description: 'Code blocks automatically get syntax highlighting for better readability.' },
    { icon: DevicePhoneMobileIcon, title: 'Responsive Design', description: 'Works perfectly on both desktop and mobile devices with proper text wrapping.' },
    { icon: MoonIcon, title: 'Theme Support', description: 'Automatically adapts to light and dark themes for comfortable viewing.' },
  ];

  return (
    <section>
      <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
        <RocketLaunchIcon className="h-5 w-5" />
        Advanced Features
      </h3>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className={`p-4 rounded-lg border shadow-sm ${
            isDarkMode 
              ? 'bg-white/[0.03] border-white/10' 
              : 'bg-[#FFF8F0] border-amber-200/50'
          }`}>
            <h4 className="mb-2 flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
              <feature.icon className="h-4 w-4" />
              {feature.title}
            </h4>
            <p className={`text-sm ${
              isDarkMode ? 'text-zinc-400/80' : 'text-gray-600'
            }`}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TipsSection({ isDarkMode }: { isDarkMode: boolean }) {
  const tips = [
    { color: 'blue', text: 'Use the 1.5-second auto-preview to write naturally without interruption.' },
    { color: 'green', text: 'Press Escape for instant preview when you want to see results immediately.' },
    { color: 'purple', text: 'Click anywhere in the preview to continue editing from where you left off.' },
    { color: 'orange', text: 'Long content automatically scrolls - both in edit and preview modes.' },
  ];

  return (
    <section>
      <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: FONT_STYLES.fontWeight.medium }}>
        <LightBulbIcon className="h-5 w-5" />
        Tips & Tricks
      </h3>
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            isDarkMode 
              ? `bg-${tip.color}-400/10 border-${tip.color}-400 text-${tip.color}-300` 
              : `bg-${tip.color}-50 border-${tip.color}-400 text-${tip.color}-700`
          }`}>
            <strong>Tip:</strong> {tip.text}
          </div>
        ))}
      </div>
    </section>
  );
}