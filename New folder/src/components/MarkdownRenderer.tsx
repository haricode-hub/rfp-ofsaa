"use client";

import React from "react";
import Image from "next/image";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { getThemeClasses } from "@/constants/theme";

interface MarkdownRendererProps {
  content: string;
  isDarkMode: boolean;
}

export default function MarkdownRenderer({ content, isDarkMode }: MarkdownRendererProps) {
  const theme = getThemeClasses(isDarkMode);
  
  const markdownComponents: Components = {
    a: ({ href, children, ...props }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={theme.link}
        {...props}
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => {
      if (!src) return null;
      const imageSrc = typeof src === 'string' ? src : '';
      
      // Use Next.js Image for all cases with proper configuration
      return (
        <Image
          src={imageSrc}
          alt={alt || ""}
          width={800}
          height={600}
          className="max-w-full h-auto rounded-md"
          style={{ width: 'auto', height: 'auto' }}
          unoptimized
        />
      );
    },
    code: ({ className, children, ...props }) => {
      const isInline = !className;
      return isInline ? (
        <code 
          className={`px-1 py-0.5 rounded text-sm ${theme.code}`}
          {...props}
        >
          {children}
        </code>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre 
        className={`p-4 rounded-lg overflow-x-auto text-sm max-w-full ${
          isDarkMode 
            ? 'bg-zinc-900 text-zinc-200' 
            : 'bg-gray-50 text-gray-900'
        }`}
        style={{ 
          wordWrap: "break-word", 
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap"
        }}
        {...props}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote 
        className={`border-l-4 pl-4 py-2 my-4 ${
          isDarkMode 
            ? 'border-zinc-600 text-zinc-300 bg-zinc-800/30' 
            : 'border-gray-300 text-gray-600 bg-gray-50'
        }`}
        {...props}
      >
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4 max-w-full">
        <table 
          className={`w-full border-collapse ${
            isDarkMode 
              ? 'border-zinc-700' 
              : 'border-gray-200'
          }`}
          style={{ tableLayout: "auto", maxWidth: "100%" }}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th 
        className={`border px-4 py-2 text-left font-semibold ${
          isDarkMode 
            ? 'border-zinc-700 bg-zinc-800 text-zinc-200' 
            : 'border-gray-200 bg-gray-50 text-gray-900'
        }`}
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td 
        className={`border px-4 py-2 ${
          isDarkMode 
            ? 'border-zinc-700 text-zinc-300' 
            : 'border-gray-200 text-gray-700'
        }`}
        {...props}
      >
        {children}
      </td>
    ),
    h1: ({ children, ...props }) => (
      <h1 
        className={`text-2xl font-bold mb-4 mt-6 ${
          isDarkMode ? 'text-zinc-100' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 
        className={`text-xl font-bold mb-3 mt-5 ${
          isDarkMode ? 'text-zinc-100' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 
        className={`text-lg font-semibold mb-2 mt-4 ${
          isDarkMode ? 'text-zinc-100' : 'text-gray-900'
        }`}
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-3" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-outside mb-4 space-y-2 pl-6" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-outside mb-4 space-y-2 pl-6" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className={`${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} leading-relaxed`} {...props}>
        {children}
      </li>
    ),
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        rehypeSanitize,
        rehypeHighlight,
      ]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}