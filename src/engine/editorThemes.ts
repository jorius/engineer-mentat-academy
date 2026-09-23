// packages
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
import type { EditorTheme } from './preferences';

// Brand names stay untranslated; the Settings page shows `settings.themeAuto` for `auto`.
export const EDITOR_THEMES: readonly { id: EditorTheme; name: string }[] = [
  { id: 'auto', name: 'Follow app theme' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'monokai', name: 'Monokai' },
  { id: 'github-light', name: 'GitHub Light' },
  { id: 'github-dark', name: 'GitHub Dark' },
  { id: 'solarized-light', name: 'Solarized Light' },
  { id: 'solarized-dark', name: 'Solarized Dark' },
  { id: 'nord', name: 'Nord' },
  { id: 'tokyo-night', name: 'Tokyo Night' },
  { id: 'vscode-dark', name: 'VS Code Dark' },
];

const NAMED_THEMES: Record<Exclude<EditorTheme, 'auto'>, Extension> = {
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

export function editorThemeExtension(theme: EditorTheme, appTheme: 'light' | 'dark'): Extension {
  if (theme === 'auto') {
    return appTheme === 'dark' ? oneDark : [];
  }
  return NAMED_THEMES[theme];
}
