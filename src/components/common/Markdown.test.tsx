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
});
