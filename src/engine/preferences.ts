export const PREFERENCES_KEY = 'ema:prefs:v1';

export type Accent = 'spice' | 'sky' | 'emerald' | 'violet' | 'rose';
export type EditorFont = 'jetbrains' | 'fira' | 'system';
export type TabSize = 2 | 4 | 8;
export type MaxAttempts = 1 | 2 | 3 | 'unlimited';

export type Preferences = {
  accent: Accent;
  editorFont: EditorFont;
  editorFontSize: number;
  tabSize: TabSize;
  indentWithTabs: boolean;
  maxAttempts: MaxAttempts;
};

export interface PreferencesStore {
  get(): Preferences;
  set(patch: Partial<Preferences>): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}

export const DEFAULT_PREFERENCES: Preferences = {
  accent: 'spice',
  editorFont: 'jetbrains',
  editorFontSize: 14,
  tabSize: 2,
  indentWithTabs: false,
  maxAttempts: 3,
};

const ACCENTS: readonly string[] = ['spice', 'sky', 'emerald', 'violet', 'rose'];
const EDITOR_FONTS: readonly string[] = ['jetbrains', 'fira', 'system'];
const TAB_SIZES: readonly number[] = [2, 4, 8];
const MAX_ATTEMPTS_NUMBERS: readonly number[] = [1, 2, 3];
const MIN_EDITOR_FONT_SIZE = 12;
const MAX_EDITOR_FONT_SIZE = 20;

function validateAccent(value: unknown): Accent {
  return typeof value === 'string' && ACCENTS.includes(value) ? (value as Accent) : DEFAULT_PREFERENCES.accent;
}

function validateEditorFont(value: unknown): EditorFont {
  return typeof value === 'string' && EDITOR_FONTS.includes(value) ? (value as EditorFont) : DEFAULT_PREFERENCES.editorFont;
}

function validateEditorFontSize(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_EDITOR_FONT_SIZE && value <= MAX_EDITOR_FONT_SIZE
    ? value
    : DEFAULT_PREFERENCES.editorFontSize;
}

function validateTabSize(value: unknown): TabSize {
  return typeof value === 'number' && TAB_SIZES.includes(value) ? (value as TabSize) : DEFAULT_PREFERENCES.tabSize;
}

function validateIndentWithTabs(value: unknown): boolean {
  return typeof value === 'boolean' ? value : DEFAULT_PREFERENCES.indentWithTabs;
}

function validateMaxAttempts(value: unknown): MaxAttempts {
  if (value === 'unlimited') {
    return 'unlimited';
  }
  return typeof value === 'number' && MAX_ATTEMPTS_NUMBERS.includes(value) ? (value as MaxAttempts) : DEFAULT_PREFERENCES.maxAttempts;
}

function validate(partial: Record<string, unknown>): Preferences {
  return {
    accent: validateAccent(partial.accent),
    editorFont: validateEditorFont(partial.editorFont),
    editorFontSize: validateEditorFontSize(partial.editorFontSize),
    tabSize: validateTabSize(partial.tabSize),
    indentWithTabs: validateIndentWithTabs(partial.indentWithTabs),
    maxAttempts: validateMaxAttempts(partial.maxAttempts),
  };
}

function load(storage: Storage | null): Preferences {
  if (storage === null) {
    return { ...DEFAULT_PREFERENCES };
  }
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    if (raw === null) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_PREFERENCES };
    }
    return validate(parsed as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function createPreferencesStore(storage: Storage | null): PreferencesStore {
  let preferences: Preferences = load(storage);
  const listeners = new Set<() => void>();

  function persist(): void {
    if (storage !== null) {
      try {
        storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      } catch {
        // storage full or blocked: keep the in-memory copy for this session
      }
    }
    listeners.forEach((fn) => fn());
  }

  return {
    get: (): Preferences => preferences,
    set: (patch: Partial<Preferences>): void => {
      preferences = validate({ ...preferences, ...patch });
      persist();
    },
    reset: (): void => {
      preferences = { ...DEFAULT_PREFERENCES };
      if (storage !== null) {
        try {
          storage.removeItem(PREFERENCES_KEY);
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
