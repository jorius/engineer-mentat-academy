# Engineer Mentat Academy — Design

**Date:** 2026-09-23
**Status:** Approved for planning
**Owner:** Jose Rios
**Deadline:** usable for practice by Friday 2026-09-25 (a senior JavaScript/full-stack interview)

## 1. Goal and scope

A public, static single-page app at `https://jorius.github.io/engineer-mentat-academy/`
that drills technical interview questions at junior, mid and senior level across the
full topic list for a senior JavaScript/full-stack interview. It is self-graded in v1,
with a clean seam for AI grading later.

In scope for v1:

- Browse the question bank by domain, subject and topic.
- Drill: filtered question stream with immediate grading.
- Mock: timed, random, mixed session.
- Review: questions missed or flagged.
- Code scratchpad that runs JavaScript/TypeScript in the browser against hidden tests.
- SQL scratchpad that runs queries against a seeded in-browser SQLite database.
- Progress stored locally, exportable as JSON.

Out of scope for v1:

- Any backend, account, or network call at runtime.
- AI grading (only the interface and a settings slot ship).
- React component preview in the scratchpad.
- Folding into `jorius.github.io` (planned for after the interview; same stack keeps
  that a copy).

Constraint that shaped every decision: the engine must be finished on 2026-09-23 so
content generation can run in parallel on 2026-09-24.

## 2. Content model

### 2.1 Taxonomy

