# Editor themes and fonts — Design

**Date:** 2026-09-23
**Status:** Approved in chat (Jose: theme follows the app's light/dark mode; more fonts and themes; richer preview)
**Supersedes:** `2026-09-23-iteration-3-design.md` §6

## 1. Theme families

The preference stores a **family**, not a variant. `Preferences.editorTheme: EditorTheme` where
`EditorTheme = 'auto' | <family id>`; default `'auto'`. `src/engine/editorThemes.ts` exports:

```ts
export type ThemeFamily = { id: EditorTheme; name: string; light?: Extension; dark?: Extension };
export const EDITOR_THEMES: readonly ThemeFamily[];   // 'auto' first, then alphabetical by name
export function editorThemeExtension(theme: EditorTheme, appTheme: 'light' | 'dark'): Extension;
```

Resolution: `auto` → `oneDark` (from `@codemirror/theme-one-dark`) when the app is dark, `[]` when light.
A family with both variants → the variant matching the app theme. A family with one variant → that
variant regardless of the app theme (the user chose it knowingly; the Settings label says so).

Families (ids, names, variants) from `@uiw/codemirror-themes-all@4.25.11` (named imports only):
`basic` Basic (basicLight/basicDark) · `duotone` Duotone (duotoneLight/duotoneDark) · `github` GitHub
(githubLight/githubDark) · `gruvbox` Gruvbox (gruvboxLight/gruvboxDark) · `material` Material
(materialLight/materialDark) · `solarized` Solarized (solarizedLight/solarizedDark) · `tokyo-night`
Tokyo Night (tokyoNightDay/tokyoNight) · `vscode` VS Code (vscodeLight/vscodeDark) · `xcode` Xcode
(xcodeLight/xcodeDark) · `white` White (whiteLight/whiteDark) · dark only: `andromeda` Andromeda,
`atom-one` Atom One (atomone), `aura` Aura, `darcula` Darcula, `dracula` Dracula, `monokai` Monokai,
`nord` Nord, `sublime` Sublime, `tokyo-night-storm` Tokyo Night Storm · light only: `bbedit` BBEdit,
`eclipse` Eclipse, `noctis-lilac` Noctis Lilac, `quietlight` Quiet Light.

Migration: `validateEditorTheme` maps legacy stored values `github-light`/`github-dark` → `github`,
`solarized-light`/`solarized-dark` → `solarized`, `vscode-dark` → `vscode`; unknown → `auto`.
The seven `@uiw/codemirror-theme-*` packages are removed from package.json.

Settings: the select uses three `<optgroup>`s labelled `settings.themesBoth` ("Light and dark"),
`settings.themesDark` ("Dark only"), `settings.themesLight` ("Light only"), with `auto` as the first
option ("Follow app theme"). A one-line hint under the select (`settings.themeHint`): "Families with
both variants follow the app's light or dark mode." / "Las familias con ambas variantes siguen el modo
claro u oscuro de la app."

## 2. Fonts

`EditorFont = 'jetbrains' | 'fira' | 'source-code' | 'ibm-plex' | 'cascadia' | 'ubuntu' | 'roboto' |
'inconsolata' | 'space' | 'geist' | 'commit' | 'victor' | 'system'`, default `'jetbrains'`. Each
web font is self-hosted via `@fontsource/<name>@5.3.0`; `src/main.tsx` imports `@fontsource/<name>/400.css`
and `/700.css` for every family (index.css of a fontsource package is 400 only; import both). Stacks:

| id | stack |
| --- | --- |
| jetbrains | `'JetBrains Mono', ui-monospace, monospace` |
| fira | `'Fira Code', ui-monospace, monospace` |
| source-code | `'Source Code Pro', ui-monospace, monospace` |
| ibm-plex | `'IBM Plex Mono', ui-monospace, monospace` |
| cascadia | `'Cascadia Code', ui-monospace, monospace` |
| ubuntu | `'Ubuntu Mono', ui-monospace, monospace` |
| roboto | `'Roboto Mono', ui-monospace, monospace` |
| inconsolata | `'Inconsolata', ui-monospace, monospace` |
| space | `'Space Mono', ui-monospace, monospace` |
| geist | `'Geist Mono', ui-monospace, monospace` |
| commit | `'Commit Mono', ui-monospace, monospace` |
| victor | `'Victor Mono', ui-monospace, monospace` |
| system | `ui-monospace, SFMono-Regular, Menlo, monospace` |

Settings font select options show the font name in its own face (`style={{ fontFamily }}`); the
"(if installed)" suffix goes away since the fonts ship with the app. Keys `settings.editorFonts.<id>`
hold the display names (brand names, identical in both locales); `settings.systemMonospace` stays.
The Markdown code blocks (`.md pre`) also use the chosen editor font (set a CSS variable
`--editor-font` on `<html>` from the preference, consumed by `.md code, .md pre` and the editor).

## 3. Preview

Settings preview becomes a TypeScript snippet of about 24 lines exercising: an `interface`, a
`type` union, a generic function with a constraint, a class with a private field and a getter, an
`async` function with `await` and `try/catch`, a template literal, a regex literal, optional chaining
and nullish coalescing, an arrow with destructuring, a `for…of`, a `switch`, numbers/booleans/null,
a line comment and a block comment, `console.log`. Content is a constant in `src/pages/Settings.tsx`
(`PREVIEW_CODE`), editable in the preview as today; Reset the preview is not required.

## 4. Testing

`editorThemeExtension` per family: both-variant family follows app theme; single-variant family
returns its only variant for both app themes; `auto` unchanged; every family has at least one
variant; legacy id migration; `EDITOR_THEMES` has no duplicate ids. Fonts: validation of every id,
default, stack map complete (a test iterates the union). Settings: the select shows three optgroups
and the font select shows every font. CSS variable applied on preference change (Settings test
asserts `document.documentElement.style` or the class used).
