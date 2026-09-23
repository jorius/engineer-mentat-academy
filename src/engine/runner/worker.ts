// engine
import { executeSource } from './execute';
import type { RunRequest, RunResult } from './execute';

self.onmessage = async (event: MessageEvent<RunRequest>): Promise<void> => {
  const { source, tests, language, settleMs } = event.data;
  const result: RunResult = await executeSource(source, tests, language, settleMs);
  self.postMessage(result);
};
