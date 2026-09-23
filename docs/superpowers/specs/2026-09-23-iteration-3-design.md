# Iteration 3 — Chrome, filters, mock setup, editor themes, new subjects

**Date:** 2026-09-23
**Status:** Approved in chat and mockups (filters option A "chip bar", mock setup option 2 "two panels")
**Builds on:** `2026-09-23-engineer-mentat-academy-design.md`, `2026-09-23-question-workbench-design.md`

## 1. Goals

1. Top bar: a language `<select>` and an icon theme toggle with a tooltip.
2. No page title above the workbench on Drill, Mock and Review sessions.
3. Toolbar icons from one icon set instead of emoji; permalink uses a link icon.
4. Subject and domain glyphs (Simple Icons for brands, Feather outlines otherwise) in the breadcrumb, Browse cards and filters.
5. Filters as toggle chips with live counts, showing only the levels and kinds that exist in the current scope; per-topic "Drill · N" buttons; a Drill setup card when Drill is opened without parameters.
6. Mock setup as two panels (Format, Scope) with steppers, a timed/untimed toggle, chips, a summary sentence and Start.
7. An editor colour theme preference in Settings.
8. Five new subjects: C# and Java (Languages), .NET, ASP.NET Core and Spring Boot (Frameworks), 8 questions each, English and Spanish.

## 2. Top bar and toolbar

- Language: `<select aria-label=common.language>` listing `SUPPORTED_LANGUAGES` with their native names (`common.english` → "English", `common.spanish` → "Español" in both locales; native names do not translate). Changing it calls `i18n.changeLanguage`.
- Theme: one `<button>` with `FiSun` (when dark, meaning "switch to light") or `FiMoon` (when light), `aria-label` and `title` = `common.switchToLight` / `common.switchToDark`. The text buttons go away; keys `common.dark`, `common.light`, `common.en`, `common.es` are removed.
- HeaderStrip: Mark for review uses `FiStar` (filled via `fill="currentColor"` when marked), My notes uses `FiFileText`, permalink uses `FiLink` with `title` = `question.copyLink` ("Copy link to this question"). Icons are `aria-hidden`; the buttons keep their text labels.
- Drill, Mock and Review render `QuestionView` without the `<h1>` above it while a question is on screen. Setup, empty and completion screens keep their headings.

## 3. Glyphs

`src/content/glyphs.ts` exports `domainGlyph(domainId): IconType` and `subjectGlyph(subjectId): IconType` with a complete map (a test asserts every domain and subject in the taxonomy has an entry; unknown ids fall back to `FiBox`). Brands: javascript SiJavascript, typescript SiTypescript, csharp TbBrandCSharp, java SiOpenjdk, react SiReact, redux SiRedux, react-router SiReactrouter, react-testing-library SiTestinglibrary, typeorm SiTypeorm, prisma SiPrisma, express SiExpress, nestjs SiNestjs, nextjs SiNextdotjs, dotnet SiDotnet, aspnet SiDotnet, spring-boot SiSpringboot, nodejs SiNodedotjs, graphql SiGraphql, distributed-systems SiApachekafka, nosql SiMongodb, dynamodb SiAmazondynamodb, rds SiAmazonrds, aws SiAmazonwebservices, containers SiDocker, iac SiTerraform, serverless SiAwslambda, cicd SiGithubactions. Neutral: rest FiGlobe, api-design FiCompass, api-security FiShield, design-patterns FiLayers, solid FiCheckSquare, clean-code FiCode, architecture-patterns FiGrid, sql FiDatabase, testing FiCheckCircle, security FiLock, operations FiActivity, ai-assisted-development FiCpu. Domains: languages FiCode, libraries FiPackage, frameworks FiLayers, runtimes FiServer, apis FiGlobe, architecture FiGrid, databases FiDatabase, cloud FiCloud, practices FiTool.

`<Glyph id kind="domain"|"subject" className>` renders the icon `aria-hidden` at `1em`. It appears before the domain and subject names in the breadcrumb, before the card titles on Home, Browse and BrowseDomain, and inside scope chips.

## 4. Filters (option A)

- `src/utils/filterFacets.ts`: `facets(questions, { levels, kinds })` returns `{ levels: {value, count}[], kinds: {value, count}[] }` where each count is computed with the *other* group's selection applied and only values with a count > 0 in the unfiltered scope are listed (so "SQL query" never appears outside Databases).
- `src/components/filters/ChipGroup.tsx`: `<ChipGroup label options={{value,label,hint?,count?,glyph?}[]} selected onChange allLabel>`; chips are `<button aria-pressed>`; an "All" text button selects every option; a group with no selection means all (the pages already treat empty as all).
- `src/components/filters/OnlyChips.tsx`: unseen / marked / missed toggles (single select, none = everything) using progress: unseen = attempts 0, marked = flagged, missed = attempts > 0 and lastScore < 1.
- BrowseSubject: chip groups replace the checkbox rows; each topic heading gets `Drill · N` (link to `/drill?domain&subject&topic&level&kind`), hidden when N = 0; the page "Drill these N" stays.
- Drill without any filter parameter shows a setup card: domain select (with glyph), subject select, topic select (each "All …" by default), level and kind chip groups (scope-aware), Only chips, a live "N questions match" line and Start, which navigates to `/drill?…` with the chosen parameters. With parameters, Drill behaves as today. `unseen=1` keeps meaning "unseen only".
- Mock reuses `ChipGroup` and `OnlyChips` (see §5).

