// packages
import { beforeEach, describe, expect, it, vi } from 'vitest';

// engine
import { STORAGE_KEY, createProgressStore } from './progress';

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

describe('createProgressStore', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T12:00:00Z'));
  });

  it('records an attempt and persists it', () => {
    const store = createProgressStore(storage);
    store.record('q1', 1);
    store.record('q1', 0.5);
    expect(store.get('q1')).toEqual({
      attempts: 2,
      lastScore: 0.5,
      lastAt: '2026-09-23T12:00:00.000Z',
      flagged: false,
      notes: '',
    });
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toHaveProperty('q1');
  });

  it('flags and notes without an attempt', () => {
    const store = createProgressStore(storage);
    store.setFlag('q2', true);
    store.setNotes('q2', 'review this');
    expect(store.get('q2')).toMatchObject({ attempts: 0, flagged: true, notes: 'review this' });
  });

  it('round-trips through export and import', () => {
    const store = createProgressStore(storage);
    store.record('q1', 1);
    const json = store.exportJson();
    const fresh = createProgressStore(memoryStorage());
    fresh.importJson(json);
    expect(fresh.get('q1')?.lastScore).toBe(1);
  });

  it('rejects an import that is not a progress map', () => {
    const store = createProgressStore(storage);
    expect(() => store.importJson('[1,2]')).toThrow(/progress/i);
    expect(() => store.importJson('{"q": {"attempts": "no"}}')).toThrow(/progress/i);
  });

  it('survives corrupt storage and a null storage', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    const store = createProgressStore(storage);
    expect(store.all()).toEqual({});
    const memoryOnly = createProgressStore(null);
    memoryOnly.record('q1', 1);
    expect(memoryOnly.get('q1')?.attempts).toBe(1);
  });

  it('notifies subscribers once per change and stops after unsubscribe', () => {
    const store = createProgressStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.record('q1', 1);
    unsubscribe();
    store.record('q1', 1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reset clears everything', () => {
    const store = createProgressStore(storage);
    store.record('q1', 1);
    store.reset();
    expect(store.all()).toEqual({});
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
