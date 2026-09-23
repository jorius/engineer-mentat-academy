// packages
import { useState } from 'react';
import type { ChangeEvent, JSX } from 'react';

// hooks
import { usePreferences } from '../hooks/usePreferences';
import { useProgress } from '../hooks/useProgress';

// engine
import type { Accent, EditorFont, MaxAttempts, TabSize } from '../engine/preferences';

// components
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';
import { CodeEditor } from '../components/common/CodeEditor';

const ACCENTS: readonly Accent[] = ['spice', 'sky', 'emerald', 'violet', 'rose'];
const ACCENT_SWATCH_CLASSES: Record<Accent, string> = {
  spice: 'bg-orange-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

const EDITOR_FONTS: readonly { value: EditorFont; label: string }[] = [
  { value: 'jetbrains', label: 'JetBrains Mono' },
  { value: 'fira', label: 'Fira Code' },
  { value: 'system', label: 'System monospace' },
];

const TAB_SIZES: readonly TabSize[] = [2, 4, 8];

const MAX_ATTEMPTS_OPTIONS: readonly { value: MaxAttempts; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 'unlimited', label: 'Unlimited' },
];

const PREVIEW_CODE = ['function greet(name: string): string {', "  return `Hello, ${name}!`;", '}', '', 'console.log(greet("Mentat"));'].join('\n');

export function Settings(): JSX.Element {
  const { store, progress } = useProgress();
  const { preferences, store: preferencesStore } = usePreferences();
  const [message, setMessage] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string>(PREVIEW_CODE);

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
      <Card className="space-y-3">
        <h2 className="font-medium">Editor</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Font
            <select
              className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={preferences.editorFont}
              onChange={(e): void => preferencesStore.set({ editorFont: e.target.value as EditorFont })}
            >
              {EDITOR_FONTS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Font size
            <input
              type="number"
              min={12}
              max={20}
              className="w-20 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={preferences.editorFontSize}
              onChange={(e): void => preferencesStore.set({ editorFontSize: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tab size
            <select
              className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={preferences.tabSize}
              onChange={(e): void => preferencesStore.set({ tabSize: Number(e.target.value) as TabSize })}
            >
              {TAB_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1 text-sm">
            <legend>Indent with</legend>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="indent-style"
                checked={!preferences.indentWithTabs}
                onChange={(): void => preferencesStore.set({ indentWithTabs: false })}
              />
              Spaces
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="indent-style"
                checked={preferences.indentWithTabs}
                onChange={(): void => preferencesStore.set({ indentWithTabs: true })}
              />
              Tabs
            </label>
          </fieldset>
        </div>
        <div>
          <p className="mb-1 text-sm text-zinc-500">Preview</p>
          <CodeEditor value={previewCode} onChange={setPreviewCode} language="typescript" readOnly={false} ariaLabel="Editor preview" />
        </div>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">Appearance</h2>
        <fieldset className="flex flex-wrap gap-3">
          <legend className="mb-1 text-sm text-zinc-500">Accent color</legend>
          {ACCENTS.map((accent) => (
            <label key={accent} className="flex cursor-pointer flex-col items-center gap-1 text-xs">
              <input
                type="radio"
                name="accent"
                aria-label={accent}
                checked={preferences.accent === accent}
                onChange={(): void => preferencesStore.set({ accent })}
                className={`h-6 w-6 appearance-none rounded-full border-2 border-transparent ${ACCENT_SWATCH_CLASSES[accent]} checked:border-zinc-900 dark:checked:border-white`}
              />
              {accent}
            </label>
          ))}
        </fieldset>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">Practice</h2>
        <label className="flex flex-col gap-1 text-sm">
          Max attempts per question (used by the upcoming retry flow)
          <select
            className="w-40 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={preferences.maxAttempts}
            onChange={(e): void =>
              preferencesStore.set({ maxAttempts: (e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)) as MaxAttempts })
            }
          >
            {MAX_ATTEMPTS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </Card>
    </div>
  );
}
