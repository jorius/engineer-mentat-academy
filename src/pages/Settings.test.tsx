// packages
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Settings } from './Settings';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';
import { DrillsProvider } from '../hooks/useDrills';

// engine
import { createDrillsStore } from '../engine/drills';
import type { DrillsStore } from '../engine/drills';
import { createProgressStore } from '../engine/progress';
import { createPreferencesStore, DEFAULT_PREFERENCES, EDITOR_FONTS, FONT_STACKS } from '../engine/preferences';
import type { ProgressStore } from '../engine/progress';
import type { EditorFont, PreferencesStore } from '../engine/preferences';

// i18n
import i18n, { LANGUAGE_KEY } from '../i18n';

const originalUrlStatics = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };

/** Opens a Danger-zone action, types RESET inside its dialog and confirms it. */
async function confirmDanger(user: ReturnType<typeof userEvent.setup>, name: RegExp): Promise<void> {
  await user.click(screen.getByRole('button', { name }));
  const dialog = screen.getByRole('dialog');
  await user.type(within(dialog).getByRole('textbox'), 'RESET');
  await user.click(within(dialog).getByRole('button', { name }));
}

function renderSettings(options?: { progressStore?: ProgressStore; preferencesStore?: PreferencesStore; drillsStore?: DrillsStore }): void {
  render(
    <MemoryRouter>
      <PreferencesProvider store={options?.preferencesStore}>
        <ThemeProvider>
          <ProgressProvider store={options?.progressStore ?? createProgressStore(null)}>
            <DrillsProvider store={options?.drillsStore ?? createDrillsStore(null)}>
              <Settings />
            </DrillsProvider>
          </ProgressProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </MemoryRouter>,
  );
}

