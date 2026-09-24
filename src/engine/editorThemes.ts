// packages
import { oneDark } from '@codemirror/theme-one-dark';
import {
  andromeda,
  atomone,
  aura,
  basicDark,
  basicLight,
  bbedit,
  darcula,
  dracula,
  duotoneDark,
  duotoneLight,
  eclipse,
  githubDark,
  githubLight,
  gruvboxDark,
  gruvboxLight,
  materialDark,
  materialLight,
  monokai,
  noctisLilac,
  nord,
  quietlight,
  solarizedDark,
  solarizedLight,
  sublime,
  tokyoNight,
  tokyoNightDay,
  tokyoNightStorm,
  vscodeDark,
  vscodeLight,
  whiteDark,
  whiteLight,
  xcodeDark,
  xcodeLight,
} from '@uiw/codemirror-themes-all';
import type { Extension } from '@codemirror/state';

// engine
import type { EditorTheme } from './preferences';

// A family ships a light variant, a dark variant or both; `auto` ships neither and resolves to
// One Dark or the plain editor from the app theme.
export type ThemeFamily = { id: EditorTheme; name: string; light?: Extension; dark?: Extension };

// Brand names stay untranslated; the Settings page shows `settings.themeAuto` for `auto`.
export const EDITOR_THEMES: readonly ThemeFamily[] = [
  { id: 'auto', name: 'Follow app theme' },
  { id: 'andromeda', name: 'Andromeda', dark: andromeda },
  { id: 'atom-one', name: 'Atom One', dark: atomone },
  { id: 'aura', name: 'Aura', dark: aura },
  { id: 'basic', name: 'Basic', light: basicLight, dark: basicDark },
  { id: 'bbedit', name: 'BBEdit', light: bbedit },
  { id: 'darcula', name: 'Darcula', dark: darcula },
  { id: 'dracula', name: 'Dracula', dark: dracula },
  { id: 'duotone', name: 'Duotone', light: duotoneLight, dark: duotoneDark },
  { id: 'eclipse', name: 'Eclipse', light: eclipse },
  { id: 'github', name: 'GitHub', light: githubLight, dark: githubDark },
  { id: 'gruvbox', name: 'Gruvbox', light: gruvboxLight, dark: gruvboxDark },
  { id: 'material', name: 'Material', light: materialLight, dark: materialDark },
  { id: 'monokai', name: 'Monokai', dark: monokai },
  { id: 'noctis-lilac', name: 'Noctis Lilac', light: noctisLilac },
  { id: 'nord', name: 'Nord', dark: nord },
  { id: 'quietlight', name: 'Quiet Light', light: quietlight },
  { id: 'solarized', name: 'Solarized', light: solarizedLight, dark: solarizedDark },
  { id: 'sublime', name: 'Sublime', dark: sublime },
  { id: 'tokyo-night', name: 'Tokyo Night', light: tokyoNightDay, dark: tokyoNight },
  { id: 'tokyo-night-storm', name: 'Tokyo Night Storm', dark: tokyoNightStorm },
  { id: 'vscode', name: 'VS Code', light: vscodeLight, dark: vscodeDark },
  { id: 'white', name: 'White', light: whiteLight, dark: whiteDark },
  { id: 'xcode', name: 'Xcode', light: xcodeLight, dark: xcodeDark },
];

const FAMILIES_BY_ID: ReadonlyMap<EditorTheme, ThemeFamily> = new Map(EDITOR_THEMES.map((family) => [family.id, family]));

export function editorThemeExtension(theme: EditorTheme, appTheme: 'light' | 'dark'): Extension {
  if (theme === 'auto') {
    return appTheme === 'dark' ? oneDark : [];
  }
  const family = FAMILIES_BY_ID.get(theme);
  // A single-variant family keeps its only variant in both app themes.
  const variant = appTheme === 'dark' ? (family?.dark ?? family?.light) : (family?.light ?? family?.dark);
  return variant ?? [];
}
