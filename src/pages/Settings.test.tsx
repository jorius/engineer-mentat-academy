// packages
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Settings } from './Settings';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';
import { createPreferencesStore, DEFAULT_PREFERENCES } from '../engine/preferences';
import type { ProgressStore } from '../engine/progress';
import type { PreferencesStore } from '../engine/preferences';

// i18n
import i18n, { LANGUAGE_KEY } from '../i18n';

const originalUrlStatics = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };

function renderSettings(options?: { progressStore?: ProgressStore; preferencesStore?: PreferencesStore }): void {
  render(
    <MemoryRouter>
      <PreferencesProvider store={options?.preferencesStore}>
        <ThemeProvider>
          <ProgressProvider store={options?.progressStore ?? createProgressStore(null)}>
            <Settings />
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

  it('imports a progress file', async () => {
    const user = userEvent.setup();
    const progressStore = createProgressStore(null);
    renderSettings({ progressStore });
    const file = new File([JSON.stringify({ q1: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' } })], 'progress.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import progress/i), file);
    expect(await screen.findByText(/imported 1/i)).toBeInTheDocument();
    expect(progressStore.get('q1')?.attempts).toBe(1);
  });

  it('reports an invalid import', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.upload(screen.getByLabelText(/import progress/i), new File(['[1]'], 'bad.json', { type: 'application/json' }));
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

  it('persists an editor colour theme change and labels auto as following the app theme', async () => {
    const user = userEvent.setup();
    const preferencesStore = createPreferencesStore(null);
    renderSettings({ preferencesStore });
    const colorTheme = screen.getByLabelText(/colour theme/i);
    expect(screen.getByRole('option', { name: /follow app theme/i })).toBeInTheDocument();
    await user.selectOptions(colorTheme, 'dracula');
    expect(preferencesStore.get().editorTheme).toBe('dracula');
  });

  it('sets data-accent on the document root when a swatch is picked', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('radio', { name: 'violet' }));
    expect(document.documentElement.dataset.accent).toBe('violet');
  });

  it('keeps the danger zone buttons disabled until RESET is typed', async () => {
    const user = userEvent.setup();
    renderSettings();
    const clearButton = screen.getByRole('button', { name: /clear progress/i });
    const resetButton = screen.getByRole('button', { name: /reset everything/i });
    expect(clearButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
    await user.type(screen.getByLabelText(/type reset to confirm/i), 'RESET');
    expect(clearButton).toBeEnabled();
    expect(resetButton).toBeEnabled();
  });

  it('clears progress but keeps preferences when confirmed', async () => {
    const user = userEvent.setup();
    const progressStore = createProgressStore(null);
    progressStore.record('q1', 1);
    const preferencesStore = createPreferencesStore(null);
    preferencesStore.set({ tabSize: 4 });
    renderSettings({ progressStore, preferencesStore });
    await user.type(screen.getByLabelText(/type reset to confirm/i), 'RESET');
    await user.click(screen.getByRole('button', { name: /clear progress/i }));
    expect(progressStore.all()).toEqual({});
    expect(preferencesStore.get().tabSize).toBe(4);
    expect(await screen.findByRole('status')).toHaveTextContent(/progress cleared/i);
    expect(screen.getByLabelText(/type reset to confirm/i)).toHaveValue('');
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
    await user.type(screen.getByLabelText(/type reset to confirm/i), 'RESET');
    await user.click(screen.getByRole('button', { name: /reset everything/i }));
    expect(progressStore.all()).toEqual({});
    expect(preferencesStore.get()).toEqual(DEFAULT_PREFERENCES);
    // The theme and language keys are removed synchronously inside the reset, but React's
    // own theme-persistence effect and i18next's language-detector cache both write their
    // default value straight back, so the settled state is the default rather than absent.
    await waitFor(() => expect(i18n.language).toBe('en'));
    await waitFor(() => expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en'));
    await waitFor(() => expect(localStorage.getItem('ema:theme')).toBe('dark'));
    expect(await screen.findByRole('status')).toHaveTextContent(/everything was reset/i);
    expect(screen.getByLabelText(/type reset to confirm/i)).toHaveValue('');
  });

  it('lets the language detector pick the language again after a full reset', async () => {
    const user = userEvent.setup();
    const changeLanguage = vi.spyOn(i18n, 'changeLanguage');
    renderSettings();
    await user.type(screen.getByLabelText(/type reset to confirm/i), 'RESET');
    await user.click(screen.getByRole('button', { name: /reset everything/i }));
    expect(changeLanguage).toHaveBeenCalledWith();
  });

  it('shows the reset message in the language the reset switched to', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('es');
    localStorage.setItem(LANGUAGE_KEY, 'es');
    renderSettings();
    await user.type(screen.getByLabelText(/escribe reset para confirmar/i), 'RESET');
    await user.click(screen.getByRole('button', { name: /restablecer todo/i }));
    await waitFor(() => expect(i18n.resolvedLanguage).toBe('en'));
    expect(await screen.findByRole('status')).toHaveTextContent(/everything was reset/i);
  });
});
