// packages
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

// components
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('highlights a ts fence with hljs-keyword spans', () => {
    const text = '```ts\nconst x: number = 1;\n```';
    const { container } = render(<Markdown text={text} />);
    expect(container.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
  });

  it('highlights a js fence', () => {
    const text = '```js\nconst x = 1;\n```';
    const { container } = render(<Markdown text={text} />);
    expect(container.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
  });

  it.each([
    ['csharp', 'public class Cache { private int size; }'],
    ['cs', 'public sealed record Point(int X, int Y);'],
    ['java', 'public static void main(String[] args) { return; }'],
    ['jsx', 'const App = () => <div className="app" />;'],
    ['tsx', 'const App = (): JSX.Element => <div className="app" />;'],
  ])('highlights a %s fence', (language, code) => {
    const { container } = render(<Markdown text={`\`\`\`${language}\n${code}\n\`\`\``} />);
    expect(container.querySelector('pre > code')).toHaveClass(`language-${language}`, 'hljs');
    expect(container.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
  });

  it('gives a rendered code block a theme-aware background', () => {
    const text = '```ts\nconst x: number = 1;\n```';
    const { container } = render(<Markdown text={text} />);
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre).toHaveClass('bg-zinc-50', 'text-zinc-900', 'dark:bg-zinc-950', 'dark:text-zinc-100', 'border');
  });
});
