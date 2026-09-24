// packages
import { describe, expect, it } from 'vitest';
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
import { EDITOR_THEMES, editorThemeExtension } from './editorThemes';
import { EDITOR_THEME_IDS } from './preferences';
import type { EditorTheme } from './preferences';

const BOTH_VARIANTS: readonly [EditorTheme, Extension, Extension][] = [
  ['basic', basicLight, basicDark],
  ['duotone', duotoneLight, duotoneDark],
  ['github', githubLight, githubDark],
  ['gruvbox', gruvboxLight, gruvboxDark],
  ['material', materialLight, materialDark],
  ['solarized', solarizedLight, solarizedDark],
  ['tokyo-night', tokyoNightDay, tokyoNight],
  ['vscode', vscodeLight, vscodeDark],
  ['xcode', xcodeLight, xcodeDark],
  ['white', whiteLight, whiteDark],
];

const DARK_ONLY: readonly [EditorTheme, Extension][] = [
  ['andromeda', andromeda],
  ['atom-one', atomone],
  ['aura', aura],
  ['darcula', darcula],
  ['dracula', dracula],
  ['monokai', monokai],
  ['nord', nord],
  ['sublime', sublime],
  ['tokyo-night-storm', tokyoNightStorm],
];

const LIGHT_ONLY: readonly [EditorTheme, Extension][] = [
  ['bbedit', bbedit],
  ['eclipse', eclipse],
  ['noctis-lilac', noctisLilac],
  ['quietlight', quietlight],
];

describe('editorThemeExtension', () => {
  it('resolves auto to One Dark in the dark app theme', () => {
    expect(editorThemeExtension('auto', 'dark')).toBe(oneDark);
  });

  it('resolves auto to no theme in the light app theme', () => {
    expect(editorThemeExtension('auto', 'light')).toEqual([]);
  });

  it.each(BOTH_VARIANTS)('follows the app theme for the %s family', (id, light, dark) => {
    expect(editorThemeExtension(id, 'light')).toBe(light);
    expect(editorThemeExtension(id, 'dark')).toBe(dark);
  });

  it.each([...DARK_ONLY, ...LIGHT_ONLY])('returns the only variant of %s in both app themes', (id, only) => {
    expect(editorThemeExtension(id, 'light')).toBe(only);
    expect(editorThemeExtension(id, 'dark')).toBe(only);
  });
});

describe('EDITOR_THEMES', () => {
  it('lists auto first and then the families alphabetically by name', () => {
    expect(EDITOR_THEMES[0]).toEqual({ id: 'auto', name: 'Follow app theme' });
    const names = EDITOR_THEMES.slice(1).map((family) => family.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    expect(EDITOR_THEMES.find((family) => family.id === 'tokyo-night')?.name).toBe('Tokyo Night');
    expect(EDITOR_THEMES.find((family) => family.id === 'vscode')?.name).toBe('VS Code');
  });

  it('has no duplicate ids', () => {
    const ids = EDITOR_THEMES.map((family) => family.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists exactly the ids the preferences accept', () => {
    const ids = EDITOR_THEMES.map((family) => family.id);
    expect([...ids].sort()).toEqual([...EDITOR_THEME_IDS].sort());
  });

  it('gives every family other than auto at least one variant', () => {
    const families = EDITOR_THEMES.filter((family) => family.id !== 'auto');
    expect(families).toHaveLength(BOTH_VARIANTS.length + DARK_ONLY.length + LIGHT_ONLY.length);
    for (const family of families) {
      expect(family.light !== undefined || family.dark !== undefined).toBe(true);
    }
  });

  it('groups the families by the variants they ship', () => {
    const both = EDITOR_THEMES.filter((family) => family.light !== undefined && family.dark !== undefined).map((family) => family.id);
    const darkOnly = EDITOR_THEMES.filter((family) => family.light === undefined && family.dark !== undefined).map((family) => family.id);
    const lightOnly = EDITOR_THEMES.filter((family) => family.light !== undefined && family.dark === undefined).map((family) => family.id);
    expect([...both].sort()).toEqual(BOTH_VARIANTS.map(([id]) => id).sort());
    expect([...darkOnly].sort()).toEqual(DARK_ONLY.map(([id]) => id).sort());
    expect([...lightOnly].sort()).toEqual(LIGHT_ONLY.map(([id]) => id).sort());
  });
});
