# Engineer Mentat Academy

An interactive technical-interview trainer. Junior, mid and senior questions across
languages (JavaScript, TypeScript, C#, Java), libraries, frameworks (Express, NestJS,
Next.js, .NET, ASP.NET Core, Spring Boot), runtimes, APIs, architecture, databases, cloud
and engineering practices, with a code scratchpad that runs JavaScript/TypeScript in a Web
Worker and a SQL scratchpad backed by SQLite in WebAssembly. The interface and every
question are available in English and Spanish.

Live: https://jorius.github.io/engineer-mentat-academy/

## Modes

- **Browse**: domain → subject → topic, with mastery per subject. Level and kind chips
  show only what exists in the current scope, with live counts, and every topic has its own
  Drill button.
- **Drill**: filtered stream with instant grading and explanations. Opening Drill without
  a filter shows a setup card: pick domain, subject and topic, levels, kinds and whether to
  include only unseen, marked or missed questions. Every drill you start is saved and picks
  up at the next unanswered question; "My drills", under the setup card, lists them with
  their progress so you can resume, rename, restart or delete them, and Home links to the
  latest unfinished one. Skip moves a question to the end of the drill.
- **Mock**: random, mixed-level session with a results page. Choose the number of
  questions, timed or untimed, and the domains, levels and kinds to draw from. Skip moves
  on without answering and the results list the question as skipped.
- **Review**: everything you missed or marked for review. Skip leaves a question in Review for
  later.

Every question gives you retries up to the max attempts set in Settings (or unlimited), with
a Show answer fallback that reveals the key without grading once you're done trying. The
header's Mark for review star puts a question in Review even if you got it right, and a
question solved only after a wrong attempt is marked for you. Keyboard: `Ctrl+Enter` submits,
`N` moves to the next question once it is resolved, and `M` toggles Mark for review.
Choice options are shown in a stable shuffled order per question, so the position of the
correct answer never gives it away.

## Settings

Accent colour, editor font (twelve bundled monospace faces such as JetBrains Mono, Fira
Code, Cascadia Code and Geist Mono, or the system one), font size, tab size and tabs vs
spaces, max attempts per question, and the editor colour theme, chosen by family: families
with both variants (GitHub, Solarized, VS Code, Material, Gruvbox, Xcode, Tokyo Night…) follow
the app's light or dark mode, while dark-only (Dracula, Monokai, Nord…) and light-only
(BBEdit, Eclipse, Quiet Light…) families always use their one variant. The preview under the
editor settings is editable. The Danger zone at the bottom clears progress or resets
everything after you type `RESET`.

## Question kinds

`single`, `multi`, `predict` (type the program output), `code` and `fix` (hidden tests
run in the browser), `sql` (rows compared against the expected set), `open` (model
answer plus a rubric you self-score).

## Development

```
npm install
npm run dev        # http://localhost:5173/engineer-mentat-academy/
npm test           # vitest, includes the content test that executes every solution
npm run build      # tsc -b && vite build, copies 404.html for SPA deep links
```

Node 24.15.0, npm only, exact version pins.

Before the first push to `main`, set the repository's Pages source to GitHub Actions (Settings → Pages → Source), or the deploy job fails.

## Adding questions

Questions live in `src/content/<domain>/<subject>.ts` and export a `questions` array
typed as `Question[]`. Domain, subject and topic ids must exist in
`src/content/taxonomy.ts`. Ids are kebab-case and start with the subject id. The
content test validates the schema and runs every `code`, `fix`, `sql` and `predict`
reference, so a wrong answer key fails `npm test`. Spanish text lives next to each file in
`<subject>.es.ts`, keyed by question id; the runner only executes JavaScript, TypeScript
and SQL, so subjects in other languages use the choice and open kinds. Every subject and
domain has a glyph in `src/content/glyphs.ts`.

## Grading and AI hand-off

Grading goes through the `Grader` interface (`src/engine/grader.ts`). The static
grader ships today. A Claude grader can be added by implementing the same interface
against the Messages API with a key the user pastes in Settings; nothing else changes.

## Progress

Stored in `localStorage` under `ema:progress:v1`; saved drills live under `ema:drills:v1`
and preferences under `ema:prefs:v1`. Export and import progress from Settings; both
Danger-zone actions also delete the saved drills. Nothing leaves the browser.

## Standards

Jericho Digital conventions: TypeScript strict, explicit return types, labeled import
groups, no barrel files, exact dependency pins, commit subjects that start with a
capitalized infinitive verb (enforced by Husky).
