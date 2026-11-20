import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathContentProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
}

export const MathContent: React.FC<MathContentProps> = ({ content, className = '', dir = 'auto' }) => {
  return (
    <div
      className={`math-prose text-[15px] leading-relaxed break-words ${dir === 'ltr' ? 'text-left' : ''} ${className}`}
      dir={dir}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
