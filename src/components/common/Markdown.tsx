// packages
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import type { JSX } from 'react';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';

const hljsLanguages = {
  javascript,
  typescript,
  csharp,
  java,
  sql,
  json,
  bash,
  js: javascript,
  jsx: javascript,
  ts: typescript,
  tsx: typescript,
  cs: csharp,
};

// The highlight.js palette below assumes a light background in light mode and a dark
// background in dark mode, so `<pre>` carries its theme classes directly here rather than
// through the `.md pre` CSS selector, keeping punctuation contrast readable in both themes.
const components: Components = {
  pre: ({ node, ...props }): JSX.Element => {
    void node;
    return <pre {...props} className="my-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100" />;
  },
};

export function Markdown({ text }: { text: string }): JSX.Element {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false, languages: hljsLanguages }]]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
