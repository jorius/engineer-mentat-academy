// packages
import { afterEach, describe, expect, it, vi } from 'vitest';

// engine
import type { RunRequest } from './execute';

describe('runner worker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts a plain error result when the run result cannot be cloned', async () => {
    await import('./worker');
    const posted: unknown[] = [];
    vi.spyOn(self, 'postMessage')
      .mockImplementationOnce(() => {
        throw new DOMException('function could not be cloned', 'DataCloneError');
      })
      .mockImplementation((message: unknown) => {
        posted.push(message);
      });
    const request: RunRequest = {
      source: 'export function solution() { console.log("ran"); return () => 1; }',
      tests: [{ name: 'returns a function', args: [], expected: 1 }],
      language: 'javascript',
    };
    await self.onmessage?.call(self, new MessageEvent('message', { data: request }));
    expect(posted).toEqual([
      { status: 'error', logs: ['ran'], tests: [], error: 'Result could not be transferred: return plain data (no functions or symbols)' },
    ]);
  });
});
