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
        components={{
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              download={href?.endsWith('.pdf') ? true : undefined}
              className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors my-1 no-underline"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};
