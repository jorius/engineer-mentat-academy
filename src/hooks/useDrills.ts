// packages
import { createContext, createElement, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';

// engine
import { createDrillsStore } from '../engine/drills';
import type { DrillsStore, SavedDrill } from '../engine/drills';

const DrillsContext = createContext<DrillsStore | null>(null);

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function DrillsProvider({ children, store }: { children: ReactNode; store?: DrillsStore }): ReactElement {
  const value = useMemo((): DrillsStore => store ?? createDrillsStore(safeStorage()), [store]);
  return createElement(DrillsContext.Provider, { value }, children);
}

export function useDrills(): { store: DrillsStore; drills: SavedDrill[] } {
  const store = useContext(DrillsContext);
  if (store === null) {
    throw new Error('useDrills must be used inside DrillsProvider');
  }
  const drills = useSyncExternalStore(store.subscribe, store.all, store.all);
  return { store, drills };
}
