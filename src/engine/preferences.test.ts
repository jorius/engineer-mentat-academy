// packages
import { describe, expect, it, vi } from 'vitest';

// engine
import { DEFAULT_PREFERENCES, PREFERENCES_KEY, createPreferencesStore } from './preferences';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    clear: (): void => map.clear(),
    getItem: (key: string): string | null => map.get(key) ?? null,
    key: (index: number): string | null => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string): void => {
      map.delete(key);
    },
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
  };
}

describe('createPreferencesStore', () => {
  it('returns the defaults when nothing is stored', () => {
    const store = createPreferencesStore(memoryStorage());
    expect(store.get()).toEqual(DEFAULT_PREFERENCES);
  });

  it('round-trips a patch through storage', () => {
    const storage = memoryStorage();
    const store = createPreferencesStore(storage);
    store.set({ accent: 'violet', editorFontSize: 16, tabSize: 4, indentWithTabs: true, maxAttempts: 2 });
    expect(store.get()).toEqual({
      accent: 'violet',
      editorFont: 'jetbrains',
      editorFontSize: 16,
      tabSize: 4,
      indentWithTabs: true,
      maxAttempts: 2,
      editorTheme: 'auto',
    });

    const fresh = createPreferencesStore(storage);
    expect(fresh.get()).toEqual(store.get());
    expect(JSON.parse(storage.getItem(PREFERENCES_KEY) ?? '{}')).toMatchObject({ accent: 'violet' });
  });

  it('merges partial stored JSON over the defaults field by field', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ accent: 'sky', tabSize: 8 }));
    const store = createPreferencesStore(storage);
    expect(store.get()).toEqual({ ...DEFAULT_PREFERENCES, accent: 'sky', tabSize: 8 });
  });

  it('falls back to the default for an unknown accent', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ accent: 'plaid' }));
    const store = createPreferencesStore(storage);
    expect(store.get().accent).toBe(DEFAULT_PREFERENCES.accent);
  });

  it('falls back to the default for an out-of-range editor font size', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorFontSize: 99 }));
    const store = createPreferencesStore(storage);
    expect(store.get().editorFontSize).toBe(DEFAULT_PREFERENCES.editorFontSize);

    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorFontSize: 11 }));
    expect(createPreferencesStore(storage).get().editorFontSize).toBe(DEFAULT_PREFERENCES.editorFontSize);
  });

  it('falls back to the default for an invalid tab size', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ tabSize: 3 }));
    const store = createPreferencesStore(storage);
    expect(store.get().tabSize).toBe(DEFAULT_PREFERENCES.tabSize);
  });

  it('falls back to the default for an invalid max attempts value', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ maxAttempts: 7 }));
    const store = createPreferencesStore(storage);
    expect(store.get().maxAttempts).toBe(DEFAULT_PREFERENCES.maxAttempts);

    storage.setItem(PREFERENCES_KEY, JSON.stringify({ maxAttempts: 'unlimited' }));
    expect(createPreferencesStore(storage).get().maxAttempts).toBe('unlimited');
  });

  it('defaults the editor theme to auto and keeps a known theme', () => {
    expect(DEFAULT_PREFERENCES.editorTheme).toBe('auto');
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: 'tokyo-night' }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe('tokyo-night');
  });

  it.each(['github', 'solarized', 'vscode', 'atom-one', 'tokyo-night-storm', 'quietlight'])('keeps the %s theme family', (family) => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: family }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe(family);
  });

  it.each([
    ['github-light', 'github'],
    ['github-dark', 'github'],
    ['solarized-light', 'solarized'],
    ['solarized-dark', 'solarized'],
    ['vscode-dark', 'vscode'],
  ])('migrates the legacy %s theme to the %s family', (legacy, family) => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: legacy }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe(family);
  });

  it('falls back to the default for an unknown editor theme', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: 'one-dark' }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe(DEFAULT_PREFERENCES.editorTheme);

    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: 'vscode-light' }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe(DEFAULT_PREFERENCES.editorTheme);

    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: 'constructor' }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe(DEFAULT_PREFERENCES.editorTheme);

    storage.setItem(PREFERENCES_KEY, JSON.stringify({ editorTheme: 7 }));
    expect(createPreferencesStore(storage).get().editorTheme).toBe(DEFAULT_PREFERENCES.editorTheme);
  });

  it('rejects a non-boolean indentWithTabs', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify({ indentWithTabs: 'yes' }));
    const store = createPreferencesStore(storage);
    expect(store.get().indentWithTabs).toBe(DEFAULT_PREFERENCES.indentWithTabs);
  });

  it('survives corrupt storage and a null storage', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, '{not json');
    expect(createPreferencesStore(storage).get()).toEqual(DEFAULT_PREFERENCES);

    const memoryOnly = createPreferencesStore(null);
    expect(memoryOnly.get()).toEqual(DEFAULT_PREFERENCES);
    memoryOnly.set({ accent: 'rose' });
    expect(memoryOnly.get().accent).toBe('rose');
  });

  it('survives storage holding a non-object value', () => {
    const storage = memoryStorage();
    storage.setItem(PREFERENCES_KEY, JSON.stringify([1, 2, 3]));
    expect(createPreferencesStore(storage).get()).toEqual(DEFAULT_PREFERENCES);
  });

  it('reset restores the defaults and clears storage', () => {
    const storage = memoryStorage();
    const store = createPreferencesStore(storage);
    store.set({ accent: 'emerald' });
    store.reset();
    expect(store.get()).toEqual(DEFAULT_PREFERENCES);
    expect(storage.getItem(PREFERENCES_KEY)).toBeNull();
  });

  it('notifies subscribers once per change and stops after unsubscribe', () => {
    const store = createPreferencesStore(memoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set({ accent: 'sky' });
    unsubscribe();
    store.set({ accent: 'rose' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
