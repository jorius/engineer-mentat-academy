// packages
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { JSX } from 'react';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';

const hljsLanguages = {
  javascript,
  typescript,
  sql,
  json,
  bash,
  js: javascript,
  ts: typescript,
};

export function Markdown({ text }: { text: string }): JSX.Element {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, languages: hljsLanguages }]]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
