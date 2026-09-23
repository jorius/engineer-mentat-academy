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
import { createPreferencesStore } from '../engine/preferences';
import type { ProgressStore } from '../engine/progress';
import type { PreferencesStore } from '../engine/preferences';

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

  it('sets data-accent on the document root when a swatch is picked', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('radio', { name: 'violet' }));
    expect(document.documentElement.dataset.accent).toBe('violet');
  });
});
