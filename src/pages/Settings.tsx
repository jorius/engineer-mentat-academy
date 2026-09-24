// packages
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, JSX } from 'react';

// contexts
import { useTheme } from '../contexts/ThemeContext';

// hooks
import { usePreferences } from '../hooks/usePreferences';
import { useProgress } from '../hooks/useProgress';
import { useDrills } from '../hooks/useDrills';

// engine
import { EDITOR_THEMES } from '../engine/editorThemes';
import type { ThemeFamily } from '../engine/editorThemes';
import { EDITOR_FONTS, FONT_STACKS } from '../engine/preferences';
import type { Accent, EditorFont, EditorTheme, MaxAttempts, TabSize } from '../engine/preferences';

// components
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';
import { CodeEditor } from '../components/common/CodeEditor';

// i18n
import i18n, { LANGUAGE_KEY } from '../i18n';

const ACCENTS: readonly Accent[] = ['spice', 'sky', 'emerald', 'violet', 'rose'];
const ACCENT_SWATCH_CLASSES: Record<Accent, string> = {
  spice: 'bg-orange-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

const TAB_SIZES: readonly TabSize[] = [2, 4, 8];

const EDITOR_FONT_SIZES: readonly number[] = [12, 13, 14, 15, 16, 17, 18, 19, 20];

const MAX_ATTEMPTS_OPTIONS: readonly MaxAttempts[] = [1, 2, 3, 'unlimited'];

// `auto` is listed on its own above the groups; each group keeps the alphabetical order of EDITOR_THEMES.
const THEME_GROUPS: readonly { labelKey: string; families: readonly ThemeFamily[] }[] = [
  { labelKey: 'settings.themesBoth', families: EDITOR_THEMES.filter((family) => family.light !== undefined && family.dark !== undefined) },
  { labelKey: 'settings.themesDark', families: EDITOR_THEMES.filter((family) => family.light === undefined && family.dark !== undefined) },
  { labelKey: 'settings.themesLight', families: EDITOR_THEMES.filter((family) => family.light !== undefined && family.dark === undefined) },
];

// Status lines keep the translation key, not the translated text, so they follow a language
// change that resolves after the message was set (the full reset switches language).
type StatusMessage = { key: string; count?: number } | { text: string };

// A TypeScript sample that exercises most token kinds, so a theme or font can be judged at a glance.
const PREVIEW_CODE = [
  '/* A little of everything the editor highlights. */',
  'interface User { id: number; name: string; email?: string }',
  "type Role = 'admin' | 'editor' | 'viewer';",
  'const EMAIL = /^[\\w.+-]+@[\\w-]+\\.[a-z]{2,}$/i;',
  'const first = <T extends { id: number }>(list: T[]): T | null => list[0] ?? null;',
  '',
  'class Cache<V> {',
  '  #items = new Map<string, V>();',
  '  get size(): number { return this.#items.size; }',
  '}',
  '',
  'async function names(base: string, limit = 10): Promise<string[]> {',
  '  try {',
  '    const response = await fetch(`${base}/users?limit=${limit}`);',
  '    const users: User[] = await response.json();',
  '    return users.map(({ name, email }) => email?.trim() ?? name);',
  '  } catch { return []; }',
  '}',
  '',
  '// One log line per role.',
  "for (const role of ['admin', 'viewer'] as Role[]) {",
  '  switch (role) {',
  "    case 'admin': console.log(role, EMAIL.test('ada@example.com'), true); break;",
  '    default: console.log(role, new Cache<User>().size, 0xff, 2.5, false, null);',
  '  }',
  '}',
].join('\n');

export function Settings(): JSX.Element {
  const { t } = useTranslation();
  const { store, progress } = useProgress();
  const { store: drillsStore } = useDrills();
  const { preferences, store: preferencesStore } = usePreferences();
  const theme = useTheme();
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [previewCode, setPreviewCode] = useState<string>(PREVIEW_CODE);
  const [confirmText, setConfirmText] = useState<string>('');
  const themeHintId = useId();

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
      setMessage({ key: 'settings.imported', count: Object.keys(store.all()).length });
    } catch (error) {
      setMessage(error instanceof Error ? { text: error.message } : { key: 'settings.importFailed' });
    } finally {
      event.target.value = '';
    }
  };

  const clearProgress = (): void => {
    store.reset();
    drillsStore.reset();
    setMessage({ key: 'settings.cleared' });
    setConfirmText('');
  };

  const resetEverything = (): void => {
    store.reset();
    drillsStore.reset();
    preferencesStore.reset();
    theme.reset();
    try {
      window.localStorage.removeItem(LANGUAGE_KEY);
    } catch {
      // ignore blocked storage
    }
    // No argument: the detector runs again and falls back to the browser language.
    void i18n.changeLanguage();
    setMessage({ key: 'settings.resetDone' });
    setConfirmText('');
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
        </div>
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
                <option key={font} value={font} style={{ fontFamily: FONT_STACKS[font] }}>
                  {font === 'system' ? t('settings.systemMonospace') : t(`settings.editorFonts.${font}`)}
                </option>
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
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            {t('settings.colorTheme')}
            <select
              className="w-56 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={preferences.editorTheme}
              aria-describedby={themeHintId}
              onChange={(e): void => preferencesStore.set({ editorTheme: e.target.value as EditorTheme })}
            >
              <option value="auto">{t('settings.themeAuto')}</option>
              {THEME_GROUPS.map((group) => (
                <optgroup key={group.labelKey} label={t(group.labelKey)}>
                  {group.families.map((family) => (
                    <option key={family.id} value={family.id}>{family.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <p id={themeHintId} className="text-xs text-zinc-500">{t('settings.themeHint')}</p>
        </div>
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
      <Card className="space-y-3 border-red-300 dark:border-red-900">
        <h2 className="font-medium">{t('settings.dangerHeading')}</h2>
        <p className="text-sm text-zinc-500">{t('settings.dangerNote')}</p>
        <input
          type="text"
          aria-label={t('settings.typeToConfirm')}
          placeholder="RESET"
          value={confirmText}
          onChange={(e): void => setConfirmText(e.target.value)}
          className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" disabled={confirmText.trim() !== 'RESET'} onClick={clearProgress}>{t('settings.clearProgress')}</Button>
          <Button variant="danger" disabled={confirmText.trim() !== 'RESET'} onClick={resetEverything}>{t('settings.resetEverything')}</Button>
        </div>
        {message !== null && (
          <p className="text-sm" role="status">{'text' in message ? message.text : t(message.key, { count: message.count })}</p>
        )}
      </Card>
    </div>
  );
}
