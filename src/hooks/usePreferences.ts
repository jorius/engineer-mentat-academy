// packages
import { createContext, createElement, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';

// engine
import { FONT_STACKS, createPreferencesStore } from '../engine/preferences';
import type { Preferences, PreferencesStore } from '../engine/preferences';

const PreferencesContext = createContext<PreferencesStore | null>(null);

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function PreferencesProvider({ children, store }: { children: ReactNode; store?: PreferencesStore }): ReactElement {
  const value = useMemo((): PreferencesStore => store ?? createPreferencesStore(safeStorage()), [store]);
  const accent = useSyncExternalStore(
    value.subscribe,
    (): Preferences['accent'] => value.get().accent,
    (): Preferences['accent'] => value.get().accent,
  );

  const editorFont = useSyncExternalStore(
    value.subscribe,
    (): Preferences['editorFont'] => value.get().editorFont,
    (): Preferences['editorFont'] => value.get().editorFont,
  );

  // useLayoutEffect (not useEffect) so a saved accent is applied before paint, never
  // flashing the default orange accent for a frame.
  useLayoutEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  // The editor and Markdown code read the chosen font from this variable; set before paint for the same reason.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--editor-font', FONT_STACKS[editorFont]);
  }, [editorFont]);

  return createElement(PreferencesContext.Provider, { value }, children);
}

export function usePreferences(): { store: PreferencesStore; preferences: Preferences } {
  const store = useContext(PreferencesContext);
  if (store === null) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }
  const preferences = useSyncExternalStore(store.subscribe, store.get, store.get);
  return { store, preferences };
}