describe('Settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.assign(URL, originalUrlStatics);
  });

  it('revokes the export URL only after the download click has been handled', async () => {
    const createObjectURL = vi.fn((): string => 'blob:progress');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /export json/i }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:progress'));
  });

  const progressFile = (): File =>
    new File([JSON.stringify({ q1: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' } })], 'progress.json', { type: 'application/json' });

  it('imports a progress file only once the replacement is confirmed', async () => {
    const user = userEvent.setup();
    const progressStore = createProgressStore(null);
    progressStore.record('q9', 1);
    renderSettings({ progressStore });
    const input = screen.getByLabelText<HTMLInputElement>(/import progress/i, { selector: 'input' });
    await user.upload(input, progressFile());
    const dialog = await screen.findByRole('dialog', { name: 'Replace your progress?' });
    expect(dialog).toHaveAccessibleDescription('The file replaces every record stored in this browser.');
    expect(input.value).toBe('');
    expect(progressStore.get('q9')).toBeDefined();
    expect(progressStore.get('q1')).toBeUndefined();
    await user.click(within(dialog).getByRole('button', { name: 'Import progress' }));
    expect(await screen.findByText(/imported 1/i)).toBeInTheDocument();
    expect(progressStore.get('q1')?.attempts).toBe(1);
    expect(progressStore.get('q9')).toBeUndefined();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps progress untouched when the import is cancelled', async () => {
    const user = userEvent.setup();
    const progressStore = createProgressStore(null);
    progressStore.record('q9', 1);
    renderSettings({ progressStore });
    await user.upload(screen.getByLabelText(/import progress/i, { selector: 'input' }), progressFile());
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(progressStore.get('q9')).toBeDefined();
    expect(progressStore.get('q1')).toBeUndefined();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('reports an invalid import after it is confirmed', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.upload(screen.getByLabelText(/import progress/i, { selector: 'input' }), new File(['[1]'], 'bad.json', { type: 'application/json' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Import progress' }));
    expect(await screen.findByText(/not a progress map/i)).toBeInTheDocument();
  });

  it('shows the AI grader as coming later', () => {
    renderSettings();
    expect(screen.getByRole('checkbox', { name: /claude grader/i })).toBeDisabled();
  });

  it('persists a tab size change to the preferences store', async () => {
    const user = userEvent.setup();
    const preferencesStore = createPreferencesStore(null);
    renderSettings({ preferencesStore });
    await user.selectOptions(screen.getByLabelText(/tab size/i), '4');
    expect(preferencesStore.get().tabSize).toBe(4);
  });

  it('persists a font size change to the preferences store via the select', async () => {
    const user = userEvent.setup();
    const preferencesStore = createPreferencesStore(null);
    renderSettings({ preferencesStore });
    const fontSize = screen.getByLabelText(/font size/i);
    expect(fontSize.tagName).toBe('SELECT');
    await user.selectOptions(fontSize, '18');
    expect(preferencesStore.get().editorFontSize).toBe(18);
  });

  it('lists every editor font by its name, each option in its own face', () => {
    renderSettings();
    const options = within(screen.getByLabelText('Font')).getAllByRole<HTMLOptionElement>('option');
    expect(options.map((option) => option.value)).toEqual([...EDITOR_FONTS]);
    expect(options.map((option) => option.textContent)).toEqual([
      'JetBrains Mono',
      'Fira Code',
      'Source Code Pro',
      'IBM Plex Mono',
      'Cascadia Code',
      'Ubuntu Mono',
      'Roboto Mono',
      'Inconsolata',
      'Space Mono',
      'Geist Mono',
      'Commit Mono',
      'Victor Mono',
      'System monospace',
    ]);
    options.forEach((option) => {
      expect(option).toHaveStyle({ fontFamily: FONT_STACKS[option.value as EditorFont] });
    });
  });

  it('sets --editor-font on the document root from the chosen font', async () => {
    const user = userEvent.setup();
    const preferencesStore = createPreferencesStore(null);
    renderSettings({ preferencesStore });
    expect(document.documentElement.style.getPropertyValue('--editor-font')).toBe(FONT_STACKS.jetbrains);
    await user.selectOptions(screen.getByLabelText('Font'), 'victor');
    expect(preferencesStore.get().editorFont).toBe('victor');
    expect(document.documentElement.style.getPropertyValue('--editor-font')).toBe(FONT_STACKS.victor);
  });

  it('previews TypeScript with an interface, async code and a regex literal', () => {
    renderSettings();
    const preview = screen.getByRole('textbox', { name: 'Editor preview' });
    const lines = Array.from(preview.querySelectorAll('.cm-line'), (line) => line.textContent ?? '');
    expect(lines.some((line) => /^interface \w+/.test(line))).toBe(true);
    expect(lines.some((line) => /^async function \w+/.test(line))).toBe(true);
    expect(lines.some((line) => /= \/\S+\/[dgimsuvy]*;$/.test(line))).toBe(true);
  });

  it('persists an editor colour theme change and labels auto as following the app theme', async () => {
    const user = userEvent.setup();
    const preferencesStore = createPreferencesStore(null);
    renderSettings({ preferencesStore });
    const colorTheme = screen.getByLabelText(/colour theme/i);
    expect(screen.getByRole('option', { name: /follow app theme/i })).toBeInTheDocument();
    await user.selectOptions(colorTheme, 'dracula');
    expect(preferencesStore.get().editorTheme).toBe('dracula');
  });

  it('groups the editor colour themes into light-and-dark, dark-only and light-only families', () => {
    renderSettings();
    const colorTheme = screen.getByLabelText(/colour theme/i);
    const first = within(colorTheme).getAllByRole('option')[0];
    expect(first).toHaveValue('auto');
    expect(first.parentElement).toBe(colorTheme);
    const groups = within(colorTheme).getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('label'))).toEqual(['Light and dark', 'Dark only', 'Light only']);
    const [both, darkOnly, lightOnly] = groups;
    expect(within(both).getByRole('option', { name: 'GitHub' })).toHaveValue('github');
    expect(within(darkOnly).getByRole('option', { name: 'Dracula' })).toHaveValue('dracula');
    expect(within(lightOnly).getByRole('option', { name: 'Eclipse' })).toHaveValue('eclipse');
    expect(colorTheme).toHaveAccessibleDescription("Families with both variants follow the app's light or dark mode.");
  });

  it('sets data-accent on the document root when a swatch is picked', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('radio', { name: 'violet' }));
    expect(document.documentElement.dataset.accent).toBe('violet');
  });

  it.each([
    [/clear progress/i, 'Clear all progress?', 'Attempts, scores, marks, notes and saved drills are deleted. Preferences stay.'],
    [/reset everything/i, 'Reset everything?', 'Progress, saved drills, preferences, theme and language go back to their defaults.'],
  ])('keeps %s blocked inside its dialog until RESET is typed', async (name, title, body) => {
    const user = userEvent.setup();
    const progressStore = createProgressStore(null);
    progressStore.record('q1', 1);
    renderSettings({ progressStore });
    expect(screen.queryByLabelText(/type reset to confirm/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name }));
    const dialog = screen.getByRole('dialog', { name: title });
    expect(dialog).toHaveAccessibleDescription(body);
    const confirm = within(dialog).getByRole('button', { name });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/type reset to confirm/i), 'RESE');
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/type reset to confirm/i), 'T');
    expect(confirm).toBeEnabled();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(progressStore.get('q1')).toBeDefined();
  });

  it('clears progress but keeps preferences when confirmed', async () => {
    const user = userEvent.setup();
    const progressStore = createProgressStore(null);
    progressStore.record('q1', 1);
    const preferencesStore = createPreferencesStore(null);
    preferencesStore.set({ tabSize: 4 });
    renderSettings({ progressStore, preferencesStore });
    await confirmDanger(user, /clear progress/i);
    expect(progressStore.all()).toEqual({});
    expect(preferencesStore.get().tabSize).toBe(4);
    expect(await screen.findByRole('status')).toHaveTextContent(/progress cleared/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resets everything: preferences, theme and language storage keys, and shows the done message', async () => {
    const user = userEvent.setup();
    localStorage.setItem('ema:theme', 'light');
    localStorage.setItem(LANGUAGE_KEY, 'es');
    const progressStore = createProgressStore(null);
    progressStore.record('q1', 1);
    const preferencesStore = createPreferencesStore(null);
    preferencesStore.set({ tabSize: 4 });
    renderSettings({ progressStore, preferencesStore });
    await confirmDanger(user, /reset everything/i);
    expect(progressStore.all()).toEqual({});
    expect(preferencesStore.get()).toEqual(DEFAULT_PREFERENCES);
    // The theme and language keys are removed synchronously inside the reset, but React's
    // own theme-persistence effect and i18next's language-detector cache both write their
    // default value straight back, so the settled state is the default rather than absent.
    await waitFor(() => expect(i18n.language).toBe('en'));
    await waitFor(() => expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en'));
    await waitFor(() => expect(localStorage.getItem('ema:theme')).toBe('dark'));
    expect(await screen.findByRole('status')).toHaveTextContent(/everything was reset/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([/clear progress/i, /reset everything/i])('clears saved drills on %s', async (name) => {
    const user = userEvent.setup();
    const drillsStore = createDrillsStore(null);
    drillsStore.create({ query: 'unseen=1', questionIds: ['q1', 'q2'] });
    renderSettings({ drillsStore });
    await confirmDanger(user, name);
    expect(drillsStore.all()).toEqual([]);
  });

  it('lets the language detector pick the language again after a full reset', async () => {
    const user = userEvent.setup();
    const changeLanguage = vi.spyOn(i18n, 'changeLanguage');
    renderSettings();
    await confirmDanger(user, /reset everything/i);
    expect(changeLanguage).toHaveBeenCalledWith();
  });

  it('shows the reset message in the language the reset switched to', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('es');
    localStorage.setItem(LANGUAGE_KEY, 'es');
    renderSettings();
    await user.click(screen.getByRole('button', { name: /restablecer todo/i }));
    const dialog = screen.getByRole('dialog', { name: '¿Restablecer todo?' });
    await user.type(within(dialog).getByLabelText(/escribe reset para confirmar/i), 'RESET');
    await user.click(within(dialog).getByRole('button', { name: /restablecer todo/i }));
    await waitFor(() => expect(i18n.resolvedLanguage).toBe('en'));
    expect(await screen.findByRole('status')).toHaveTextContent(/everything was reset/i);
  });
});
