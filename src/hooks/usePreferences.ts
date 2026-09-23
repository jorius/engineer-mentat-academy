// packages
import { createContext, createElement, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';

// engine
import { createPreferencesStore } from '../engine/preferences';
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

  // useLayoutEffect (not useEffect) so a saved accent is applied before paint, never
  // flashing the default orange accent for a frame.
  useLayoutEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

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
