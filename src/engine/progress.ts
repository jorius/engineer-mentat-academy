export const STORAGE_KEY = 'ema:progress:v1';

export type QuestionProgress = {
  attempts: number;
  lastScore: number;
  lastAt: string;
  flagged: boolean;
  notes: string;
};

export type ProgressMap = Record<string, QuestionProgress>;

export interface ProgressStore {
  get(id: string): QuestionProgress | undefined;
  all(): ProgressMap;
  record(id: string, score: number): void;
  setFlag(id: string, flagged: boolean): void;
  setNotes(id: string, notes: string): void;
  exportJson(): string;
  importJson(json: string): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}

const EMPTY: QuestionProgress = { attempts: 0, lastScore: 0, lastAt: '', flagged: false, notes: '' };

function isProgress(value: unknown): value is QuestionProgress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.attempts === 'number' &&
    typeof v.lastScore === 'number' &&
    typeof v.lastAt === 'string' &&
    typeof v.flagged === 'boolean' &&
    typeof v.notes === 'string'
  );
}

function parseMap(json: string): ProgressMap {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Not a progress map');
  }
  const map: ProgressMap = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (!isProgress(value)) {
      throw new Error(`Invalid progress entry for ${id}`);
    }
    map[id] = value;
  }
  return map;
}

function load(storage: Storage | null): ProgressMap {
  if (storage === null) {
    return {};
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? {} : parseMap(raw);
  } catch {
    return {};
  }
}

export function createProgressStore(storage: Storage | null): ProgressStore {
  let map: ProgressMap = load(storage);
  const listeners = new Set<() => void>();

  function persist(): void {
    if (storage !== null) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(map));
      } catch {
        // storage full or blocked: keep the in-memory copy for this session
      }
    }
    listeners.forEach((fn) => fn());
  }

  function update(id: string, patch: Partial<QuestionProgress>): void {
    map = { ...map, [id]: { ...(map[id] ?? EMPTY), ...patch } };
    persist();
  }

  return {
    get: (id: string): QuestionProgress | undefined => map[id],
    all: (): ProgressMap => map,
    record: (id: string, score: number): void => {
      const current = map[id] ?? EMPTY;
      update(id, { attempts: current.attempts + 1, lastScore: score, lastAt: new Date().toISOString() });
    },
    setFlag: (id: string, flagged: boolean): void => update(id, { flagged }),
    setNotes: (id: string, notes: string): void => update(id, { notes }),
    exportJson: (): string => JSON.stringify(map, null, 2),
    importJson: (json: string): void => {
      map = parseMap(json);
      persist();
    },
    reset: (): void => {
      map = {};
      if (storage !== null) {
        try {
          storage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      listeners.forEach((fn) => fn());
    },
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
  };
}