## 5. Mock setup (option 2)

Two `Card`s side by side on `md` and stacked below. **Format:** Questions stepper (1–50, −/+ buttons around a number input), Minutes stepper (5–180) with the hint "N min each", Timer segmented control Timed / Untimed. **Scope:** domain chips with glyphs (none = all), level chip group, kind chip group (scope-aware for the chosen domains). Under both, a summary sentence built from i18n (`mock.summary` = "{{count}} questions in {{minutes}} min from {{scope}} · {{levels}} · {{available}} available"; untimed replaces the minutes clause) and the Start button (disabled when available = 0 or no level). `pickMock` gains `kinds: Kind[]`. Untimed sessions render no clock and never expire.

## 6. Editor colour theme

`Preferences.editorTheme: EditorTheme` with `EditorTheme = 'auto' | 'dracula' | 'monokai' | 'github-light' | 'github-dark' | 'solarized-light' | 'solarized-dark' | 'nord' | 'tokyo-night' | 'vscode-dark'`, default `'auto'` (today's behaviour: One Dark in dark mode, plain in light). `src/engine/editorThemes.ts` maps each id to its extension (`auto` resolves from the app theme) and a display name. `CodeEditor` uses it instead of the inline `oneDark` choice; Settings gets a select "Colour theme" in the Editor section above the preview. A test covers validation and the `auto` resolution.

## 7. New subjects

Taxonomy additions (EN / ES names):
- languages/csharp "C#": topics `basics` (Types, value vs reference, nullability / Tipos, valor vs referencia, nulabilidad), `async` (async/await and Tasks / async/await y Tasks), `linq` (LINQ and collections / LINQ y colecciones).
- languages/java "Java": `basics` (Types, generics and records / Tipos, genéricos y records), `collections-and-streams` (Collections and Streams / Colecciones y Streams), `concurrency` (Concurrency / Concurrencia).
- frameworks/dotnet ".NET": `hosting-and-di` (Hosting and dependency injection / Hosting e inyección de dependencias), `configuration` (Configuration and options / Configuración y opciones), `entity-framework` (Entity Framework Core / Entity Framework Core).
- frameworks/aspnet "ASP.NET Core": `minimal-apis-and-controllers` (Minimal APIs and controllers / Minimal APIs y controladores), `middleware` (Middleware pipeline / Pipeline de middleware), `auth` (Authentication and authorization / Autenticación y autorización).
- frameworks/spring-boot "Spring Boot": `beans-and-di` (Beans and dependency injection / Beans e inyección de dependencias), `web` (Spring MVC and REST controllers / Spring MVC y controladores REST), `data-jpa` (Spring Data JPA / Spring Data JPA).

Each subject file holds 8 questions: 2 junior, 3 mid, 3 senior; kinds limited to `single`, `multi` and `open` (the runner executes only JavaScript, TypeScript and SQL). Senior explanations carry `**Say this out loud:**` (ES: `**Dilo en voz alta:**`). Ids start with the subject id; `source: 'topic-list'`; every question fully translated in `<subject>.es.ts`. Code in prompts uses fenced blocks with `csharp` or `java` (rendered unhighlighted; that is acceptable).

## 8. Out of scope

Drill builder (option C), facet rail (B), mock presets (1), wizard (3), results page changes, C#/Java code execution, highlight.js grammars for C#/Java.

## 9. Testing

Unit: glyph map completeness; facets; ChipGroup aria-pressed and All; editor theme validation; pickMock kinds. Component: Layout select changes language and theme button label flips; HeaderStrip icons and copy-link title; BrowseSubject shows only kinds present and per-topic Drill links; Drill setup card navigates with the built query; Mock summary sentence and untimed session without a clock. Content: existing content test covers the 40 new questions and translations. Locale parity test covers every new key.

## 10. Danger zone (added 2026-09-23, Jose's request)

Settings ends with a "Danger zone" section (red border, heading `settings.dangerHeading`). It holds two actions and replaces the small Reset button in the Progress section:

- **Clear progress** (`settings.clearProgress`): wipes attempts, scores, marks and notes (`progressStore.reset()`), keeps preferences. Confirmed by an inline field: the button is disabled until the user types `RESET` (`settings.typeToConfirm` = "Type RESET to confirm" / "Escribe RESET para confirmar"); no `window.confirm`.
- **Reset everything** (`settings.resetEverything`): clears progress, preferences (`preferencesStore.reset()`), the theme key `ema:theme` and the language key `ema:lang`, then resets i18n to the detector default and the theme to dark. Same typed confirmation, one shared field for the section.
- After either action a status line (`settings.cleared` / `settings.resetDone` = "Everything was reset." / "Se restableció todo.") replaces the field and the field empties.
- `settings.dangerNote`: "These actions only affect this browser and cannot be undone." / "Estas acciones solo afectan a este navegador y no se pueden deshacer."
