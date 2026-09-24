// engine
import { executeSource } from './execute';
import type { RunRequest, RunResult } from './execute';

self.onmessage = async (event: MessageEvent<RunRequest>): Promise<void> => {
  const { source, tests, language, settleMs } = event.data;
  const result: RunResult = await executeSource(source, tests, language, settleMs);
  try {
    self.postMessage(result);
  } catch {
    const fallback: RunResult = { status: 'error', logs: result.logs, tests: [], error: 'Result could not be transferred: return plain data (no functions or symbols)' };
    self.postMessage(fallback);
  }
};
