export const DRILLS_KEY = 'ema:drills:v1';

export type SavedDrill = {
  id: string;
  /** User-set; `undefined` means the list describes the drill from its query. */
  name?: string;
  /** The drill's URLSearchParams string, e.g. "domain=languages&subject=typescript&kind=single,code". */
  query: string;
  /** Frozen at creation, in the shuffled order chosen then. */
  questionIds: string[];
  createdAt: string;
  /** Equals `createdAt` until a restart, which moves it to the restart time. */
  startedAt: string;
};

export interface DrillsStore {
  all(): SavedDrill[];
  get(id: string): SavedDrill | undefined;
  create(input: { query: string; questionIds: string[] }): SavedDrill;
  rename(id: string, name: string | undefined): void;
  restart(id: string): void;
  remove(id: string): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}

function isDrill(value: unknown): value is SavedDrill {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    v.id !== '' &&
    (v.name === undefined || typeof v.name === 'string') &&
    typeof v.query === 'string' &&
    Array.isArray(v.questionIds) &&
    v.questionIds.every((id) => typeof id === 'string') &&
    typeof v.createdAt === 'string' &&
    typeof v.startedAt === 'string'
  );
}

function newestFirst(drills: SavedDrill[]): SavedDrill[] {
  return [...drills].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

function load(storage: Storage | null): SavedDrill[] {
  if (storage === null) {
    return [];
  }
  try {
    const raw = storage.getItem(DRILLS_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    // Invalid entries are dropped one by one so a single bad row does not cost every drill.
    return Array.isArray(parsed) ? newestFirst(parsed.filter(isDrill)) : [];
  } catch {
    return [];
  }
}

function newId(): string {
  const uuid = globalThis.crypto?.randomUUID;
  if (typeof uuid === 'function') {
    return uuid.call(globalThis.crypto);
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDrillsStore(storage: Storage | null): DrillsStore {
  let drills: SavedDrill[] = load(storage);
  const listeners = new Set<() => void>();

  function notify(): void {
    listeners.forEach((fn) => fn());
  }

  function commit(next: SavedDrill[]): void {
    drills = newestFirst(next);
    if (storage !== null) {
      try {
        storage.setItem(DRILLS_KEY, JSON.stringify(drills));
      } catch {
        // storage full or blocked: keep the in-memory copy for this session
      }
    }
    notify();
  }

  function update(id: string, change: (drill: SavedDrill) => SavedDrill): void {
    if (!drills.some((d) => d.id === id)) {
      return;
    }
    commit(drills.map((d) => (d.id === id ? change(d) : d)));
  }

  return {
    all: (): SavedDrill[] => drills,
    get: (id: string): SavedDrill | undefined => drills.find((d) => d.id === id),
    create: ({ query, questionIds }: { query: string; questionIds: string[] }): SavedDrill => {
      const now = new Date().toISOString();
      const drill: SavedDrill = { id: newId(), query, questionIds: [...questionIds], createdAt: now, startedAt: now };
      commit([drill, ...drills]);
      return drill;
    },
    rename: (id: string, name: string | undefined): void => {
      const trimmed = name?.trim() ?? '';
      update(id, (d): SavedDrill => {
        const next: SavedDrill = { ...d, name: trimmed };
        if (trimmed === '') {
          delete next.name;
        }
        return next;
      });
    },
    restart: (id: string): void => update(id, (d): SavedDrill => ({ ...d, startedAt: new Date().toISOString() })),
    remove: (id: string): void => {
      if (drills.some((d) => d.id === id)) {
        commit(drills.filter((d) => d.id !== id));
      }
    },
    reset: (): void => {
      drills = [];
      if (storage !== null) {
        try {
          storage.removeItem(DRILLS_KEY);
        } catch {
          // ignore
        }
      }
      notify();
    },
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
  };
}
