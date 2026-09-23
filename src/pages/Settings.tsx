// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, JSX } from 'react';

// hooks
import { usePreferences } from '../hooks/usePreferences';
import { useProgress } from '../hooks/useProgress';

// engine
import { EDITOR_THEMES } from '../engine/editorThemes';
import type { Accent, EditorFont, EditorTheme, MaxAttempts, TabSize } from '../engine/preferences';

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

// Font names are product names and stay as-is; the "(if installed)" qualifier and the
// generic system entry are translated.
const EDITOR_FONTS: readonly { value: EditorFont; labelKey?: string }[] = [
  { value: 'jetbrains', labelKey: 'settings.editorFonts.jetbrains' },
  { value: 'fira', labelKey: 'settings.editorFonts.fira' },
  { value: 'system' },
];

const TAB_SIZES: readonly TabSize[] = [2, 4, 8];

const EDITOR_FONT_SIZES: readonly number[] = [12, 13, 14, 15, 16, 17, 18, 19, 20];

const MAX_ATTEMPTS_OPTIONS: readonly MaxAttempts[] = [1, 2, 3, 'unlimited'];

const PREVIEW_CODE = ['function greet(name: string): string {', "  return `Hello, ${name}!`;", '}', '', 'console.log(greet("Mentat"));'].join('\n');

export function Settings(): JSX.Element {
  const { t } = useTranslation();
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
      setMessage(t('settings.imported', { count: Object.keys(store.all()).length }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('settings.importFailed'));
    } finally {
      event.target.value = '';
    }
  };

  const reset = (): void => {
    if (window.confirm(t('settings.confirmReset'))) {
      store.reset();
      setMessage(t('settings.cleared'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
      <Card className="space-y-3">
        <h2 className="font-medium">{t('settings.progressHeading')}</h2>
        <p className="text-sm text-zinc-500">{t('settings.recordsStored', { count: Object.keys(progress).length })}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportProgress}>{t('settings.exportJson')}</Button>
          <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700">
            {t('settings.importProgress')}
            <input type="file" accept="application/json" className="sr-only" aria-label={t('settings.importProgress')} onChange={(e): void => void importProgress(e)} />
          </label>
          <Button variant="danger" onClick={reset}>{t('common.reset')}</Button>
        </div>
        {message !== null && <p className="text-sm" role="status">{message}</p>}
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">{t('settings.gradingHeading')}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled aria-label={t('settings.claudeGrader')} />
          {t('settings.claudeGraderSoon')}
        </label>
        <p className="text-sm text-zinc-500">
          {t('settings.graderNote')}
        </p>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-medium">{t('settings.editorHeading')}</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('settings.font')}
            <select
              className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={preferences.editorFont}
              onChange={(e): void => preferencesStore.set({ editorFont: e.target.value as EditorFont })}
            >
              {EDITOR_FONTS.map((font) => (
                <option key={font.value} value={font.value}>{font.labelKey !== undefined ? t(font.labelKey) : t('settings.systemMonospace')}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('settings.fontSize')}
            <select
              className="w-20 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={preferences.editorFontSize}
              onChange={(e): void => preferencesStore.set({ editorFontSize: Number(e.target.value) })}
            >
              {EDITOR_FONT_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('settings.tabSize')}
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
            <legend>{t('settings.indentWith')}</legend>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="indent-style"
                checked={!preferences.indentWithTabs}
                onChange={(): void => preferencesStore.set({ indentWithTabs: false })}
              />
              {t('settings.spaces')}
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="indent-style"
                checked={preferences.indentWithTabs}
                onChange={(): void => preferencesStore.set({ indentWithTabs: true })}
              />
              {t('settings.tabs')}
            </label>
          </fieldset>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {t('settings.colorTheme')}
          <select
            className="w-56 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={preferences.editorTheme}
            onChange={(e): void => preferencesStore.set({ editorTheme: e.target.value as EditorTheme })}
          >
            {EDITOR_THEMES.map((editorTheme) => (
              <option key={editorTheme.id} value={editorTheme.id}>{editorTheme.id === 'auto' ? t('settings.themeAuto') : editorTheme.name}</option>
            ))}
          </select>
        </label>
        <div>
          <p className="mb-1 text-sm text-zinc-500">{t('settings.preview')}</p>
          <CodeEditor value={previewCode} onChange={setPreviewCode} language="typescript" readOnly={false} ariaLabel={t('settings.editorPreview')} />
        </div>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">{t('settings.appearanceHeading')}</h2>
        <fieldset className="flex flex-wrap gap-3">
          <legend className="mb-1 text-sm text-zinc-500">{t('settings.accentColor')}</legend>
          {ACCENTS.map((accent) => (
            <label key={accent} className="flex cursor-pointer flex-col items-center gap-1 text-xs">
              <input
                type="radio"
                name="accent"
                aria-label={t(`settings.accents.${accent}`)}
                checked={preferences.accent === accent}
                onChange={(): void => preferencesStore.set({ accent })}
                className={`h-6 w-6 appearance-none rounded-full border-2 border-transparent ${ACCENT_SWATCH_CLASSES[accent]} checked:border-zinc-900 dark:checked:border-white`}
              />
              {t(`settings.accents.${accent}`)}
            </label>
          ))}
        </fieldset>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">{t('settings.practiceHeading')}</h2>
        <label className="flex flex-col gap-1 text-sm">
          {t('settings.maxAttempts')}
          <select
            className="w-40 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={preferences.maxAttempts}
            onChange={(e): void =>
              preferencesStore.set({ maxAttempts: (e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)) as MaxAttempts })
            }
          >
            {MAX_ATTEMPTS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option === 'unlimited' ? t('settings.unlimited') : option}</option>
            ))}
          </select>
        </label>
      </Card>
    </div>
  );
}
