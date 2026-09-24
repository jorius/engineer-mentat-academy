// packages
import { createContext, createElement, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';

// engine
import { createProgressStore } from '../engine/progress';
import type { ProgressMap, ProgressStore } from '../engine/progress';

const ProgressContext = createContext<ProgressStore | null>(null);

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ProgressProvider({ children, store }: { children: ReactNode; store?: ProgressStore }): ReactElement {
  const value = useMemo((): ProgressStore => store ?? createProgressStore(safeStorage()), [store]);
  return createElement(ProgressContext.Provider, { value }, children);
}

export function useProgress(): { store: ProgressStore; progress: ProgressMap } {
  const store = useContext(ProgressContext);
  if (store === null) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  const progress = useSyncExternalStore(store.subscribe, store.all, store.all);
  return { store, progress };
}
