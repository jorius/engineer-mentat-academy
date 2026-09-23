// packages
import { afterEach, describe, expect, it, vi } from 'vitest';

// engine
import { RUN_TIMEOUT_MS, runJs } from './runJs';
import type { RunResult } from './execute';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<RunResult>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  posted: unknown[] = [];

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(data: unknown): void {
    this.posted.push(data);
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe('runJs', () => {
  afterEach(() => {
    FakeWorker.instances = [];
    vi.useRealTimers();
  });

  it('resolves with the worker result and terminates the worker', async () => {
    const promise = runJs({ source: 'x', tests: [], language: 'javascript' }, () => new FakeWorker() as unknown as Worker);
    const worker = FakeWorker.instances[0];
    const result: RunResult = { status: 'ok', logs: [], tests: [] };
    worker?.onmessage?.({ data: result } as MessageEvent<RunResult>);
    await expect(promise).resolves.toEqual(result);
    expect(worker?.terminated).toBe(true);
  });

  it('times out and terminates a hung worker', async () => {
    vi.useFakeTimers();
    const promise = runJs({ source: 'while(true){}', tests: [], language: 'javascript' }, () => new FakeWorker() as unknown as Worker);
    vi.advanceTimersByTime(RUN_TIMEOUT_MS);
    await expect(promise).resolves.toMatchObject({ status: 'timeout' });
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });

  it('reports a worker error', async () => {
    const promise = runJs({ source: 'x', tests: [], language: 'javascript' }, () => new FakeWorker() as unknown as Worker);
    FakeWorker.instances[0]?.onerror?.({ message: 'boom' } as ErrorEvent);
    await expect(promise).resolves.toMatchObject({ status: 'error', error: 'boom' });
  });
});
