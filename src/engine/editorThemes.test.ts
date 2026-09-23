// packages
import { describe, expect, it } from 'vitest';
import { oneDark } from '@codemirror/theme-one-dark';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { nord } from '@uiw/codemirror-theme-nord';
import { solarizedDark, solarizedLight } from '@uiw/codemirror-theme-solarized';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import type { Extension } from '@codemirror/state';

// engine
import { EDITOR_THEMES, editorThemeExtension } from './editorThemes';
import type { EditorTheme } from './preferences';

describe('editorThemeExtension', () => {
  it('resolves auto to One Dark in the dark app theme', () => {
    expect(editorThemeExtension('auto', 'dark')).toBe(oneDark);
  });

  it('resolves auto to no theme in the light app theme', () => {
    expect(editorThemeExtension('auto', 'light')).toEqual([]);
  });

  it('returns each named theme regardless of the app theme', () => {
    const expected: Record<Exclude<EditorTheme, 'auto'>, Extension> = {
      dracula,
      monokai,
      'github-light': githubLight,
      'github-dark': githubDark,
      'solarized-light': solarizedLight,
      'solarized-dark': solarizedDark,
      nord,
      'tokyo-night': tokyoNight,
      'vscode-dark': vscodeDark,
    };
    for (const [id, extension] of Object.entries(expected)) {
      expect(editorThemeExtension(id as EditorTheme, 'light')).toBe(extension);
      expect(editorThemeExtension(id as EditorTheme, 'dark')).toBe(extension);
    }
  });
});

describe('EDITOR_THEMES', () => {
  it('lists every theme once with auto first', () => {
    const ids = EDITOR_THEMES.map((theme) => theme.id);
    expect(ids).toEqual(['auto', 'dracula', 'monokai', 'github-light', 'github-dark', 'solarized-light', 'solarized-dark', 'nord', 'tokyo-night', 'vscode-dark']);
    expect(EDITOR_THEMES.find((theme) => theme.id === 'tokyo-night')?.name).toBe('Tokyo Night');
  });
});
