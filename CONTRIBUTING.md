# Contributing

Engineer Mentat Academy is a static bank of interview questions plus the app that drills them.
Most contributions are content: a new technology, more questions for one that exists, or a fix to
a question. This page shows how a question is built and what the test suite enforces, so a pull
request passes on the first run.

## Setup

```
git clone git@github.com:jorius/engineer-mentat-academy.git
cd engineer-mentat-academy
npm install          # Node 24, npm only; installs the Husky hooks
npm run dev          # http://localhost:5173/engineer-mentat-academy/
npm test             # runs everything, including the content test
```

## Where things live

| What | Where |
| --- | --- |
| Domains, subjects, topics (English and Spanish names) | `src/content/taxonomy.ts` |
| Glyph per domain and subject | `src/content/glyphs.ts` |
| Questions for a subject | `src/content/<domain>/<subject>.ts` |
| Spanish text for those questions | `src/content/<domain>/<subject>.es.ts` |
| Question schema (what fields each kind has) | `src/engine/question.ts` |
| Content test (the rules below) | `src/content/content.test.ts` |

## Adding a technology

1. Add the subject to its domain in `taxonomy.ts` with an id (kebab-case), a name, a Spanish name
   and two to four topics. Languages are languages, libraries are libraries, frameworks are
   frameworks; Node is a runtime; AWS lives under cloud.
2. Add a glyph in `glyphs.ts` (Simple Icons for brands, a Feather outline otherwise). The test fails
   if a subject has none.
3. Create `src/content/<domain>/<subject>.ts` exporting `questions: Question[]`, and
   `<subject>.es.ts` exporting `translations: Record<string, QuestionTranslation>` keyed by id.
   Copy the shape from a neighbour such as `src/content/frameworks/nestjs.ts`.
4. Run `npx vitest run src/content` until it is green, then the full gate below.

Eight questions per subject is a good first batch: two junior, three mid, three senior, spread
across the topics, with at least one `multi` and two `open`.

## Question kinds

| Kind | Fields | Graded how |
| --- | --- | --- |
| `single` | `options`, `answer` (one option id) | exact |
| `multi` | `options`, `answer` (option ids) | exact set |
| `predict` | `language`, `code`, `answer` (printed output) | the runner executes `code`; the key must equal what it prints |
| `code` / `fix` | `language`, `starter`, `tests` (`{ name, args, expected }`), `solution` | the runner runs the tests against `solution` (must pass) and against `starter` (must not) |
| `sql` | `schema`, `answer` (query), `expectedRows`, `ordered?` | SQLite runs the query; rows must match |
| `open` | `modelAnswer`, `rubric` (2+ checkable claims) | self-scored |

The runner executes JavaScript, TypeScript and SQL only. A subject in another language uses
`single`, `multi` and `open`, with code shown in fenced blocks (`csharp`, `java`, and so on).

## Rules the content test enforces

- Ids are kebab-case and start with the subject id; every domain/subject/topic path exists.
- Every question has a Spanish entry with every prose field translated; code stays untranslated.
- Every question has a `hint` in both languages: one or two sentences (240 characters max) that
  name the concept, API or trap to think about. A hint must not quote an option, a predict output
  line, or the answer's idea. Test yourself: could someone pick the right option from the hint
  alone? Then it leaks.
- Senior explanations contain `**Say this out loud:**` (Spanish `**Dilo en voz alta:**`) followed
  by a one-to-two-sentence spoken answer.
- No prose refers to an option by letter ("option b", "(c)", "**d**"): options are shuffled on
  screen. Name the option by its content instead.
- Option texts and prompts put multi-statement code in fenced blocks with a language tag.
- `single` and `multi` answers reference existing option ids; every executable reference passes.

Two things the test cannot check, so reviewers will: the marked answer is the only correct one,
and the correct option is not the longest one in most single-choice questions.

## Writing style

Prompts are self-contained: anything the answer depends on (runtime version, dev or production
build, StrictMode, flags) is visible in the code or stated. Distractors are plausible and each one
is wrong for a reason the explanation names. Explanations teach the rule, not just the answer.
Spanish is Latin American, tú form, natural rather than literal.

## Commits and pull requests

- Commit subjects start with a capitalized verb from the Husky hook's list (Add, Fix, Update,
  Improve, Remove…) and have no trailing period: `Add Go questions in English and Spanish`.
- Run the gate before pushing: `npm run lint && npm test && npm run build`.
- Open the pull request with the template; it lists the checks above.

## App changes

TypeScript strict, explicit return types, labeled import groups (`// packages`, `// components`,
`// engine`…), no barrel files, no `eslint-disable`, exact dependency pins. New user-facing text
goes through i18next with keys in both `src/i18n/locales/en.json` and `es.json`; a parity test
fails if they differ.
