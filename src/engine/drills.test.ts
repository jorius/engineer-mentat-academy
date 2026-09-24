// packages
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// engine
import { DRILLS_KEY, createDrillsStore } from './drills';
import type { SavedDrill } from './drills';

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

function throwingStorage(): Storage {
  const fail = (): never => {
    throw new Error('blocked');
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

const INPUT = { query: 'domain=languages&subject=typescript', questionIds: ['q1', 'q2', 'q3'] };

describe('createDrillsStore', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('creates a drill with an id, the query, the frozen ids and matching timestamps', () => {
    const store = createDrillsStore(storage);
    const drill = store.create(INPUT);
    expect(drill.id).not.toBe('');
    expect(drill).toMatchObject({
      query: INPUT.query,
      questionIds: ['q1', 'q2', 'q3'],
      createdAt: '2026-09-23T12:00:00.000Z',
      startedAt: '2026-09-23T12:00:00.000Z',
    });
    expect(drill.name).toBeUndefined();
    expect(store.get(drill.id)).toEqual(drill);
    expect(store.get('nope')).toBeUndefined();
  });

  it('copies the question ids so later changes to the input do not leak in', () => {
    const store = createDrillsStore(storage);
    const ids = ['q1', 'q2'];
    const drill = store.create({ query: '', questionIds: ids });
    ids.push('q3');
    expect(store.get(drill.id)?.questionIds).toEqual(['q1', 'q2']);
  });

  it('gives every drill its own id, with or without crypto.randomUUID', () => {
    const store = createDrillsStore(storage);
    const a = store.create(INPUT);
    vi.stubGlobal('crypto', {});
    const b = store.create(INPUT);
    const c = store.create(INPUT);
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    expect(b.id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });

  it('lists drills newest first', () => {
    const store = createDrillsStore(storage);
    const first = store.create(INPUT);
    vi.setSystemTime(new Date('2026-09-23T13:00:00Z'));
    const second = store.create(INPUT);
    expect(store.all().map((d) => d.id)).toEqual([second.id, first.id]);
  });

  it('keeps the same list reference between changes', () => {
    const store = createDrillsStore(storage);
    store.create(INPUT);
    expect(store.all()).toBe(store.all());
  });

  it('persists and reloads drills in newest-first order', () => {
    const store = createDrillsStore(storage);
    const first = store.create(INPUT);
    vi.setSystemTime(new Date('2026-09-23T13:00:00Z'));
    const second = store.create(INPUT);
    expect(storage.getItem(DRILLS_KEY)).not.toBeNull();
    const reloaded = createDrillsStore(storage);
    expect(reloaded.all()).toEqual([second, first]);
  });

  it('renames a drill and clears the name with undefined or a blank string', () => {
    const store = createDrillsStore(storage);
    const drill = store.create(INPUT);
    store.rename(drill.id, '  TS warm-up  ');
    expect(store.get(drill.id)?.name).toBe('TS warm-up');
    expect(createDrillsStore(storage).get(drill.id)?.name).toBe('TS warm-up');
    store.rename(drill.id, '   ');
    expect(store.get(drill.id)?.name).toBeUndefined();
    store.rename(drill.id, 'Again');
    store.rename(drill.id, undefined);
    expect(store.get(drill.id)).not.toHaveProperty('name');
  });

  it('restart moves startedAt to now and keeps createdAt', () => {
    const store = createDrillsStore(storage);
    const drill = store.create(INPUT);
    vi.setSystemTime(new Date('2026-09-24T08:30:00Z'));
    store.restart(drill.id);
    expect(store.get(drill.id)).toMatchObject({ createdAt: '2026-09-23T12:00:00.000Z', startedAt: '2026-09-24T08:30:00.000Z' });
    expect(createDrillsStore(storage).get(drill.id)?.startedAt).toBe('2026-09-24T08:30:00.000Z');
  });

  it('skip moves the question to the end, persists and keeps the timestamps', () => {
    const store = createDrillsStore(storage);
    const drill = store.create(INPUT);
    vi.setSystemTime(new Date('2026-09-24T08:30:00Z'));
    store.skip(drill.id, 'q1');
    expect(store.get(drill.id)).toMatchObject({ questionIds: ['q2', 'q3', 'q1'], createdAt: drill.createdAt, startedAt: drill.startedAt });
    expect(createDrillsStore(storage).get(drill.id)?.questionIds).toEqual(['q2', 'q3', 'q1']);
    store.skip(drill.id, 'q3');
    expect(store.get(drill.id)?.questionIds).toEqual(['q2', 'q1', 'q3']);
  });

  it('skip only rotates the named drill', () => {
    const store = createDrillsStore(storage);
    const skipped = store.create(INPUT);
    const other = store.create(INPUT);
    store.skip(skipped.id, 'q2');
    expect(store.get(skipped.id)?.questionIds).toEqual(['q1', 'q3', 'q2']);
    expect(store.get(other.id)?.questionIds).toEqual(['q1', 'q2', 'q3']);
  });

  it('ignores skip for an unknown drill, an unknown question or the last question without notifying', () => {
    const store = createDrillsStore(storage);
    const drill = store.create(INPUT);
    const before = store.all();
    const listener = vi.fn();
    store.subscribe(listener);
    store.skip('nope', 'q1');
    store.skip(drill.id, 'nope');
    store.skip(drill.id, 'q3');
    expect(store.all()).toBe(before);
    expect(store.get(drill.id)?.questionIds).toEqual(['q1', 'q2', 'q3']);
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes one drill', () => {
    const store = createDrillsStore(storage);
    const keep = store.create(INPUT);
    const drop = store.create(INPUT);
    store.remove(drop.id);
    expect(store.all()).toEqual([keep]);
    expect(createDrillsStore(storage).all()).toEqual([keep]);
  });

  it('ignores rename, restart and remove for an unknown id without notifying', () => {
    const store = createDrillsStore(storage);
    store.create(INPUT);
    const before = store.all();
    const listener = vi.fn();
    store.subscribe(listener);
    store.rename('nope', 'x');
    store.restart('nope');
    store.remove('nope');
    expect(store.all()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it('reset clears everything, including storage', () => {
    const store = createDrillsStore(storage);
    store.create(INPUT);
    store.reset();
    expect(store.all()).toEqual([]);
    expect(storage.getItem(DRILLS_KEY)).toBeNull();
  });

  it('notifies subscribers once per change and stops after unsubscribe', () => {
    const store = createDrillsStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const drill = store.create(INPUT);
    store.rename(drill.id, 'x');
    store.restart(drill.id);
    store.skip(drill.id, 'q1');
    store.remove(drill.id);
    store.reset();
    expect(listener).toHaveBeenCalledTimes(6);
    unsubscribe();
    store.create(INPUT);
    expect(listener).toHaveBeenCalledTimes(6);
  });

  it('drops invalid entries on load and keeps the valid ones', () => {
    const valid: SavedDrill = { id: 'a', query: 'unseen=1', questionIds: ['q1'], createdAt: '2026-09-20T00:00:00.000Z', startedAt: '2026-09-20T00:00:00.000Z' };
    const named: SavedDrill = { ...valid, id: 'b', name: 'Named', createdAt: '2026-09-21T00:00:00.000Z' };
    storage.setItem(
      DRILLS_KEY,
      JSON.stringify([
        valid,
        named,
        { ...valid, id: 'c', questionIds: [1] },
        { ...valid, id: 'd', name: 3 },
        { ...valid, id: 'e', startedAt: undefined },
        { ...valid, id: '' },
        null,
        'drill',
      ]),
    );
    expect(createDrillsStore(storage).all()).toEqual([named, valid]);
  });

  it('starts empty on corrupt or non-list storage', () => {
    storage.setItem(DRILLS_KEY, '{not json');
    expect(createDrillsStore(storage).all()).toEqual([]);
    storage.setItem(DRILLS_KEY, '{"a": 1}');
    expect(createDrillsStore(storage).all()).toEqual([]);
  });

  it('works in memory with a null or a throwing storage', () => {
    const memoryOnly = createDrillsStore(null);
    const drill = memoryOnly.create(INPUT);
    expect(memoryOnly.get(drill.id)).toEqual(drill);
    memoryOnly.reset();
    expect(memoryOnly.all()).toEqual([]);
    const blocked = createDrillsStore(throwingStorage());
    const other = blocked.create(INPUT);
    blocked.rename(other.id, 'x');
    expect(blocked.get(other.id)?.name).toBe('x');
    blocked.reset();
    expect(blocked.all()).toEqual([]);
  });
});
