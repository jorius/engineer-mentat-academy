# Engineer Mentat Academy

An interactive technical-interview trainer. Junior, mid and senior questions across
languages, libraries, frameworks, runtimes, APIs, architecture, databases, cloud and
engineering practices, with a code scratchpad that runs JavaScript/TypeScript in a Web
Worker and a SQL scratchpad backed by SQLite in WebAssembly.

Live: https://jorius.github.io/engineer-mentat-academy/

## Modes

- **Browse**: domain → subject → topic, with mastery per subject.
- **Drill**: filtered stream with instant grading and explanations.
- **Mock**: timed, random, mixed-level session with a results page.
- **Review**: everything you missed or marked for review.

Every question gives you retries up to the max attempts set in Settings (or unlimited), with
a Show answer fallback that reveals the key without grading once you're done trying. The
header's Mark for review star puts a question in Review and in mock results even if you got
it right. Keyboard: `Ctrl+Enter` submits, `N` moves to the next question once it is resolved,
and `M` toggles Mark for review.

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
reference, so a wrong answer key fails `npm test`.

## Grading and AI hand-off

Grading goes through the `Grader` interface (`src/engine/grader.ts`). The static
grader ships today. A Claude grader can be added by implementing the same interface
against the Messages API with a key the user pastes in Settings; nothing else changes.

## Progress

Stored in `localStorage` under `ema:progress:v1`. Export and import from Settings.
Nothing leaves the browser.

## Standards

Jericho Digital conventions: TypeScript strict, explicit return types, labeled import
groups, no barrel files, exact dependency pins, commit subjects that start with a
capitalized infinitive verb (enforced by Husky).
