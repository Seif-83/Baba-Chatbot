import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface MathContentProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
}

function cleanMathContent(raw: string): string {
  if (!raw) return '';
  // 1. Convert HTML line breaks to proper markdown newlines
  let text = raw.replace(/<br\s*\/?>/gi, '\n\n');
  // 2. Fix cases where tables or raw math formulas have literal \n or escaped pipes
  return text;
}

export const MathContent: React.FC<MathContentProps> = ({ content, className = '', dir = 'auto' }) => {
  const processed = useMemo(() => cleanMathContent(content), [content]);

  return (
    <div
      className={`math-prose text-[15px] leading-relaxed break-words overflow-x-auto ${dir === 'ltr' ? 'text-left' : ''} ${className}`}
      dir={dir}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};
