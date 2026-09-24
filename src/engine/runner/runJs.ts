// engine
import type { RunRequest, RunResult } from './execute';

export const RUN_TIMEOUT_MS = 3000;

export type WorkerFactory = () => Worker;

export function createRunnerWorker(): Worker {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

export function runJs(request: RunRequest, factory: WorkerFactory = createRunnerWorker): Promise<RunResult> {
  return new Promise<RunResult>((resolve) => {
    const worker = factory();
    let settled = false;

    const finish = (result: RunResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ status: 'timeout', logs: [], tests: [], error: `Timed out after ${RUN_TIMEOUT_MS} ms` });
    }, RUN_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<RunResult>): void => finish(event.data);
    worker.onerror = (event: ErrorEvent): void => {
      finish({ status: 'error', logs: [], tests: [], error: event.message });
    };
    worker.postMessage(request);
  });
}