Three levels: **domain** (what kind of thing it is) → **subject** (the named
technology or discipline) → **topic** (the question's focus). Cross-cutting concerns
are expressed with tags, not duplicated entries.

| Domain | Subjects | Example topics |
| --- | --- | --- |
| `languages` | `javascript`, `typescript` | event-loop, closures, references-and-copies, this-binding, async, coercion-and-equality, hoisting-and-scope, prototypes, functional, es-features, event-delegation; generics, aliases-vs-interfaces, enums, unions-and-narrowing, optional-fields, utility-types, boundaries |
| `libraries` | `react`, `redux`, `react-router`, `react-testing-library`, `typeorm`, `prisma` | components-and-lifecycle, hooks, dependency-arrays, re-rendering, props-and-state, forms, performance; redux-toolkit; routing; rtl; orm-usage, n-plus-one |
| `frameworks` | `express`, `nestjs`, `nextjs` | middleware, routing, error-handling; modules, providers, pipes; app-router, rendering-modes |
| `runtimes` | `nodejs` | fundamentals, event-loop-phases, streams-and-large-files, worker-threads-and-cpu-work, execution-models (daemon, serverless, API, scripting), request-batching |
| `apis` | `rest`, `graphql`, `api-design`, `api-security` | http-methods, status-codes, idempotency; schema-and-resolvers, graphql-vs-rest; pagination, versioning; authn-vs-authz, rate-limiting, common-practices |
| `architecture` | `design-patterns`, `solid`, `clean-code`, `architecture-patterns`, `distributed-systems` | creational, structural, behavioral; each principle; naming, functions; layered, hexagonal, bff, event-driven; microservices, kafka, dead-letter-queues, idempotency, retries, correlation-ids-and-tracing |
| `databases` | `sql`, `nosql`, `dynamodb`, `rds` | fundamentals, aggregation, joins, group-by, indexing, query-optimization; use-cases, sql-vs-nosql; keys-and-access-patterns; engines-and-operations |
| `cloud` | `aws`, `containers`, `iac`, `serverless`, `cicd` | lambda, api-gateway, s3, s3-event-notifications, sns, s3-to-sns, ecs, fargate, cognito; docker-basics, containerization; iaas-vs-iac, terraform, cloudformation; serverless-architecture; pipelines |
| `practices` | `testing`, `security`, `operations`, `ai-assisted-development` | strategies, unit, integration, frontend, backend; web-security-basics, xss, csrf; production-debugging, logging-and-monitoring, performance-optimization; tooling |

Subjects are the unit of authoring: one file per subject, topics are a field on each
question. The taxonomy itself is data (`src/content/taxonomy.ts`) so Browse renders
from it and the content test rejects unknown domain/subject/topic combinations.

### 2.2 Question schema

Every question is a TypeScript object validated by a zod schema. Common fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | `<subject>-<slug>`, unique across the bank |
| `domain`, `subject`, `topic` | string | must exist in the taxonomy |
| `level` | `'junior' \| 'mid' \| 'senior'` | |
| `kind` | see below | discriminant |
| `prompt` | string | Markdown, may include fenced code |
| `tags` | string[] | cross-cutting: `aws`, `performance`, `core-25`, ... |
| `source` | `'epam-pdf' \| 'notion' \| 'topic-list'` | provenance |
| `explanation` | string | Markdown shown after grading, always present |

Kinds are a discriminated union:

| Kind | Extra fields | Graded by |
| --- | --- | --- |
| `single` | `options: {id, text}[]`, `answer: id` | exact match |
| `multi` | `options`, `answer: id[]` | set equality |
| `predict` | `code`, `answer: string`, `language` | whitespace-normalized string compare, line by line |
| `code` | `language`, `starter`, `tests: {name, args, expected}[]`, `solution` | runner executes `solution` export against tests |
| `fix` | same as `code` | same, starter is the broken version |
| `sql` | `schema` (DDL + seed), `answer: string`, `expectedRows`, `ordered?` | sql.js executes, rows compared as sets unless `ordered` |
| `open` | `modelAnswer`, `rubric: string[]` | self-scored: user ticks rubric bullets |

`code` and `fix` tests call the exported `solution` with `args` and compare the return
value with `expected` by deep equality. Tests are "hidden" only in the sense that the UI
shows names, not expected values, until submission.

## 3. Runner

### 3.1 JavaScript/TypeScript

- A dedicated Web Worker receives `{ source, tests }`.
- `sucrase` strips TypeScript syntax (transform `typescript`, no type checking).
- The worker wraps the source in a module-like function, captures `console.log`,
  `console.error`, `console.warn` into a log array, evaluates it, and reads `solution`.
- Each test runs in order; a thrown error records a failed test with the message.
- The main thread starts a 3-second timer and calls `worker.terminate()` on expiry,
  reporting a timeout. A fresh worker is created per run, so a terminated one never
  leaks state.
- The result shape: `{ status: 'ok' | 'error' | 'timeout', logs, tests: {name, passed, actual?, error?}[] }`.

### 3.2 SQL

- `sql.js` (SQLite compiled to WebAssembly) is imported lazily on the first `sql`
  question so it never affects the initial bundle.
- Each run creates a fresh database, executes the question's `schema`, runs the user's
  query, and returns rows and column names.
- Comparison: rows normalized to JSON strings, compared as a multiset; if `ordered`,
  compared as a sequence.

### 3.3 Editor

CodeMirror 6 with the JavaScript/TypeScript and SQL language packages. Monaco is
rejected for bundle size on GitHub Pages.

## 4. Grading seam

```ts
interface Grader {
  grade(question: Question, answer: Answer): Promise<GradeResult>;
}
type GradeResult = {
  score: number;            // 0..1
  verdict: 'pass' | 'fail' | 'self';
  feedback: string[];       // lines rendered under the answer
};
```

- `StaticGrader` implements every kind. For `open` it returns `verdict: 'self'` with
  the rubric, and the UI records the score from the rubric checkboxes.
- `ClaudeGrader` is a documented future implementation: it takes an API key typed into
  Settings, holds it in memory only (never storage), and is selected by a setting. No
  AI code ships in v1, only the interface, the settings toggle (disabled), and a
  README section describing the hand-off.
- The grader is injected through a React context so screens never construct it.

## 5. Navigation and screens

React Router 7, `createBrowserRouter` with `basename: '/engineer-mentat-academy'`.
GitHub Pages serves a copied `404.html` so deep links work.

| Route | Screen |
| --- | --- |
| `/` | Home: progress summary per domain, quick actions (Drill, Mock, Review) |
| `/browse` | Domains grid with counts |
| `/browse/:domain` | Subjects with counts and mastery bar |
| `/browse/:domain/:subject` | Topics and the question list, filterable by level and kind |
| `/drill` | Question stream; query params `domain`, `subject`, `topic`, `level`, `kind`, `unseen` |
| `/mock` | Setup (count, levels, domains, minutes) then timed session, then a results page |
| `/review` | Missed and flagged questions, oldest miss first |
| `/q/:id` | One question, shareable |
| `/settings` | Export/import progress, reset, grader selection (static only in v1) |

Question screen layout: prompt on top, answer area by kind (radio, checkbox, text,
editor), submit, then explanation and feedback. A flag toggle and a notes field sit
under every question. Keyboard: `Enter` submits where unambiguous, `N` next, `F` flag.

Styling: Tailwind, dark theme by default with a light toggle, mobile-safe. No design
system beyond a small set of primitives (Button, Card, Badge, Progress).

## 6. Progress and persistence

- `localStorage` key `ema:progress:v1`, value `{ [questionId]: { attempts, lastScore, lastAt, flagged, notes } }`.
- A store module exposes `get`, `record`, `flag`, `note`, `exportJson`, `importJson`,
  `reset`. Every read and write is wrapped in try/catch; a storage failure degrades to
  in-memory for the session.
- Mastery for a subject is the mean of `lastScore` over attempted questions, shown
  next to the count of unattempted ones.

## 7. Content pipeline

- Files: `src/content/<domain>/<subject>.ts`, each exporting a `questions` array.
  No barrel files; the registry is built with `import.meta.glob('./content/*/*.ts', { eager: true })`.
- `src/content/taxonomy.ts` declares domains, subjects and topics with display names.
- A vitest content test:
  1. validates every question against the zod schema,
  2. checks ids are unique and taxonomy references exist,
  3. executes every `code` and `fix` `solution` against its `tests` under Node,
  4. executes every `sql` `answer` against its `schema` with sql.js and compares to
     `expectedRows`,
  5. asserts every `single`/`multi` answer references existing option ids.
  A failing question fails CI, so the bank can never ship a broken exercise.
- Authoring on 2026-09-24: one subagent per domain receives the schema, the taxonomy,
  the relevant Notion pages, and the classic 25 senior JavaScript questions. Target is
  about 20 questions per subject where the topic list is deep (javascript, typescript,
  react, nodejs, sql, aws) and 8 to 12 elsewhere, roughly 250 total, mixed levels and
  kinds.
- Tier 1: the classic 25 senior JavaScript questions each become a senior `open`
  question plus at least one `predict`, `code` or `fix` companion, tagged `core-25`.
- Every senior question must have a "what a senior says out loud" line in the
  explanation, following the Notion deep-dive style.

## 8. Tooling, standards and deployment

- Vite 7, React 19, TypeScript 5.9 `strict: true`, Tailwind 3, vitest, ESLint 9 flat
  config, Husky. Versions pinned exactly. npm only.
- Jericho standards apply: labeled import groups, explicit return types, no barrel
  files, no commented-out code, `any` only with a justification comment.
- Commits: capitalized infinitive verb, no trailing period, 72-char subject, body
  explains why. Signed with the ed25519 key `365602820FC1B86C` as
  `Jose Rios <josed.riosc@gmail.com>`. Claude co-author trailer allowed in this repo.
- Husky `commit-msg` enforces the verb rule; `pre-commit` runs lint.
- GitHub Actions: on push to `main`, `npm ci`, `npm test`, `npm run build`, deploy
  `dist/` with `actions/deploy-pages`. Vite `base` is `/engineer-mentat-academy/`.
- Public repository `jorius/engineer-mentat-academy`; local checkout at
  `/mnt/media/Sources/GitHub/Personal/engineer-mentat-academy`.
- Branching: feature branches off `main`, merge commits only, never rebase.

## 9. Testing

- Unit: grader (every kind, edge cases such as extra whitespace in `predict`), runner
  protocol (ok, thrown error, timeout, console capture), progress store (round trip,
  corrupt storage), content validator (a fixture with each failure mode).
- Content: the pipeline test in section 7 over the real bank.
- Component: the question screen submit flow for `single` and `code`, using React
  Testing Library.
- Coverage gate: 80 percent on `src/engine/**`; UI is excluded from the gate.

## 10. Delivery order and cut lines

Day 1 (2026-09-23): scaffold, taxonomy, schema, static grader, JS runner, progress
store, Browse, Drill, question screen, deploy workflow, first seed of ~15 questions to
prove the pipeline.

Day 2 (2026-09-24): content generation in parallel, SQL runner, Mock, Review,
Settings, Home summary, polish.

If time runs out, cut in this order: Mock timer, SQL runner, import/export, `/q/:id`.
Never cut: Browse, Drill, Review, the JS runner, the content test.

## 11. Future: AI grading hand-off

`ClaudeGrader` calls the Claude Messages API directly from the browser with the
user's key, sending the question, rubric and answer, and asking for the same
`GradeResult` shape as JSON. It is enabled from Settings only when a key is present
in memory. This needs no build change because the interface already exists.
