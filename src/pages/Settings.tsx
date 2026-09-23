// packages
import { useState } from 'react';
import type { ChangeEvent, JSX } from 'react';

// hooks
import { useProgress } from '../hooks/useProgress';

// components
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

export function Settings(): JSX.Element {
  const { store, progress } = useProgress();
  const [message, setMessage] = useState<string | null>(null);

  const exportProgress = (): void => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mentat-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importProgress = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }
    try {
      const text = await file.text();
      store.importJson(text);
      setMessage(`Imported ${Object.keys(store.all()).length} question record(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  const reset = (): void => {
    if (window.confirm('Delete all local progress? This cannot be undone.')) {
      store.reset();
      setMessage('Progress cleared.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="space-y-3">
        <h2 className="font-medium">Progress</h2>
        <p className="text-sm text-zinc-500">{Object.keys(progress).length} question record(s) stored in this browser only.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportProgress}>Export JSON</Button>
          <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700">
            Import progress
            <input type="file" accept="application/json" className="sr-only" aria-label="Import progress" onChange={(e): void => void importProgress(e)} />
          </label>
          <Button variant="danger" onClick={reset}>Reset</Button>
        </div>
        {message !== null && <p className="text-sm" role="status">{message}</p>}
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">Grading</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled aria-label="Claude grader" />
          Claude grader (coming later)
        </label>
        <p className="text-sm text-zinc-500">
          Open questions are self-scored today. A future grader will send the question, rubric and your answer to Claude with a key you paste here; the key will be held in memory only.
        </p>
      </Card>
    </div>
  );
}
