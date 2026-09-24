# Engineer Mentat Academy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, self-graded interview trainer SPA with in-browser JS/TS and SQL scratchpads, deployable to GitHub Pages, with the engine finished on day 1 so content can be generated in parallel on day 2.

**Architecture:** Vite + React 19 + TypeScript SPA. A pure `engine/` layer (schema, grader, runners, progress, registry) has no React imports and is unit-tested under Node. Questions are typed TS modules loaded with `import.meta.glob`, validated by a content test that also executes every reference solution. UI is React Router 7 pages over small Tailwind primitives.

**Tech Stack:** Vite 7.3.1, React 19.2.4, TypeScript 5.9.3, React Router DOM 7.13.0, Tailwind 3.4.19, zod 4.6.5, sucrase 3.35.1, sql.js 1.14.2, CodeMirror 6, react-markdown 10.1.0, vitest 4.1.11, React Testing Library 16.3.3, ESLint 9.39.2, Husky 9.1.7.

**Spec:** `docs/superpowers/specs/2026-09-23-engineer-mentat-academy-design.md`

## Global Constraints

- Node `24.15.0` (`.nvmrc`), npm only, `save-exact=true`, no `^`/`~` in package.json.
- TypeScript `strict: true`; `any` only with an inline justification comment; explicit return types on every function; `const`/`let` only.
- Import groups labeled with comments (`// packages`, `// engine`, `// components`, `// hooks`, `// pages`, `// content`, `// utils`), packages first.
- No barrel files (`index.ts` re-exports). No commented-out code.
- Commit subjects: capitalized infinitive verb from the Husky list, no trailing period, 72 chars max, body explains why. Every commit ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Commits are GPG-signed automatically by local git config.
- **Do not `git push`.** Jose pushes after testing (his explicit rule).
- Vite `base` is `/engineer-mentat-academy/`; router `basename` comes from `import.meta.env.BASE_URL`.
- localStorage key `ema:progress:v1`; theme key `ema:theme`. Every storage access wrapped in try/catch.
- Coverage gate 80% on `src/engine/**` only.
- All work happens in `/mnt/media/Sources/GitHub/Personal/engineer-mentat-academy` on branch `main` (single-developer, two-day project; no feature branches needed until after Friday).

## File Structure

```
package.json .nvmrc .npmrc .gitignore .editorconfig index.html
tsconfig.json tsconfig.app.json tsconfig.node.json
vite.config.ts vitest.setup.ts tailwind.config.js postcss.config.js eslint.config.js
.husky/pre-commit .husky/commit-msg
.github/workflows/deploy.yml
README.md
src/main.tsx                      # mounts <App/>
src/App.tsx                       # router definition
src/index.css                     # tailwind layers + markdown/code styles
src/engine/question.ts            # zod schemas + Question/Answer types + KINDS/LEVELS
src/engine/deepEqual.ts           # structural equality for test outcomes
src/engine/grader.ts              # Grader interface, GradeResult
src/engine/staticGrader.ts        # StaticGrader (all kinds), takes runners by injection
src/engine/runner/execute.ts      # pure: sucrase transform + run tests (Node + worker)
src/engine/runner/worker.ts       # Web Worker entry
src/engine/runner/runJs.ts        # main-thread client with 3s timeout
src/engine/sql/runSql.ts          # createSqlRunner(loader)
src/engine/sql/browserLoader.ts   # lazy sql.js + wasm url for Vite
src/engine/progress.ts            # createProgressStore(storage)
src/engine/registry.ts            # loadQuestions (glob), indexById, filterQuestions, summarize
src/engine/session.ts             # shuffle, pickMock
src/content/taxonomy.ts           # DOMAINS data
src/content/<domain>/<subject>.ts # questions
src/content/content.test.ts       # bank validation + solution execution
src/contexts/GraderContext.tsx    # provides Grader
src/contexts/ThemeContext.tsx     # dark/light
src/hooks/useProgress.ts          # useSyncExternalStore over the store
src/hooks/useQuestionBank.ts      # memoized registry
src/components/primitives/{Button,Card,Badge,ProgressBar}.tsx
src/components/common/{Layout,Markdown,CodeEditor}.tsx
src/components/question/{SingleChoice,MultiChoice,PredictOutput,CodeExercise,SqlExercise,OpenAnswer,QuestionView,Feedback}.tsx
src/pages/{Home,Browse,BrowseDomain,BrowseSubject,Drill,Mock,Review,QuestionPage,Settings}.tsx
```

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `.nvmrc`, `.npmrc`, `.gitignore`, `.editorconfig`, `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.setup.ts`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `.husky/pre-commit`, `.husky/commit-msg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev|build|lint|test|test:coverage|preview` scripts; `@/` alias is NOT used (relative imports only, keeps fold-in trivial).

- [ ] **Step 1: Write package.json**

```json
{
  "name": "engineer-mentat-academy",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": "24.15.0" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && cp dist/index.html dist/404.html",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky"
  },
  "dependencies": {
    "@codemirror/lang-javascript": "6.2.5",
    "@codemirror/lang-sql": "6.10.0",
    "@codemirror/state": "6.7.6",
    "@codemirror/theme-one-dark": "6.1.3",
    "@codemirror/view": "6.43.13",
    "codemirror": "6.0.2",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-markdown": "10.1.0",
    "react-router-dom": "7.13.0",
    "remark-gfm": "4.0.1",
    "sql.js": "1.14.2",
    "sucrase": "3.35.1",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@eslint/js": "9.39.2",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.7",
    "@types/node": "24.10.9",
    "@types/react": "19.2.10",
    "@types/react-dom": "19.2.3",
    "@types/sql.js": "1.4.11",
    "@vitejs/plugin-react": "5.1.2",
    "@vitest/coverage-v8": "4.1.11",
    "autoprefixer": "10.4.23",
    "eslint": "9.39.2",
    "eslint-plugin-react-hooks": "7.0.1",
    "eslint-plugin-react-refresh": "0.4.26",
    "globals": "16.5.0",
    "husky": "9.1.7",
    "jsdom": "30.1.1",
    "postcss": "8.5.6",
    "tailwindcss": "3.4.19",
    "typescript": "5.9.3",
    "typescript-eslint": "8.54.0",
    "vite": "7.3.1",
    "vitest": "4.1.11"
  }
}
```

- [ ] **Step 2: Write the dotfiles**

`.nvmrc`:
```
24.15.0
```

`.npmrc`:
```
save-exact=true
engine-strict=true
```

`.gitignore`:
```
logs
*.log
npm-debug.log*
node_modules
dist
dist-ssr
*.local
.env
.env.local
.idea
.DS_Store
*.sw?
coverage
```

`.editorconfig`:
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 3: Write the TypeScript configs**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src", "vitest.setup.ts"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Write Vite, Vitest, Tailwind, PostCSS and ESLint configs**

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
// packages
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/engineer-mentat-academy/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['sql.js'],
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      exclude: ['src/engine/runner/worker.ts', 'src/engine/sql/browserLoader.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
```

`vitest.setup.ts`:
```ts
// packages
import '@testing-library/jest-dom/vitest';
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        spice: {
          50: '#fff7ed',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
    },
  },
  plugins: [],
};
```

`postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`eslint.config.js`:
```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      'no-var': 'error',
    },
  },
]);
```

- [ ] **Step 5: Write the Husky hooks**

`.husky/pre-commit`:
```sh
#!/usr/bin/env sh

npm run lint
```

`.husky/commit-msg`:
```sh
#!/usr/bin/env sh

COMMIT_MSG=$(head -n1 "$1")

VERB_PATTERN="^(Add|Fix|Update|Create|Remove|Delete|Improve|Refactor|Move|Rename|Revert|Merge|Configure|Enable|Disable|Extract|Simplify|Optimize|Implement|Integrate|Replace|Resolve|Validate|Document|Init|Apply|Enforce|Extend|Handle|Introduce|Prepare|Release|Run|Skip|Split|Support|Use|Verify|Set|Clean|Correct|Lock|Reduce|Test|Seed|Wire) .+"

if ! echo "$COMMIT_MSG" | grep -qE "$VERB_PATTERN"; then
  echo ""
  echo "  Invalid commit subject: \"$COMMIT_MSG\""
  echo "  Format : <Verb> <description>   e.g. Add the static grader"
  echo "  Subjects must start with a capitalized infinitive verb."
  echo ""
  exit 1
fi
```

Make both executable: `chmod +x .husky/pre-commit .husky/commit-msg`.

- [ ] **Step 6: Write index.html, main.tsx, App.tsx, index.css**

`index.html`:
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/engineer-mentat-academy/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Interactive technical interview trainer with junior, mid and senior questions and in-browser scratchpads." />
    <title>Engineer Mentat Academy</title>
  </head>
  <body class="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#18181b"/><path d="M8 22V10l8 7 8-7v12" fill="none" stroke="#f97316" stroke-width="3" stroke-linejoin="round"/></svg>
```

`src/main.tsx`:
```tsx
// packages
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// components
import { App } from './App';

// styles
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root not found');
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (placeholder, replaced in Task 8):
```tsx
// packages
import type { JSX } from 'react';

export function App(): JSX.Element {
  return <h1 className="p-6 text-2xl font-semibold">Engineer Mentat Academy</h1>;
}
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.md :is(h1, h2, h3) { @apply mt-4 mb-2 font-semibold; }
.md h1 { @apply text-xl; }
.md h2 { @apply text-lg; }
.md p { @apply my-2 leading-relaxed; }
.md ul { @apply my-2 list-disc pl-6; }
.md ol { @apply my-2 list-decimal pl-6; }
.md li { @apply my-1; }
.md code { @apply rounded bg-zinc-200 px-1 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800; }
.md pre { @apply my-3 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100; }
.md pre code { @apply bg-transparent p-0; }
.md table { @apply my-3 w-full border-collapse text-sm; }
.md th, .md td { @apply border border-zinc-300 px-2 py-1 text-left dark:border-zinc-700; }
.md blockquote { @apply my-2 border-l-4 border-spice-500 pl-3 italic; }

.cm-editor { @apply rounded-lg border border-zinc-300 text-sm dark:border-zinc-700; }
.cm-editor.cm-focused { @apply outline-none ring-2 ring-spice-500; }
```

- [ ] **Step 7: Write the smoke test**

`src/App.test.tsx`:
```tsx
// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// components
import { App } from './App';

describe('App', () => {
  it('renders the academy title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /engineer mentat academy/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Install and verify**

Run: `npm install` then `npm run lint && npm test && npm run build`
Expected: install completes with no lockfile warnings, lint clean, 1 test passing, `dist/404.html` exists.
If `husky` prints "git command not found" during install, ignore; if `.husky/_` was not created, run `npx husky`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add the Vite React TypeScript scaffold

Mirrors the toolchain already proven on jorius.github.io so the app can
be folded into the site later without a config migration.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Taxonomy and question schema

**Files:**
- Create: `src/content/taxonomy.ts`, `src/engine/question.ts`, `src/engine/question.test.ts`

**Interfaces:**
- Produces: `DOMAINS: Domain[]`, `findSubject(domain, subject)`, `LEVELS`, `KINDS`, `questionSchema`, types `Question`, `Level`, `Kind`, `Answer`, `TestCase`, `Option`, and the per-kind types `SingleQuestion`, `MultiQuestion`, `PredictQuestion`, `CodeQuestion`, `FixQuestion`, `SqlQuestion`, `OpenQuestion`.

- [ ] **Step 1: Write the failing schema test**

`src/engine/question.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { questionSchema } from './question';

const base = {
  id: 'javascript-closure-counter',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'mid',
  prompt: 'What does the counter return?',
  tags: ['closures'],
  source: 'notion',
  explanation: 'The inner function keeps a reference to `counter`.',
} as const;

describe('questionSchema', () => {
  it('accepts a single-choice question', () => {
    const result = questionSchema.safeParse({
      ...base,
      kind: 'single',
      options: [
        { id: 'a', text: '1 then 2' },
        { id: 'b', text: '1 then 1' },
      ],
      answer: 'a',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a code question with tests', () => {
    const result = questionSchema.safeParse({
      ...base,
      kind: 'code',
      language: 'typescript',
      starter: 'export function solution(a: number, b: number): number {\n  return 0;\n}',
      tests: [{ name: 'adds', args: [2, 3], expected: 5 }],
      solution: 'export function solution(a: number, b: number): number {\n  return a + b;\n}',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const result = questionSchema.safeParse({ ...base, kind: 'essay' });
    expect(result.success).toBe(false);
  });

  it('rejects an id with uppercase or spaces', () => {
    const result = questionSchema.safeParse({
      ...base,
      id: 'Bad Id',
      kind: 'open',
      modelAnswer: 'x',
      rubric: ['a', 'b'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an open question with fewer than two rubric items', () => {
    const result = questionSchema.safeParse({
      ...base,
      kind: 'open',
      modelAnswer: 'x',
      rubric: ['only one'],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/question.test.ts`
Expected: FAIL, cannot resolve `./question`.

- [ ] **Step 3: Write the taxonomy**

`src/content/taxonomy.ts`:
```ts
export type Topic = { id: string; name: string };
export type Subject = { id: string; name: string; topics: Topic[] };
export type Domain = { id: string; name: string; blurb: string; subjects: Subject[] };

function t(id: string, name: string): Topic {
  return { id, name };
}

export const DOMAINS: Domain[] = [
  {
    id: 'languages',
    name: 'Languages',
    blurb: 'JavaScript and TypeScript, the runtime model and the type system.',
    subjects: [
      {
        id: 'javascript',
        name: 'JavaScript',
        topics: [
          t('fundamentals', 'Fundamentals'),
          t('event-loop', 'Event loop, call stack, microtasks and macrotasks'),
          t('closures', 'Closures'),
          t('references-and-copies', 'Object references, mutation, shallow vs deep copy, structuredClone'),
          t('array-methods', 'Array methods: map, filter, some, every'),
          t('this-binding', 'this, bind, call, apply'),
          t('async', 'Promises and async/await'),
          t('coercion-and-equality', 'Type coercion, == vs ==='),
          t('hoisting-and-scope', 'Hoisting, TDZ, var/let/const'),
          t('prototypes', 'Prototypes and inheritance'),
          t('functional', 'Pure functions, higher-order functions, immutability, memoization'),
          t('es-features', 'Destructuring, spread, Set/Map, arrow functions, strict mode, classes'),
          t('event-delegation', 'DOM events and delegation'),
        ],
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        topics: [
          t('basics', 'Basics and inference'),
          t('generics', 'Generics and constraints'),
          t('aliases-vs-interfaces', 'Type aliases vs interfaces'),
          t('enums', 'Enums and literal types'),
          t('unions-and-narrowing', 'Union types and type narrowing'),
          t('optional-fields', 'Optional fields and strictness'),
          t('utility-types', 'Utility and mapped types'),
          t('boundaries', 'Typing boundaries and runtime validation'),
        ],
      },
    ],
  },
  {
    id: 'libraries',
    name: 'Libraries',
    blurb: 'React and the libraries that usually ship next to it.',
    subjects: [
      {
        id: 'react',
        name: 'React',
        topics: [
          t('components-and-lifecycle', 'Class vs functional components and lifecycle'),
          t('hooks', 'useState, useEffect, useCallback, useMemo, useContext, useReducer'),
          t('dependency-arrays', 'Dependency arrays'),
          t('re-rendering', 'Re-rendering behavior'),
          t('props-and-state', 'Props and state management'),
          t('forms', 'Forms'),
          t('performance', 'Frontend performance optimization'),
        ],
      },
      { id: 'redux', name: 'Redux', topics: [t('core', 'Redux core'), t('redux-toolkit', 'Redux Toolkit')] },
      { id: 'react-router', name: 'React Router', topics: [t('routing', 'Routing, loaders and navigation')] },
      { id: 'react-testing-library', name: 'React Testing Library', topics: [t('rtl', 'Queries, user events and async assertions')] },
      { id: 'typeorm', name: 'TypeORM', topics: [t('orm-usage', 'Entities, relations and queries'), t('n-plus-one', 'The N+1 problem')] },
      { id: 'prisma', name: 'Prisma', topics: [t('orm-usage', 'Schema, client and migrations'), t('n-plus-one', 'The N+1 problem')] },
    ],
  },
  {
    id: 'frameworks',
    name: 'Frameworks',
    blurb: 'Opinionated application frameworks on top of Node and React.',
    subjects: [
      { id: 'express', name: 'Express', topics: [t('middleware', 'Middleware'), t('routing', 'Routing'), t('error-handling', 'Error handling')] },
      { id: 'nestjs', name: 'NestJS', topics: [t('modules', 'Modules and providers'), t('pipes-and-guards', 'Pipes, guards and interceptors')] },
      { id: 'nextjs', name: 'Next.js', topics: [t('app-router', 'App Router'), t('rendering-modes', 'SSR, SSG, ISR and client components')] },
    ],
  },
  {
    id: 'runtimes',
    name: 'Runtimes',
    blurb: 'Node.js as an ecosystem: daemon, API, serverless function, script.',
    subjects: [
      {
        id: 'nodejs',
        name: 'Node.js',
        topics: [
          t('fundamentals', 'Fundamentals'),
          t('event-loop-phases', 'Event loop phases'),
          t('streams-and-large-files', 'Streams, backpressure and large files'),
          t('worker-threads-and-cpu-work', 'Worker threads, CPU-intensive work, avoiding blocking'),
          t('execution-models', 'Daemon, serverless, API and scripting'),
          t('request-batching', 'Request batching'),
        ],
      },
    ],
  },
  {
    id: 'apis',
    name: 'APIs',
    blurb: 'Designing, exposing and protecting HTTP APIs.',
    subjects: [
      { id: 'rest', name: 'REST', topics: [t('http-methods', 'HTTP methods'), t('status-codes', 'Status codes'), t('idempotency', 'Safe and idempotent methods')] },
      { id: 'graphql', name: 'GraphQL', topics: [t('schema-and-resolvers', 'Schema and resolvers'), t('graphql-vs-rest', 'GraphQL vs REST')] },
      { id: 'api-design', name: 'API design', topics: [t('pagination', 'Pagination'), t('versioning', 'Versioning'), t('response-shape', 'Response shape and errors')] },
      { id: 'api-security', name: 'API security', topics: [t('authn-vs-authz', 'Authentication vs authorization'), t('rate-limiting', 'Rate limiting'), t('common-practices', 'Common API security practices')] },
    ],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    blurb: 'Patterns, principles and distributed-system trade-offs.',
    subjects: [
      { id: 'design-patterns', name: 'Design patterns', topics: [t('creational', 'Creational'), t('structural', 'Structural'), t('behavioral', 'Behavioral')] },
      { id: 'solid', name: 'SOLID', topics: [t('srp', 'Single responsibility'), t('ocp', 'Open-closed'), t('lsp', 'Liskov substitution'), t('isp', 'Interface segregation'), t('dip', 'Dependency inversion')] },
      { id: 'clean-code', name: 'Clean code', topics: [t('naming', 'Naming'), t('functions', 'Functions and structure')] },
      { id: 'architecture-patterns', name: 'Architecture patterns', topics: [t('layered-and-hexagonal', 'Layered and hexagonal'), t('bff', 'Backend-for-frontend'), t('event-driven', 'Event-driven')] },
      { id: 'distributed-systems', name: 'Distributed systems', topics: [t('microservices', 'Microservices'), t('kafka', 'Kafka'), t('dead-letter-queues', 'Dead letter queues'), t('idempotency', 'Idempotency'), t('retries', 'Message retries'), t('correlation-ids-and-tracing', 'Correlation IDs and tracing')] },
    ],
  },
  {
    id: 'databases',
    name: 'Databases',
    blurb: 'SQL, NoSQL and the managed engines you meet on AWS.',
    subjects: [
      { id: 'sql', name: 'SQL', topics: [t('fundamentals', 'Fundamentals'), t('aggregation', 'Aggregation'), t('joins', 'Joins'), t('group-by', 'Group by'), t('indexing', 'Indexing'), t('query-optimization', 'Query optimization')] },
      { id: 'nosql', name: 'NoSQL', topics: [t('use-cases', 'Use cases'), t('sql-vs-nosql', 'SQL vs NoSQL')] },
      { id: 'dynamodb', name: 'DynamoDB', topics: [t('keys-and-access-patterns', 'Keys and access patterns')] },
      { id: 'rds', name: 'RDS', topics: [t('engines-and-operations', 'Engines and operations')] },
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    blurb: 'AWS services, containers, infrastructure as code and delivery.',
    subjects: [
      { id: 'aws', name: 'AWS', topics: [t('lambda', 'Lambda'), t('api-gateway', 'API Gateway'), t('s3', 'S3 and static hosting'), t('s3-event-notifications', 'S3 event notifications'), t('sns', 'SNS'), t('s3-to-sns', 'Connecting S3 events to SNS'), t('ecs', 'ECS'), t('fargate', 'Fargate'), t('cognito', 'Cognito')] },
      { id: 'containers', name: 'Containers', topics: [t('docker-basics', 'Docker basics'), t('containerization', 'Containerization')] },
      { id: 'iac', name: 'Infrastructure as code', topics: [t('iaas-vs-iac', 'IaaS vs IaC'), t('terraform', 'Terraform'), t('cloudformation', 'CloudFormation')] },
      { id: 'serverless', name: 'Serverless', topics: [t('serverless-architecture', 'Serverless architecture')] },
      { id: 'cicd', name: 'CI/CD', topics: [t('pipelines', 'Pipelines and basics')] },
    ],
  },
  {
    id: 'practices',
    name: 'Practices',
    blurb: 'Testing, security, operations and working with AI tools.',
    subjects: [
      { id: 'testing', name: 'Testing', topics: [t('strategies', 'Strategies'), t('unit', 'Unit'), t('integration', 'Integration'), t('frontend', 'Frontend'), t('backend', 'Backend')] },
      { id: 'security', name: 'Security', topics: [t('web-security-basics', 'Web security basics'), t('xss', 'XSS'), t('csrf', 'CSRF')] },
      { id: 'operations', name: 'Operations', topics: [t('production-debugging', 'Production debugging'), t('logging-and-monitoring', 'Logging and monitoring'), t('performance-optimization', 'Performance optimization')] },
      { id: 'ai-assisted-development', name: 'AI-assisted development', topics: [t('tooling', 'Tooling and workflow')] },
    ],
  },
];

export function findDomain(domainId: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === domainId);
}

export function findSubject(domainId: string, subjectId: string): Subject | undefined {
  return findDomain(domainId)?.subjects.find((s) => s.id === subjectId);
}

export function findTopic(domainId: string, subjectId: string, topicId: string): Topic | undefined {
  return findSubject(domainId, subjectId)?.topics.find((tp) => tp.id === topicId);
}
```

- [ ] **Step 4: Write the schema**

`src/engine/question.ts`:
```ts
// packages
import { z } from 'zod';

export const LEVELS = ['junior', 'mid', 'senior'] as const;
export type Level = (typeof LEVELS)[number];

export const KINDS = ['single', 'multi', 'predict', 'code', 'fix', 'sql', 'open'] as const;
export type Kind = (typeof KINDS)[number];

export const SOURCES = ['core-list', 'notion', 'topic-list'] as const;
export type Source = (typeof SOURCES)[number];

export const CODE_LANGUAGES = ['javascript', 'typescript'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const baseSchema = z.object({
  id: z.string().regex(idPattern, 'id must be kebab-case'),
  domain: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  level: z.enum(LEVELS),
  prompt: z.string().min(1),
  tags: z.array(z.string()),
  source: z.enum(SOURCES),
  explanation: z.string().min(1),
});

export const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
export type Option = z.infer<typeof optionSchema>;

export const testCaseSchema = z.object({
  name: z.string().min(1),
  args: z.array(z.unknown()),
  expected: z.unknown(),
});
export type TestCase = z.infer<typeof testCaseSchema>;

const codeFields = {
  language: z.enum(CODE_LANGUAGES),
  starter: z.string(),
  tests: z.array(testCaseSchema).min(1),
  solution: z.string().min(1),
};

export const singleSchema = baseSchema.extend({
  kind: z.literal('single'),
  options: z.array(optionSchema).min(2),
  answer: z.string().min(1),
});
export const multiSchema = baseSchema.extend({
  kind: z.literal('multi'),
  options: z.array(optionSchema).min(2),
  answer: z.array(z.string().min(1)).min(1),
});
export const predictSchema = baseSchema.extend({
  kind: z.literal('predict'),
  language: z.enum(CODE_LANGUAGES),
  code: z.string().min(1),
  answer: z.string().min(1),
});
export const codeSchema = baseSchema.extend({ kind: z.literal('code'), ...codeFields });
export const fixSchema = baseSchema.extend({ kind: z.literal('fix'), ...codeFields });
export const sqlSchema = baseSchema.extend({
  kind: z.literal('sql'),
  schema: z.string().min(1),
  answer: z.string().min(1),
  expectedRows: z.array(z.array(z.unknown())),
  ordered: z.boolean().optional(),
});
export const openSchema = baseSchema.extend({
  kind: z.literal('open'),
  modelAnswer: z.string().min(1),
  rubric: z.array(z.string().min(1)).min(2),
});

export const questionSchema = z.discriminatedUnion('kind', [
  singleSchema,
  multiSchema,
  predictSchema,
  codeSchema,
  fixSchema,
  sqlSchema,
  openSchema,
]);

export type SingleQuestion = z.infer<typeof singleSchema>;
export type MultiQuestion = z.infer<typeof multiSchema>;
export type PredictQuestion = z.infer<typeof predictSchema>;
export type CodeQuestion = z.infer<typeof codeSchema>;
export type FixQuestion = z.infer<typeof fixSchema>;
export type SqlQuestion = z.infer<typeof sqlSchema>;
export type OpenQuestion = z.infer<typeof openSchema>;
export type Question = z.infer<typeof questionSchema>;

export type Answer =
  | { kind: 'single'; optionId: string }
  | { kind: 'multi'; optionIds: string[] }
  | { kind: 'predict'; text: string }
  | { kind: 'code'; source: string }
  | { kind: 'sql'; query: string }
  | { kind: 'open'; checked: boolean[] };
```

Note: `fix` questions are answered with `{ kind: 'code', source }` because the answer shape is identical.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/engine/question.test.ts`
Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
git add src/content/taxonomy.ts src/engine/question.ts src/engine/question.test.ts
git commit -m "Add the taxonomy and the question schema

Domains are keyed on what a subject is (language, library, framework,
runtime, API, architecture, database, cloud, practice) so the bank stays
navigable as it grows. zod validates every question at test time.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Deep equality and the progress store

**Files:**
- Create: `src/engine/deepEqual.ts`, `src/engine/deepEqual.test.ts`, `src/engine/progress.ts`, `src/engine/progress.test.ts`

**Interfaces:**
- Produces: `deepEqual(a: unknown, b: unknown): boolean`; `createProgressStore(storage: Storage | null): ProgressStore`; types `QuestionProgress`, `ProgressMap`, `ProgressStore`; constant `STORAGE_KEY = 'ema:progress:v1'`.

- [ ] **Step 1: Write the failing deepEqual test**

`src/engine/deepEqual.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
  it('compares primitives strictly', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('compares arrays by element and length', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('compares objects by keys regardless of order', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });

  it('treats arrays and objects as different', () => {
    expect(deepEqual([], {})).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/engine/deepEqual.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement deepEqual**

`src/engine/deepEqual.ts`:
```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (isRecord(a) && isRecord(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
  }
  return false;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/engine/deepEqual.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Write the failing progress store test**

`src/engine/progress.test.ts`:
```ts
// packages
import { beforeEach, describe, expect, it, vi } from 'vitest';

// engine
import { STORAGE_KEY, createProgressStore } from './progress';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    clear: (): void => map.clear(),
    getItem: (key: string): string | null => map.get(key) ?? null,
    key: (index: number): string | null => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string): void => {
      map.delete(key);
    },
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
  };
}

describe('createProgressStore', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T12:00:00Z'));
  });

  it('records an attempt and persists it', () => {
    const store = createProgressStore(storage);
    store.record('q1', 1);
    store.record('q1', 0.5);
    expect(store.get('q1')).toEqual({
      attempts: 2,
      lastScore: 0.5,
      lastAt: '2026-09-23T12:00:00.000Z',
      flagged: false,
      notes: '',
    });
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toHaveProperty('q1');
  });

  it('flags and notes without an attempt', () => {
    const store = createProgressStore(storage);
    store.setFlag('q2', true);
    store.setNotes('q2', 'review this');
    expect(store.get('q2')).toMatchObject({ attempts: 0, flagged: true, notes: 'review this' });
  });

  it('round-trips through export and import', () => {
    const store = createProgressStore(storage);
    store.record('q1', 1);
    const json = store.exportJson();
    const fresh = createProgressStore(memoryStorage());
    fresh.importJson(json);
    expect(fresh.get('q1')?.lastScore).toBe(1);
  });

  it('rejects an import that is not a progress map', () => {
    const store = createProgressStore(storage);
    expect(() => store.importJson('[1,2]')).toThrow(/progress/i);
    expect(() => store.importJson('{"q": {"attempts": "no"}}')).toThrow(/progress/i);
  });

  it('survives corrupt storage and a null storage', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    const store = createProgressStore(storage);
    expect(store.all()).toEqual({});
    const memoryOnly = createProgressStore(null);
    memoryOnly.record('q1', 1);
    expect(memoryOnly.get('q1')?.attempts).toBe(1);
  });

  it('notifies subscribers once per change and stops after unsubscribe', () => {
    const store = createProgressStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.record('q1', 1);
    unsubscribe();
    store.record('q1', 1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reset clears everything', () => {
    const store = createProgressStore(storage);
    store.record('q1', 1);
    store.reset();
    expect(store.all()).toEqual({});
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/engine/progress.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 7: Implement the progress store**

`src/engine/progress.ts`:
```ts
export const STORAGE_KEY = 'ema:progress:v1';

export type QuestionProgress = {
  attempts: number;
  lastScore: number;
  lastAt: string;
  flagged: boolean;
  notes: string;
};

export type ProgressMap = Record<string, QuestionProgress>;

export interface ProgressStore {
  get(id: string): QuestionProgress | undefined;
  all(): ProgressMap;
  record(id: string, score: number): void;
  setFlag(id: string, flagged: boolean): void;
  setNotes(id: string, notes: string): void;
  exportJson(): string;
  importJson(json: string): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}

const EMPTY: QuestionProgress = { attempts: 0, lastScore: 0, lastAt: '', flagged: false, notes: '' };

function isProgress(value: unknown): value is QuestionProgress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.attempts === 'number' &&
    typeof v.lastScore === 'number' &&
    typeof v.lastAt === 'string' &&
    typeof v.flagged === 'boolean' &&
    typeof v.notes === 'string'
  );
}

function parseMap(json: string): ProgressMap {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Not a progress map');
  }
  const map: ProgressMap = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (!isProgress(value)) {
      throw new Error(`Invalid progress entry for ${id}`);
    }
    map[id] = value;
  }
  return map;
}

function load(storage: Storage | null): ProgressMap {
  if (storage === null) {
    return {};
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? {} : parseMap(raw);
  } catch {
    return {};
  }
}

export function createProgressStore(storage: Storage | null): ProgressStore {
  let map: ProgressMap = load(storage);
  const listeners = new Set<() => void>();

  function persist(): void {
    if (storage !== null) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(map));
      } catch {
        // storage full or blocked: keep the in-memory copy for this session
      }
    }
    listeners.forEach((fn) => fn());
  }

  function update(id: string, patch: Partial<QuestionProgress>): void {
    map = { ...map, [id]: { ...(map[id] ?? EMPTY), ...patch } };
    persist();
  }

  return {
    get: (id: string): QuestionProgress | undefined => map[id],
    all: (): ProgressMap => map,
    record: (id: string, score: number): void => {
      const current = map[id] ?? EMPTY;
      update(id, { attempts: current.attempts + 1, lastScore: score, lastAt: new Date().toISOString() });
    },
    setFlag: (id: string, flagged: boolean): void => update(id, { flagged }),
    setNotes: (id: string, notes: string): void => update(id, { notes }),
    exportJson: (): string => JSON.stringify(map, null, 2),
    importJson: (json: string): void => {
      map = parseMap(json);
      persist();
    },
    reset: (): void => {
      map = {};
      if (storage !== null) {
        try {
          storage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      listeners.forEach((fn) => fn());
    },
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
  };
}
```

- [ ] **Step 8: Run the tests**

Run: `npx vitest run src/engine`
Expected: all passing (question 5, deepEqual 4, progress 7).

- [ ] **Step 9: Commit**

```bash
git add src/engine/deepEqual.ts src/engine/deepEqual.test.ts src/engine/progress.ts src/engine/progress.test.ts
git commit -m "Add deep equality and the local progress store

Progress lives only in localStorage with an in-memory fallback, so the
app has no backend and a blocked storage never breaks a session.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: JavaScript execution core, worker and client

**Files:**
- Create: `src/engine/runner/execute.ts`, `src/engine/runner/execute.test.ts`, `src/engine/runner/worker.ts`, `src/engine/runner/runJs.ts`, `src/engine/runner/runJs.test.ts`

**Interfaces:**
- Consumes: `TestCase`, `CodeLanguage` from `src/engine/question.ts`; `deepEqual`.
- Produces: `executeSource(source, tests, language): Promise<RunResult>`; `runJs(request: RunRequest): Promise<RunResult>` (browser, worker + timeout); types `RunRequest`, `RunResult`, `TestOutcome`; constant `RUN_TIMEOUT_MS = 3000`.

- [ ] **Step 1: Write the failing execute test**

`src/engine/runner/execute.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { executeSource } from './execute';

describe('executeSource', () => {
  it('runs a TypeScript solution against tests', async () => {
    const result = await executeSource(
      'export function solution(a: number, b: number): number { return a + b; }',
      [
        { name: 'adds', args: [2, 3], expected: 5 },
        { name: 'wrong', args: [2, 2], expected: 5 },
      ],
      'typescript',
    );
    expect(result.status).toBe('ok');
    expect(result.tests).toEqual([
      { name: 'adds', passed: true, actual: 5 },
      { name: 'wrong', passed: false, actual: 4 },
    ]);
  });

  it('captures console output in order', async () => {
    const result = await executeSource(
      'console.log("a", 1); console.warn({ x: [1] }); export function solution() { return 0; }',
      [{ name: 'zero', args: [], expected: 0 }],
      'javascript',
    );
    expect(result.logs).toEqual(['a 1', '{"x":[1]}']);
  });

  it('captures setTimeout output when asked to settle', async () => {
    const result = await executeSource(
      'setTimeout(() => console.log("late"), 0); console.log("early"); export function solution() { return 0; }',
      [],
      'javascript',
      50,
    );
    expect(result.logs).toEqual(['early', 'late']);
    const unsettled = await executeSource('setTimeout(() => console.log("late"), 0); export function solution() { return 0; }', [], 'javascript');
    expect(unsettled.logs).toEqual([]);
  });

  it('awaits an async solution', async () => {
    const result = await executeSource(
      'export async function solution(x) { return x * 2; }',
      [{ name: 'doubles', args: [4], expected: 8 }],
      'javascript',
    );
    expect(result.tests[0]?.passed).toBe(true);
  });

  it('reports a missing solution export', async () => {
    const result = await executeSource('const x = 1;', [{ name: 't', args: [], expected: 1 }], 'javascript');
    expect(result.status).toBe('error');
    expect(result.error).toMatch(/solution/);
  });

  it('reports a syntax error without throwing', async () => {
    const result = await executeSource('export function solution( {', [], 'javascript');
    expect(result.status).toBe('error');
    expect(result.error).toBeTruthy();
  });

  it('records a thrown error per test and keeps going', async () => {
    const result = await executeSource(
      'export function solution(x) { if (x < 0) throw new RangeError("neg"); return x; }',
      [
        { name: 'neg', args: [-1], expected: -1 },
        { name: 'pos', args: [1], expected: 1 },
      ],
      'javascript',
    );
    expect(result.tests[0]).toEqual({ name: 'neg', passed: false, error: 'RangeError: neg' });
    expect(result.tests[1]?.passed).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/engine/runner/execute.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement executeSource**

`src/engine/runner/execute.ts`:
```ts
// packages
import { transform } from 'sucrase';

// engine
import { deepEqual } from '../deepEqual';
import type { CodeLanguage, TestCase } from '../question';

export type TestOutcome = { name: string; passed: boolean; actual?: unknown; error?: string };

export type RunResult = {
  status: 'ok' | 'error' | 'timeout';
  logs: string[];
  tests: TestOutcome[];
  error?: string;
};

export type RunRequest = { source: string; tests: TestCase[]; language: CodeLanguage; settleMs?: number };

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

type Exports = Record<string, unknown>;

function compile(source: string, language: CodeLanguage): string {
  const transforms = language === 'typescript' ? (['typescript', 'imports'] as const) : (['imports'] as const);
  return transform(source, { transforms: [...transforms] }).code;
}

export async function executeSource(source: string, tests: TestCase[], language: CodeLanguage, settleMs = 0): Promise<RunResult> {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
    warn: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
    error: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
    info: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
  };

  let exportsObject: Exports = {};
  try {
    const code = compile(source, language);
    const module = { exports: exportsObject };
    // The runner intentionally evaluates user code; it runs inside a Web Worker in the browser.
    const factory = new Function('exports', 'module', 'console', 'require', code);
    const require = (name: string): never => {
      throw new Error(`Imports are not available in the scratchpad (tried "${name}")`);
    };
    factory(exportsObject, module, fakeConsole, require);
    exportsObject = module.exports;
  } catch (error) {
    return { status: 'error', logs, tests: [], error: describeError(error) };
  }

  const solution = exportsObject.solution;
  if (typeof solution !== 'function') {
    return { status: 'error', logs, tests: [], error: 'Export a function named "solution"' };
  }

  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    try {
      const actual: unknown = await solution(...test.args);
      outcomes.push({ name: test.name, passed: deepEqual(actual, test.expected), actual });
    } catch (error) {
      outcomes.push({ name: test.name, passed: false, error: describeError(error) });
    }
  }
  if (settleMs > 0) {
    // Let queued macrotasks (setTimeout 0) run so their console output is captured.
    await new Promise<void>((resolve) => setTimeout(resolve, settleMs));
  }
  return { status: 'ok', logs, tests: outcomes };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/engine/runner/execute.test.ts`
Expected: 7 passing.

- [ ] **Step 5: Write the worker entry**

`src/engine/runner/worker.ts`:
```ts
// engine
import { executeSource } from './execute';
import type { RunRequest, RunResult } from './execute';

self.onmessage = async (event: MessageEvent<RunRequest>): Promise<void> => {
  const { source, tests, language, settleMs } = event.data;
  const result: RunResult = await executeSource(source, tests, language, settleMs);
  self.postMessage(result);
};
```

- [ ] **Step 6: Write the failing client test**

`src/engine/runner/runJs.test.ts`:
```ts
// packages
import { afterEach, describe, expect, it, vi } from 'vitest';

// engine
import { RUN_TIMEOUT_MS, runJs } from './runJs';
import type { RunResult } from './execute';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<RunResult>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  posted: unknown[] = [];

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(data: unknown): void {
    this.posted.push(data);
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe('runJs', () => {
  afterEach(() => {
    FakeWorker.instances = [];
    vi.useRealTimers();
  });

  it('resolves with the worker result and terminates the worker', async () => {
    const promise = runJs({ source: 'x', tests: [], language: 'javascript' }, () => new FakeWorker() as unknown as Worker);
    const worker = FakeWorker.instances[0];
    const result: RunResult = { status: 'ok', logs: [], tests: [] };
    worker?.onmessage?.({ data: result } as MessageEvent<RunResult>);
    await expect(promise).resolves.toEqual(result);
    expect(worker?.terminated).toBe(true);
  });

  it('times out and terminates a hung worker', async () => {
    vi.useFakeTimers();
    const promise = runJs({ source: 'while(true){}', tests: [], language: 'javascript' }, () => new FakeWorker() as unknown as Worker);
    vi.advanceTimersByTime(RUN_TIMEOUT_MS);
    await expect(promise).resolves.toMatchObject({ status: 'timeout' });
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });

  it('reports a worker error', async () => {
    const promise = runJs({ source: 'x', tests: [], language: 'javascript' }, () => new FakeWorker() as unknown as Worker);
    FakeWorker.instances[0]?.onerror?.({ message: 'boom' } as ErrorEvent);
    await expect(promise).resolves.toMatchObject({ status: 'error', error: 'boom' });
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx vitest run src/engine/runner/runJs.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 8: Implement the client**

`src/engine/runner/runJs.ts`:
```ts
// engine
import type { RunRequest, RunResult } from './execute';

export const RUN_TIMEOUT_MS = 3000;

export type WorkerFactory = () => Worker;

export function createRunnerWorker(): Worker {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

export function runJs(request: RunRequest, factory: WorkerFactory = createRunnerWorker): Promise<RunResult> {
  return new Promise<RunResult>((resolve) => {
    const worker = factory();
    let settled = false;

    const finish = (result: RunResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ status: 'timeout', logs: [], tests: [], error: `Timed out after ${RUN_TIMEOUT_MS} ms` });
    }, RUN_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<RunResult>): void => finish(event.data);
    worker.onerror = (event: ErrorEvent): void => {
      finish({ status: 'error', logs: [], tests: [], error: event.message });
    };
    worker.postMessage(request);
  });
}
```

- [ ] **Step 9: Run all runner tests and the build**

Run: `npx vitest run src/engine/runner && npm run build`
Expected: 10 passing; build emits a separate worker chunk (look for `assets/worker-*.js` in the output).

- [ ] **Step 10: Commit**

```bash
git add src/engine/runner
git commit -m "Add the in-browser JavaScript runner

User code is compiled with sucrase and executed inside a Web Worker that
the main thread terminates after three seconds, so an infinite loop can
never freeze the page. The pure core also runs under Node for the
content test.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: SQL runner

**Files:**
- Create: `src/engine/sql/runSql.ts`, `src/engine/sql/runSql.test.ts`, `src/engine/sql/browserLoader.ts`

**Interfaces:**
- Produces: `createSqlRunner(loader: SqlLoader): SqlRunner` where `SqlRunner = (schema: string, query: string) => Promise<SqlResult>`; `SqlResult = { status: 'ok' | 'error'; columns: string[]; rows: unknown[][]; error?: string }`; `loadSqlInBrowser(): Promise<SqlJsStatic>`; `loadSqlInNode(): Promise<SqlJsStatic>` (test-only helper exported from `runSql.ts`).

- [ ] **Step 1: Write the failing test**

`src/engine/sql/runSql.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { createSqlRunner, loadSqlInNode } from './runSql';

const schema = `
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, total REAL);
INSERT INTO orders VALUES (1, 'ana', 10.5), (2, 'ana', 4.5), (3, 'luis', 7);
`;

describe('createSqlRunner', () => {
  const run = createSqlRunner(loadSqlInNode);

  it('returns columns and rows for a grouped query', async () => {
    const result = await run(schema, 'SELECT customer, SUM(total) AS spent FROM orders GROUP BY customer ORDER BY customer');
    expect(result.status).toBe('ok');
    expect(result.columns).toEqual(['customer', 'spent']);
    expect(result.rows).toEqual([['ana', 15], ['luis', 7]]);
  });

  it('returns an empty result for a query with no rows', async () => {
    const result = await run(schema, 'SELECT * FROM orders WHERE total > 100');
    expect(result).toEqual({ status: 'ok', columns: [], rows: [] });
  });

  it('reports a SQL error', async () => {
    const result = await run(schema, 'SELECT nope FROM orders');
    expect(result.status).toBe('error');
    expect(result.error).toMatch(/no such column/);
  });

  it('uses a fresh database per run', async () => {
    await run(schema, "INSERT INTO orders VALUES (9, 'x', 1)");
    const result = await run(schema, 'SELECT COUNT(*) FROM orders');
    expect(result.rows).toEqual([[3]]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/engine/sql/runSql.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the runner and the loaders**

`src/engine/sql/runSql.ts`:
```ts
// packages
import initSqlJs from 'sql.js';
import type { SqlJsStatic } from 'sql.js';

export type SqlResult = { status: 'ok' | 'error'; columns: string[]; rows: unknown[][]; error?: string };
export type SqlLoader = () => Promise<SqlJsStatic>;
export type SqlRunner = (schema: string, query: string) => Promise<SqlResult>;

let nodeInstance: Promise<SqlJsStatic> | null = null;

export function loadSqlInNode(): Promise<SqlJsStatic> {
  if (nodeInstance === null) {
    nodeInstance = initSqlJs();
  }
  return nodeInstance;
}

export function createSqlRunner(loader: SqlLoader): SqlRunner {
  let instance: Promise<SqlJsStatic> | null = null;

  return async (schema: string, query: string): Promise<SqlResult> => {
    if (instance === null) {
      instance = loader();
    }
    const SQL = await instance;
    const db = new SQL.Database();
    try {
      db.run(schema);
      const sets = db.exec(query);
      const first = sets[0];
      if (first === undefined) {
        return { status: 'ok', columns: [], rows: [] };
      }
      return { status: 'ok', columns: first.columns, rows: first.values };
    } catch (error) {
      return { status: 'error', columns: [], rows: [], error: error instanceof Error ? error.message : String(error) };
    } finally {
      db.close();
    }
  };
}
```

`src/engine/sql/browserLoader.ts`:
```ts
// packages
import type { SqlJsStatic } from 'sql.js';

export async function loadSqlInBrowser(): Promise<SqlJsStatic> {
  const [{ default: initSqlJs }, { default: wasmUrl }] = await Promise.all([
    import('sql.js'),
    import('sql.js/dist/sql-wasm.wasm?url'),
  ]);
  return initSqlJs({ locateFile: (): string => wasmUrl });
}
```

If TypeScript rejects `sql.js/dist/sql-wasm.wasm?url`, add `src/vite-env.d.ts` with `/// <reference types="vite/client" />` (the `?url` suffix is typed there).

- [ ] **Step 4: Run the test and the build**

Run: `npx vitest run src/engine/sql && npm run build`
Expected: 4 passing. Build succeeds. If the build fails on `fs`/`path` inside `sql-wasm.js`, add to `vite.config.ts` under `build`: `rollupOptions: { external: [] }` is NOT the fix; instead add `define: { 'process.env.NODE_ENV': '"production"' }` and, if still failing, `resolve: { alias: { 'sql.js': 'sql.js/dist/sql-wasm.js' } }`. Record which one was needed in the commit body.

- [ ] **Step 5: Commit**

```bash
git add src/engine/sql src/vite-env.d.ts vite.config.ts
git commit -m "Add the in-browser SQL runner

sql.js is loaded lazily on the first SQL question so the WebAssembly
bundle never slows the initial page. Each run seeds a fresh database.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Static grader

**Files:**
- Create: `src/engine/grader.ts`, `src/engine/staticGrader.ts`, `src/engine/staticGrader.test.ts`

**Interfaces:**
- Consumes: `Question`, `Answer` types; `RunRequest`, `RunResult`; `SqlRunner`, `SqlResult`.
- Produces: `interface Grader { grade(question: Question, answer: Answer): Promise<GradeResult> }`; `GradeResult = { score: number; verdict: 'pass' | 'fail' | 'self'; feedback: string[]; run?: RunResult; sql?: SqlResult }`; `createStaticGrader(deps: { runJs: (r: RunRequest) => Promise<RunResult>; runSql: SqlRunner }): Grader`; `normalizeOutput(text: string): string`.

- [ ] **Step 1: Write the failing test**

`src/engine/staticGrader.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { createStaticGrader, normalizeOutput } from './staticGrader';
import { executeSource } from './runner/execute';
import { createSqlRunner, loadSqlInNode } from './sql/runSql';
import type { Question } from './question';

const base = {
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'mid',
  prompt: 'p',
  tags: [],
  source: 'notion',
  explanation: 'e',
} as const;

const grader = createStaticGrader({
  runJs: (request) => executeSource(request.source, request.tests, request.language),
  runSql: createSqlRunner(loadSqlInNode),
});

describe('normalizeOutput', () => {
  it('trims lines, collapses inner whitespace and drops blank lines', () => {
    expect(normalizeOutput('  a   b \n\n c\r\n')).toBe('a b\nc');
  });
});

describe('createStaticGrader', () => {
  it('grades single choice', async () => {
    const q: Question = { ...base, id: 's', kind: 'single', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], answer: 'b' };
    expect(await grader.grade(q, { kind: 'single', optionId: 'b' })).toMatchObject({ score: 1, verdict: 'pass' });
    expect(await grader.grade(q, { kind: 'single', optionId: 'a' })).toMatchObject({ score: 0, verdict: 'fail', feedback: ['Correct answer: B'] });
  });

  it('grades multi choice as set equality', async () => {
    const q: Question = { ...base, id: 'm', kind: 'multi', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }], answer: ['a', 'c'] };
    expect((await grader.grade(q, { kind: 'multi', optionIds: ['c', 'a'] })).verdict).toBe('pass');
    const partial = await grader.grade(q, { kind: 'multi', optionIds: ['a'] });
    expect(partial.verdict).toBe('fail');
    expect(partial.feedback).toEqual(['Missing: C']);
    const extra = await grader.grade(q, { kind: 'multi', optionIds: ['a', 'b', 'c'] });
    expect(extra.feedback).toEqual(['Should not be selected: B']);
  });

  it('grades predict with normalized comparison', async () => {
    const q: Question = { ...base, id: 'p', kind: 'predict', language: 'javascript', code: 'x', answer: '1\n4\n3\n2' };
    expect((await grader.grade(q, { kind: 'predict', text: ' 1 \n4\n\n3\n2\n' })).verdict).toBe('pass');
    const wrong = await grader.grade(q, { kind: 'predict', text: '1\n3\n4\n2' });
    expect(wrong.verdict).toBe('fail');
    expect(wrong.feedback[0]).toMatch(/line 2/i);
  });

  it('grades code by running tests', async () => {
    const q: Question = {
      ...base,
      id: 'c',
      kind: 'code',
      language: 'typescript',
      starter: '',
      tests: [{ name: 'adds', args: [1, 2], expected: 3 }, { name: 'adds big', args: [10, 20], expected: 30 }],
      solution: 'export function solution(a: number, b: number): number { return a + b; }',
    };
    const good = await grader.grade(q, { kind: 'code', source: q.solution });
    expect(good).toMatchObject({ score: 1, verdict: 'pass' });
    const half = await grader.grade(q, { kind: 'code', source: 'export function solution(a: number, b: number): number { return 3; }' });
    expect(half.score).toBe(0.5);
    expect(half.verdict).toBe('fail');
    expect(half.feedback).toEqual(['adds big: expected 30, got 3']);
    const broken = await grader.grade(q, { kind: 'code', source: 'nope(' });
    expect(broken).toMatchObject({ score: 0, verdict: 'fail' });
    expect(broken.feedback[0]).toMatch(/SyntaxError/);
  });

  it('grades sql as a multiset unless ordered', async () => {
    const q: Question = {
      ...base,
      id: 'q',
      kind: 'sql',
      schema: 'CREATE TABLE t(a INT); INSERT INTO t VALUES (2),(1);',
      answer: 'SELECT a FROM t',
      expectedRows: [[1], [2]],
    };
    expect((await grader.grade(q, { kind: 'sql', query: 'SELECT a FROM t' })).verdict).toBe('pass');
    const ordered: Question = { ...q, ordered: true };
    expect((await grader.grade(ordered, { kind: 'sql', query: 'SELECT a FROM t' })).verdict).toBe('fail');
    expect((await grader.grade(ordered, { kind: 'sql', query: 'SELECT a FROM t ORDER BY a' })).verdict).toBe('pass');
    const bad = await grader.grade(q, { kind: 'sql', query: 'SELECT b FROM t' });
    expect(bad.feedback[0]).toMatch(/no such column/);
  });

  it('returns self verdict for open questions using the rubric', async () => {
    const q: Question = { ...base, id: 'o', kind: 'open', modelAnswer: 'm', rubric: ['one', 'two', 'three', 'four'] };
    const result = await grader.grade(q, { kind: 'open', checked: [true, false, true, true] });
    expect(result).toEqual({ score: 0.75, verdict: 'self', feedback: ['Self-scored 3 of 4 rubric points'] });
  });

  it('rejects a mismatched answer kind', async () => {
    const q: Question = { ...base, id: 's2', kind: 'single', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], answer: 'b' };
    await expect(grader.grade(q, { kind: 'predict', text: 'x' })).rejects.toThrow(/kind/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/engine/staticGrader.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write the interface and the grader**

`src/engine/grader.ts`:
```ts
// engine
import type { Answer, Question } from './question';
import type { RunResult } from './runner/execute';
import type { SqlResult } from './sql/runSql';

export type Verdict = 'pass' | 'fail' | 'self';

export type GradeResult = {
  score: number;
  verdict: Verdict;
  feedback: string[];
  run?: RunResult;
  sql?: SqlResult;
};

export interface Grader {
  grade(question: Question, answer: Answer): Promise<GradeResult>;
}
```

`src/engine/staticGrader.ts`:
```ts
// engine
import type { Grader, GradeResult } from './grader';
import type { Answer, CodeQuestion, FixQuestion, MultiQuestion, OpenQuestion, PredictQuestion, Question, SingleQuestion, SqlQuestion } from './question';
import type { RunRequest, RunResult } from './runner/execute';
import type { SqlRunner } from './sql/runSql';

export type StaticGraderDeps = {
  runJs: (request: RunRequest) => Promise<RunResult>;
  runSql: SqlRunner;
};

export function normalizeOutput(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0)
    .join('\n');
}

function optionText(question: SingleQuestion | MultiQuestion, id: string): string {
  return question.options.find((o) => o.id === id)?.text ?? id;
}

function formatValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function wrongKind(question: Question, answer: Answer): Error {
  return new Error(`Answer kind "${answer.kind}" does not match question kind "${question.kind}"`);
}

function gradeSingle(question: SingleQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'single') {
    throw wrongKind(question, answer);
  }
  const pass = answer.optionId === question.answer;
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback: pass ? [] : [`Correct answer: ${optionText(question, question.answer)}`] };
}

function gradeMulti(question: MultiQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'multi') {
    throw wrongKind(question, answer);
  }
  const expected = new Set(question.answer);
  const chosen = new Set(answer.optionIds);
  const missing = question.answer.filter((id) => !chosen.has(id));
  const extra = answer.optionIds.filter((id) => !expected.has(id));
  const pass = missing.length === 0 && extra.length === 0;
  const feedback: string[] = [];
  if (missing.length > 0) {
    feedback.push(`Missing: ${missing.map((id) => optionText(question, id)).join(', ')}`);
  }
  if (extra.length > 0) {
    feedback.push(`Should not be selected: ${extra.map((id) => optionText(question, id)).join(', ')}`);
  }
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback };
}

function gradePredict(question: PredictQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'predict') {
    throw wrongKind(question, answer);
  }
  const expectedLines = normalizeOutput(question.answer).split('\n');
  const actualLines = normalizeOutput(answer.text).split('\n');
  const feedback: string[] = [];
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i += 1) {
    if (expectedLines[i] !== actualLines[i]) {
      feedback.push(`Line ${i + 1}: expected "${expectedLines[i] ?? ''}", got "${actualLines[i] ?? ''}"`);
    }
  }
  const pass = feedback.length === 0;
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback };
}

async function gradeCode(question: CodeQuestion | FixQuestion, answer: Answer, runJs: StaticGraderDeps['runJs']): Promise<GradeResult> {
  if (answer.kind !== 'code') {
    throw wrongKind(question, answer);
  }
  const run = await runJs({ source: answer.source, tests: question.tests, language: question.language });
  if (run.status !== 'ok') {
    return { score: 0, verdict: 'fail', feedback: [run.error ?? run.status], run };
  }
  const passed = run.tests.filter((t) => t.passed).length;
  const feedback = run.tests
    .filter((t) => !t.passed)
    .map((t) => {
      const expected = question.tests.find((c) => c.name === t.name)?.expected;
      return t.error !== undefined ? `${t.name}: ${t.error}` : `${t.name}: expected ${formatValue(expected)}, got ${formatValue(t.actual)}`;
    });
  const score = run.tests.length === 0 ? 0 : passed / run.tests.length;
  return { score, verdict: score === 1 ? 'pass' : 'fail', feedback, run };
}

function rowKey(row: unknown[]): string {
  return JSON.stringify(row);
}

async function gradeSql(question: SqlQuestion, answer: Answer, runSql: SqlRunner): Promise<GradeResult> {
  if (answer.kind !== 'sql') {
    throw wrongKind(question, answer);
  }
  const sql = await runSql(question.schema, answer.query);
  if (sql.status !== 'ok') {
    return { score: 0, verdict: 'fail', feedback: [sql.error ?? 'SQL error'], sql };
  }
  const expected = question.expectedRows.map(rowKey);
  const actual = sql.rows.map(rowKey);
  const sortedExpected = [...expected].sort();
  const sortedActual = [...actual].sort();
  const pass = expected.length === actual.length && (question.ordered === true
    ? expected.every((row, i) => row === actual[i])
    : sortedExpected.every((row, i) => row === sortedActual[i]));
  const feedback = pass ? [] : [`Expected ${expected.length} row(s), got ${actual.length}${question.ordered === true ? ' (order matters)' : ''}`];
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback, sql };
}

function gradeOpen(question: OpenQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'open') {
    throw wrongKind(question, answer);
  }
  const total = question.rubric.length;
  const checked = answer.checked.slice(0, total).filter(Boolean).length;
  return { score: total === 0 ? 0 : checked / total, verdict: 'self', feedback: [`Self-scored ${checked} of ${total} rubric points`] };
}

export function createStaticGrader(deps: StaticGraderDeps): Grader {
  return {
    grade: async (question: Question, answer: Answer): Promise<GradeResult> => {
      switch (question.kind) {
        case 'single':
          return gradeSingle(question, answer);
        case 'multi':
          return gradeMulti(question, answer);
        case 'predict':
          return gradePredict(question, answer);
        case 'code':
        case 'fix':
          return gradeCode(question, answer, deps.runJs);
        case 'sql':
          return gradeSql(question, answer, deps.runSql);
        case 'open':
          return gradeOpen(question, answer);
      }
    },
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/staticGrader.test.ts`
Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add src/engine/grader.ts src/engine/staticGrader.ts src/engine/staticGrader.test.ts
git commit -m "Add the grader interface and the static grader

The Grader interface is the seam for a future Claude grader; the static
implementation covers every question kind and takes its runners by
injection so the same code is exercised under Node and in the browser.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Registry, session helpers, seed content and the content test

**Files:**
- Create: `src/engine/registry.ts`, `src/engine/registry.test.ts`, `src/engine/session.ts`, `src/engine/session.test.ts`, `src/content/languages/javascript.ts`, `src/content/databases/sql.ts`, `src/content/content.test.ts`

**Interfaces:**
- Consumes: `Question`, `questionSchema`, `DOMAINS`, `findTopic`, `ProgressMap`, `executeSource`, `createSqlRunner`, `loadSqlInNode`.
- Produces: `loadQuestions(): Question[]` (eager glob), `indexById(list): Map<string, Question>`, `filterQuestions(list, filter: QuestionFilter): Question[]`, `summarize(list, progress): Summary`, `countBy(list, key: 'domain' | 'subject' | 'topic' | 'level' | 'kind'): Record<string, number>`; `shuffle<T>(items, random?)`, `pickMock(list, options): Question[]`; types `QuestionFilter`, `Summary`, `MockOptions`.

- [ ] **Step 1: Write the failing registry test**

`src/engine/registry.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { countBy, filterQuestions, indexById, summarize } from './registry';
import type { Question } from './question';

function q(id: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'mid',
    kind: 'open',
    prompt: 'p',
    tags: [],
    source: 'notion',
    explanation: 'e',
    modelAnswer: 'm',
    rubric: ['a', 'b'],
    ...extra,
  } as Question;
}

const bank = [q('a'), q('b', { level: 'senior', subject: 'typescript', topic: 'generics' }), q('c', { domain: 'cloud', subject: 'aws', topic: 's3', level: 'junior' })];

describe('registry helpers', () => {
  it('indexes by id', () => {
    expect(indexById(bank).get('b')?.subject).toBe('typescript');
  });

  it('filters by domain, subject, topic, level, kind and ids', () => {
    expect(filterQuestions(bank, { domain: 'languages' }).map((x) => x.id)).toEqual(['a', 'b']);
    expect(filterQuestions(bank, { subject: 'typescript' }).map((x) => x.id)).toEqual(['b']);
    expect(filterQuestions(bank, { topic: 's3' }).map((x) => x.id)).toEqual(['c']);
    expect(filterQuestions(bank, { levels: ['junior', 'senior'] }).map((x) => x.id)).toEqual(['b', 'c']);
    expect(filterQuestions(bank, { kinds: ['code'] })).toEqual([]);
    expect(filterQuestions(bank, { ids: ['c', 'a'] }).map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('summarizes mastery from progress', () => {
    const summary = summarize(bank, { a: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' }, b: { attempts: 2, lastScore: 0.5, lastAt: '', flagged: true, notes: '' } });
    expect(summary).toEqual({ total: 3, attempted: 2, unattempted: 1, mastery: 0.75, flagged: 1 });
  });

  it('summarizes an untouched bank with zero mastery', () => {
    expect(summarize(bank, {})).toEqual({ total: 3, attempted: 0, unattempted: 3, mastery: 0, flagged: 0 });
  });

  it('counts by a key', () => {
    expect(countBy(bank, 'level')).toEqual({ mid: 1, senior: 1, junior: 1 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/engine/registry.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the registry**

`src/engine/registry.ts`:
```ts
// engine
import type { Kind, Level, Question } from './question';
import type { ProgressMap } from './progress';

export type QuestionFilter = {
  domain?: string;
  subject?: string;
  topic?: string;
  levels?: Level[];
  kinds?: Kind[];
  ids?: string[];
};

export type Summary = { total: number; attempted: number; unattempted: number; mastery: number; flagged: number };

type ContentModule = { questions: Question[] };

export function loadQuestions(): Question[] {
  const modules = import.meta.glob<ContentModule>('../content/*/*.ts', { eager: true });
  return Object.values(modules).flatMap((m) => m.questions);
}

export function indexById(list: Question[]): Map<string, Question> {
  return new Map(list.map((question) => [question.id, question]));
}

export function filterQuestions(list: Question[], filter: QuestionFilter): Question[] {
  const ids = filter.ids === undefined ? null : new Set(filter.ids);
  return list.filter(
    (question) =>
      (filter.domain === undefined || question.domain === filter.domain) &&
      (filter.subject === undefined || question.subject === filter.subject) &&
      (filter.topic === undefined || question.topic === filter.topic) &&
      (filter.levels === undefined || filter.levels.includes(question.level)) &&
      (filter.kinds === undefined || filter.kinds.includes(question.kind)) &&
      (ids === null || ids.has(question.id)),
  );
}

export function summarize(list: Question[], progress: ProgressMap): Summary {
  const entries = list.map((question) => progress[question.id]).filter((p) => p !== undefined);
  const attempted = entries.filter((p) => p.attempts > 0);
  const mastery = attempted.length === 0 ? 0 : attempted.reduce((sum, p) => sum + p.lastScore, 0) / attempted.length;
  return {
    total: list.length,
    attempted: attempted.length,
    unattempted: list.length - attempted.length,
    mastery,
    flagged: entries.filter((p) => p.flagged).length,
  };
}

export function countBy(list: Question[], key: 'domain' | 'subject' | 'topic' | 'level' | 'kind'): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const question of list) {
    const value = question[key];
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/engine/registry.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Write the failing session test**

`src/engine/session.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { pickMock, shuffle } from './session';
import type { Question } from './question';

function q(id: string, level: Question['level'], domain = 'languages'): Question {
  return { id, domain, subject: 's', topic: 't', level, kind: 'open', prompt: 'p', tags: [], source: 'notion', explanation: 'e', modelAnswer: 'm', rubric: ['a', 'b'] };
}

function fixedRandom(sequence: number[]): () => number {
  let i = 0;
  return (): number => sequence[i++ % sequence.length] ?? 0;
}

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input, fixedRandom([0.1, 0.5, 0.9]));
    expect(out).toHaveLength(4);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

describe('pickMock', () => {
  const bank = [q('a', 'junior'), q('b', 'mid'), q('c', 'senior'), q('d', 'senior', 'cloud'), q('e', 'mid', 'cloud')];

  it('picks count questions matching levels and domains', () => {
    const picked = pickMock(bank, { count: 2, levels: ['senior', 'mid'], domains: ['cloud'] }, fixedRandom([0]));
    expect(picked.map((x) => x.id).sort()).toEqual(['d', 'e']);
  });

  it('caps at the available pool', () => {
    expect(pickMock(bank, { count: 10, levels: ['junior'], domains: [] }, fixedRandom([0]))).toHaveLength(1);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/engine/session.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 7: Implement session helpers**

`src/engine/session.ts`:
```ts
// engine
import { filterQuestions } from './registry';
import type { Level, Question } from './question';

export type MockOptions = { count: number; levels: Level[]; domains: string[] };

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

export function pickMock(list: Question[], options: MockOptions, random: () => number = Math.random): Question[] {
  const byLevel = filterQuestions(list, { levels: options.levels });
  const pool = options.domains.length === 0 ? byLevel : byLevel.filter((question) => options.domains.includes(question.domain));
  return shuffle(pool, random).slice(0, options.count);
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run src/engine/session.test.ts`
Expected: 3 passing.

- [ ] **Step 9: Write the seed content**

`src/content/languages/javascript.ts` (seed of 8 questions covering every kind except sql; the day-2 authoring replaces nothing here, it appends):
```ts
// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'javascript-event-loop-order-basic',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-loop',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'What does this print, one value per line?',
    code: `console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);`,
    answer: '1\n4\n3\n2',
    tags: ['event-loop', 'microtasks'],
    source: 'notion',
    explanation:
      'Synchronous logs run first (1, 4). The whole microtask queue drains before the next macrotask, so the promise callback (3) beats the timer (2).\n\n**Say this out loud:** "Microtasks always run before the next macrotask, so a flood of promise callbacks can starve timers."',
  },
  {
    id: 'javascript-this-spread-greet',
    domain: 'languages',
    subject: 'javascript',
    topic: 'this-binding',
    level: 'senior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      'A spread copy shares the `greet` function but `this` still resolves at call time. Change **only the body of `solution`** so it returns the greeting for the copied object with `name: "Daniel"` using the original `greet` without editing `greet` itself.',
    starter: `const firstSubject = {
  name: 'Jose',
  greet: function () {
    return \`Hello, \${this.name}!\`;
  },
};
const secondSubject = { ...firstSubject, name: 'Daniel' };

export function solution() {
  return firstSubject.greet();
}`,
    tests: [{ name: 'greets Daniel', args: [], expected: 'Hello, Daniel!' }],
    solution: `const firstSubject = {
  name: 'Jose',
  greet: function () {
    return \`Hello, \${this.name}!\`;
  },
};
const secondSubject = { ...firstSubject, name: 'Daniel' };

export function solution() {
  return firstSubject.greet.call(secondSubject);
}`,
    tags: ['this', 'call', 'spread'],
    source: 'notion',
    explanation:
      '`this` is bound by the call site, not by where the function was defined. `secondSubject.greet()` or `firstSubject.greet.call(secondSubject)` both work; `bind` returns a new function. Arrow functions would ignore all of these because they capture `this` lexically.',
  },
  {
    id: 'javascript-closure-counter-independence',
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'junior',
    kind: 'single',
    prompt: '```js\nfunction outer() {\n  let n = 0;\n  return () => ++n;\n}\nconst a = outer();\nconst b = outer();\na(); a();\nconsole.log(b());\n```\nWhat is printed?',
    options: [
      { id: 'a', text: '1' },
      { id: 'b', text: '3' },
      { id: 'c', text: '2' },
      { id: 'd', text: 'undefined' },
    ],
    answer: 'a',
    tags: ['closures'],
    source: 'notion',
    explanation: 'Each call to `outer` creates a fresh `n`. `a` and `b` close over different variables, so `b` starts from 0.',
  },
  {
    id: 'javascript-shallow-copy-nested',
    domain: 'languages',
    subject: 'javascript',
    topic: 'references-and-copies',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which of these produce a **deep** copy of `{ a: { b: [1, 2] }, d: new Date() }` that preserves the `Date`? Select all that apply.',
    options: [
      { id: 'a', text: '`{ ...obj }`' },
      { id: 'b', text: '`structuredClone(obj)`' },
      { id: 'c', text: '`JSON.parse(JSON.stringify(obj))`' },
      { id: 'd', text: '`Object.assign({}, obj)`' },
    ],
    answer: ['b'],
    tags: ['structuredClone', 'deep-copy'],
    source: 'topic-list',
    explanation: 'Spread and `Object.assign` copy one level. `JSON` round-trips turn a `Date` into a string and drop functions and `undefined`. `structuredClone` handles nested objects, Dates, Maps and Sets, but not functions or class prototypes.',
  },
  {
    id: 'javascript-array-methods-some-every',
    domain: 'languages',
    subject: 'javascript',
    topic: 'array-methods',
    level: 'junior',
    kind: 'code',
    language: 'typescript',
    prompt: 'Implement `solution(orders)` that returns `true` when **every** order has a positive `total` and **some** order is flagged `priority`.',
    starter: `type Order = { total: number; priority: boolean };

export function solution(orders: Order[]): boolean {
  return false;
}`,
    tests: [
      { name: 'all positive with one priority', args: [[{ total: 5, priority: false }, { total: 2, priority: true }]], expected: true },
      { name: 'zero total fails', args: [[{ total: 0, priority: true }]], expected: false },
      { name: 'no priority fails', args: [[{ total: 3, priority: false }]], expected: false },
      { name: 'empty list has no priority', args: [[]], expected: false },
    ],
    solution: `type Order = { total: number; priority: boolean };

export function solution(orders: Order[]): boolean {
  return orders.every((o) => o.total > 0) && orders.some((o) => o.priority);
}`,
    tags: ['some', 'every'],
    source: 'topic-list',
    explanation: '`every` on an empty array is `true` (vacuous truth) while `some` is `false`; the empty-list test exists to make you notice that.',
  },
  {
    id: 'javascript-promise-combinators-choice',
    domain: 'languages',
    subject: 'javascript',
    topic: 'async',
    level: 'senior',
    kind: 'open',
    prompt: 'You fan out to five downstream services for a dashboard and must render whatever succeeds within 800 ms. Which promise combinators do you use, and how do you handle the timeout?',
    modelAnswer:
      'Wrap each call in `Promise.race([call, rejectAfter(800)])` (or `AbortSignal.timeout(800)` on fetch), then `Promise.allSettled` over the five so one failure never rejects the whole render. Map settled results to data-or-error per widget. `Promise.all` would fail fast; `Promise.any` only gives the first success.',
    rubric: [
      'Names `Promise.allSettled` for partial-failure tolerance',
      'Explains why `Promise.all` is wrong here (fail-fast)',
      'Applies a per-call timeout with `race` or `AbortSignal.timeout`',
      'Mentions surfacing per-widget errors rather than one global failure',
    ],
    tags: ['promises', 'resilience'],
    source: 'notion',
    explanation: 'Senior signal: choosing the combinator by failure semantics, then adding timeouts so the slowest dependency bounds latency.',
  },
  {
    id: 'javascript-equality-coercion-core',
    domain: 'languages',
    subject: 'javascript',
    topic: 'coercion-and-equality',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'What does this print, one value per line?',
    code: `console.log(0 == '');
console.log(null == undefined);
console.log(null === undefined);
console.log([] + {});
console.log(NaN === NaN);`,
    answer: 'true\ntrue\nfalse\n[object Object]\nfalse',
    tags: ['coercion', 'core-25'],
    source: 'core-list',
    explanation: '`==` coerces (`""` becomes 0; `null`/`undefined` are loosely equal only to each other). `[] + {}` stringifies both sides. `NaN` is never equal to anything; use `Number.isNaN` or `Object.is`.',
  },
  {
    id: 'javascript-hoisting-tdz-core',
    domain: 'languages',
    subject: 'javascript',
    topic: 'hoisting-and-scope',
    level: 'junior',
    kind: 'single',
    prompt: '```js\nconsole.log(a);\nconsole.log(typeof f);\nlet a = 1;\nfunction f() {}\n```\nWhat happens on the first line?',
    options: [
      { id: 'a', text: 'Prints `undefined`, then `function`' },
      { id: 'b', text: 'Throws `ReferenceError` because `a` is in the temporal dead zone' },
      { id: 'c', text: 'Prints `1`, then `function`' },
      { id: 'd', text: 'Throws `TypeError`' },
    ],
    answer: 'b',
    tags: ['hoisting', 'tdz', 'core-25'],
    source: 'core-list',
    explanation: '`let` is hoisted but uninitialized until its declaration runs, so reading it throws. `var` would print `undefined`; the function declaration is fully hoisted but never reached here.',
  },
];
```

`src/content/databases/sql.ts`:
```ts
// engine
import type { Question } from '../../engine/question';

const shop = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL);
INSERT INTO customers VALUES (1, 'Ana', 'CO'), (2, 'Luis', 'CO'), (3, 'Mia', 'US'), (4, 'Tom', 'US');
INSERT INTO orders VALUES
  (1, 1, 120.0, '2026-09-01'), (2, 1, 80.0, '2026-09-03'), (3, 2, 40.0, '2026-09-02'),
  (4, 3, 300.0, '2026-09-04'), (5, 3, 20.0, '2026-09-05');
`;

export const questions: Question[] = [
  {
    id: 'sql-total-per-customer-with-zero',
    domain: 'databases',
    subject: 'sql',
    topic: 'joins',
    level: 'mid',
    kind: 'sql',
    prompt: 'Return every customer name with their total order amount, **including customers with no orders** (as 0). Columns: `name`, `spent`. Order by `spent` descending, then `name`.',
    schema: shop,
    answer: `SELECT c.name, COALESCE(SUM(o.total), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY spent DESC, c.name`,
    expectedRows: [['Mia', 320], ['Ana', 200], ['Luis', 40], ['Tom', 0]],
    ordered: true,
    tags: ['left-join', 'coalesce', 'group-by'],
    source: 'topic-list',
    explanation: 'An inner join would drop Tom. `COALESCE` turns the `NULL` sum into 0. Grouping by the primary key keeps the query valid under strict `GROUP BY` rules in Postgres and MySQL `ONLY_FULL_GROUP_BY`.',
  },
  {
    id: 'sql-countries-over-threshold',
    domain: 'databases',
    subject: 'sql',
    topic: 'aggregation',
    level: 'junior',
    kind: 'sql',
    prompt: 'Return the countries whose customers spent more than 150 in total. Columns: `country`, `spent`. Any order.',
    schema: shop,
    answer: `SELECT c.country, SUM(o.total) AS spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.country
HAVING SUM(o.total) > 150`,
    expectedRows: [['CO', 240], ['US', 320]],
    tags: ['having', 'group-by'],
    source: 'topic-list',
    explanation: '`WHERE` filters rows before aggregation; `HAVING` filters groups after it. Putting the condition in `WHERE` would be a syntax error because the aggregate does not exist yet.',
  },
];
```

- [ ] **Step 10: Write the content test**

`src/content/content.test.ts`:
```ts
// packages
import { describe, expect, it } from 'vitest';

// engine
import { questionSchema } from '../engine/question';
import { loadQuestions } from '../engine/registry';
import { executeSource } from '../engine/runner/execute';
import { createSqlRunner, loadSqlInNode } from '../engine/sql/runSql';

// content
import { findTopic } from './taxonomy';

const bank = loadQuestions();
const runSql = createSqlRunner(loadSqlInNode);

describe('question bank', () => {
  it('is not empty', () => {
    expect(bank.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = bank.map((q) => q.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it.each(bank.map((q) => [q.id, q] as const))('%s is valid', async (_id, question) => {
    const parsed = questionSchema.safeParse(question);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect(findTopic(question.domain, question.subject, question.topic), `unknown taxonomy path ${question.domain}/${question.subject}/${question.topic}`).toBeDefined();
    expect(question.id.startsWith(`${question.subject}-`), 'id must start with the subject').toBe(true);

    if (question.kind === 'single') {
      expect(question.options.map((o) => o.id)).toContain(question.answer);
    }
    if (question.kind === 'multi') {
      const ids = question.options.map((o) => o.id);
      question.answer.forEach((a) => expect(ids).toContain(a));
    }
    if (question.kind === 'code' || question.kind === 'fix') {
      const result = await executeSource(question.solution, question.tests, question.language);
      expect(result.status, result.error).toBe('ok');
      expect(result.tests.filter((t) => !t.passed).map((t) => t.name)).toEqual([]);
      const starterRun = await executeSource(question.starter, question.tests, question.language);
      const starterPasses = starterRun.status === 'ok' && starterRun.tests.every((t) => t.passed);
      expect(starterPasses, 'starter must not already pass').toBe(false);
    }
    if (question.kind === 'sql') {
      const result = await runSql(question.schema, question.answer);
      expect(result.status, result.error).toBe('ok');
      const expected = question.expectedRows.map((r) => JSON.stringify(r));
      const actual = result.rows.map((r) => JSON.stringify(r));
      if (question.ordered === true) {
        expect(actual).toEqual(expected);
      } else {
        expect([...actual].sort()).toEqual([...expected].sort());
      }
    }
    if (question.kind === 'predict') {
      const run = await executeSource(`${question.code}\nexport function solution() {}`, [], question.language, 50);
      expect(run.status, run.error).toBe('ok');
      expect(run.logs.join('\n')).toBe(question.answer);
    }
  });
});
```

Note the `predict` check: the question's `code` is executed with a 50 ms settle window and its console output must equal `answer` exactly. Predict programs must therefore be self-contained (no imports, no top-level `await`) and may schedule at most `setTimeout(..., 0)`-style macrotasks; longer timers will not be captured and the test will fail, which is the intent.

- [ ] **Step 11: Run the content test and full suite**

Run: `npx vitest run`
Expected: everything passes, including one `%s is valid` case per seed question (10 cases). If `import.meta.glob` returns nothing under vitest, confirm the path is relative to `src/engine/registry.ts` (`../content/*/*.ts`) and that `content.test.ts` is excluded by the glob because it sits directly in `src/content/`, not in a subfolder.

- [ ] **Step 12: Commit**

```bash
git add src/engine/registry.ts src/engine/registry.test.ts src/engine/session.ts src/engine/session.test.ts src/engine/runner src/content
git commit -m "Add the question registry, session helpers and seed content

The content test executes every reference solution, SQL answer and
predict snippet, so a broken exercise fails CI instead of surfacing
during practice.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: App shell, theme, primitives, Markdown and CodeEditor

**Files:**
- Create: `src/contexts/ThemeContext.tsx`, `src/contexts/GraderContext.tsx`, `src/hooks/useProgress.ts`, `src/hooks/useQuestionBank.ts`, `src/components/primitives/Button.tsx`, `src/components/primitives/Card.tsx`, `src/components/primitives/Badge.tsx`, `src/components/primitives/ProgressBar.tsx`, `src/components/common/Layout.tsx`, `src/components/common/Markdown.tsx`, `src/components/common/CodeEditor.tsx`, `src/components/common/CodeEditor.test.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`

**Interfaces:**
- Produces: `ThemeProvider`, `useTheme(): { theme: 'dark' | 'light'; toggle(): void }`; `GraderProvider`, `useGrader(): Grader`; `ProgressProvider`, `useProgress(): { store: ProgressStore; progress: ProgressMap }`; `useQuestionBank(): { list: Question[]; byId: Map<string, Question> }`; `Button`, `Card`, `Badge`, `ProgressBar`, `Layout`, `Markdown({ text })`, `CodeEditor({ value, onChange, language, readOnly? })`; `App` renders the router with every route from the spec (pages stubbed as headings until Tasks 10 to 13).

- [ ] **Step 1: Write the contexts and hooks**

`src/contexts/ThemeContext.tsx`:
```tsx
// packages
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';

type Theme = 'dark' | 'light';
type ThemeValue = { theme: Theme; toggle: () => void };

const THEME_KEY = 'ema:theme';
const ThemeContext = createContext<ThemeValue | null>(null);

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore blocked storage
    }
  }, [theme]);

  const toggle = useCallback((): void => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo((): ThemeValue => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
```

`src/contexts/GraderContext.tsx`:
```tsx
// packages
import { createContext, useContext, useMemo } from 'react';
import type { JSX, ReactNode } from 'react';

// engine
import { createStaticGrader } from '../engine/staticGrader';
import { runJs } from '../engine/runner/runJs';
import { createSqlRunner } from '../engine/sql/runSql';
import { loadSqlInBrowser } from '../engine/sql/browserLoader';
import type { Grader } from '../engine/grader';

const GraderContext = createContext<Grader | null>(null);

export function GraderProvider({ children, grader }: { children: ReactNode; grader?: Grader }): JSX.Element {
  const value = useMemo((): Grader => grader ?? createStaticGrader({ runJs, runSql: createSqlRunner(loadSqlInBrowser) }), [grader]);
  return <GraderContext.Provider value={value}>{children}</GraderContext.Provider>;
}

export function useGrader(): Grader {
  const value = useContext(GraderContext);
  if (value === null) {
    throw new Error('useGrader must be used inside GraderProvider');
  }
  return value;
}
```

`src/hooks/useProgress.ts`:
```ts
// packages
import { createContext, createElement, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';

// engine
import { createProgressStore } from '../engine/progress';
import type { ProgressMap, ProgressStore } from '../engine/progress';

const ProgressContext = createContext<ProgressStore | null>(null);

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ProgressProvider({ children, store }: { children: ReactNode; store?: ProgressStore }): ReactElement {
  const value = useMemo((): ProgressStore => store ?? createProgressStore(safeStorage()), [store]);
  return createElement(ProgressContext.Provider, { value }, children);
}

export function useProgress(): { store: ProgressStore; progress: ProgressMap } {
  const store = useContext(ProgressContext);
  if (store === null) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  const progress = useSyncExternalStore(store.subscribe, store.all, store.all);
  return { store, progress };
}
```

`src/hooks/useQuestionBank.ts`:
```ts
// packages
import { useMemo } from 'react';

// engine
import { indexById, loadQuestions } from '../engine/registry';
import type { Question } from '../engine/question';

let cached: { list: Question[]; byId: Map<string, Question> } | null = null;

export function useQuestionBank(): { list: Question[]; byId: Map<string, Question> } {
  return useMemo(() => {
    if (cached === null) {
      const list = loadQuestions();
      cached = { list, byId: indexById(list) };
    }
    return cached;
  }, []);
}
```

- [ ] **Step 2: Write the primitives**

`src/components/primitives/Button.tsx`:
```tsx
// packages
import type { ButtonHTMLAttributes, JSX } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' };

const styles: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-spice-500 text-white hover:bg-spice-600 disabled:bg-zinc-400',
  ghost: 'border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({ variant = 'primary', className = '', ...rest }: Props): JSX.Element {
  return (
    <button
      type="button"
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
```

`src/components/primitives/Card.tsx`:
```tsx
// packages
import type { HTMLAttributes, JSX } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`} {...rest} />;
}
```

`src/components/primitives/Badge.tsx`:
```tsx
// packages
import type { JSX } from 'react';

type Tone = 'junior' | 'mid' | 'senior' | 'neutral';

const tones: Record<Tone, string> = {
  junior: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  mid: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  senior: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  neutral: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: string }): JSX.Element {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
```

`src/components/primitives/ProgressBar.tsx`:
```tsx
// packages
import type { JSX } from 'react';

export function ProgressBar({ value, label }: { value: number; label?: string }): JSX.Element {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="w-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Mastery'}>
      <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800">
        <div className="h-2 rounded bg-spice-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write Layout, Markdown and CodeEditor**

`src/components/common/Layout.tsx`:
```tsx
// packages
import { NavLink, Outlet } from 'react-router-dom';
import type { JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Browse' },
  { to: '/drill', label: 'Drill' },
  { to: '/mock', label: 'Mock' },
  { to: '/review', label: 'Review' },
  { to: '/settings', label: 'Settings' },
];

export function Layout(): JSX.Element {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
          <span className="mr-3 whitespace-nowrap font-semibold text-spice-500">Mentat Academy</span>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }): string =>
                `rounded px-2 py-1 whitespace-nowrap ${isActive ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button type="button" onClick={toggle} className="ml-auto rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label="Toggle theme">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

`src/components/common/Markdown.tsx`:
```tsx
// packages
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { JSX } from 'react';

export function Markdown({ text }: { text: string }): JSX.Element {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
```

`src/components/common/CodeEditor.tsx`:
```tsx
// packages
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import type { JSX } from 'react';

// contexts
import { useTheme } from '../../contexts/ThemeContext';

export type EditorLanguage = 'javascript' | 'typescript' | 'sql';

type Props = { value: string; onChange: (value: string) => void; language: EditorLanguage; readOnly?: boolean; ariaLabel?: string };

function languageExtension(language: EditorLanguage): ReturnType<typeof javascript> {
  if (language === 'sql') {
    return sql();
  }
  return javascript({ typescript: language === 'typescript' });
}

export function CodeEditor({ value, onChange, language, readOnly = false, ariaLabel = 'Code editor' }: Props): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { theme } = useTheme();

  useEffect(() => {
    if (host.current === null) {
      return;
    }
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageExtension(language),
        ...(theme === 'dark' ? [oneDark] : []),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update): void => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return (): void => {
      view.current?.destroy();
      view.current = null;
    };
    // The editor is recreated only when language, theme or readOnly change; `value` is the initial doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, theme, readOnly]);

  useEffect(() => {
    const current = view.current;
    if (current !== null && current.state.doc.toString() !== value) {
      current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="min-h-[160px]" />;
}
```

- [ ] **Step 4: Write the CodeEditor test**

`src/components/common/CodeEditor.test.tsx`:
```tsx
// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// components
import { CodeEditor } from './CodeEditor';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('CodeEditor', () => {
  it('mounts CodeMirror with the initial value', () => {
    const onChange = vi.fn();
    render(
      <ThemeProvider>
        <CodeEditor value="const a = 1;" onChange={onChange} language="typescript" ariaLabel="Solution" />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Solution')).toHaveTextContent('const a = 1;');
  });
});
```

If jsdom throws `document.getSelection is not a function` or a `getClientRects` error, add to `vitest.setup.ts`:
```ts
Object.defineProperty(document, 'getSelection', { value: (): null => null });
Range.prototype.getClientRects = (): DOMRectList => ({ length: 0, item: (): null => null, [Symbol.iterator]: function* (): Generator<DOMRect> {} }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect = (): DOMRect => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: (): string => '' });
```

- [ ] **Step 5: Wire the router in App.tsx with stub pages**

Create each page file listed below as a stub that renders an `<h1>` with its name (`Home`, `Browse`, `BrowseDomain`, `BrowseSubject`, `Drill`, `Mock`, `Review`, `QuestionPage`, `Settings`), each exporting a named function component with an explicit `JSX.Element` return type. Then:

`src/App.tsx`:
```tsx
// packages
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import type { JSX } from 'react';

// contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { GraderProvider } from './contexts/GraderContext';

// hooks
import { ProgressProvider } from './hooks/useProgress';

// components
import { Layout } from './components/common/Layout';

// pages
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { BrowseDomain } from './pages/BrowseDomain';
import { BrowseSubject } from './pages/BrowseSubject';
import { Drill } from './pages/Drill';
import { Mock } from './pages/Mock';
import { Review } from './pages/Review';
import { QuestionPage } from './pages/QuestionPage';
import { Settings } from './pages/Settings';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'browse', element: <Browse /> },
      { path: 'browse/:domain', element: <BrowseDomain /> },
      { path: 'browse/:domain/:subject', element: <BrowseSubject /> },
      { path: 'drill', element: <Drill /> },
      { path: 'mock', element: <Mock /> },
      { path: 'review', element: <Review /> },
      { path: 'q/:id', element: <QuestionPage /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') });

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <GraderProvider>
          <RouterProvider router={router} />
        </GraderProvider>
      </ProgressProvider>
    </ThemeProvider>
  );
}
```

Update `src/App.test.tsx` to test the route tree with a memory router instead of `<App />`:
```tsx
// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from './App';

// contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { GraderProvider } from './contexts/GraderContext';

// hooks
import { ProgressProvider } from './hooks/useProgress';

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <ProgressProvider>
        <GraderProvider>
          <RouterProvider router={router} />
        </GraderProvider>
      </ProgressProvider>
    </ThemeProvider>,
  );
}

describe('routes', () => {
  it('renders the navigation and the home page', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Browse' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run lint, tests and build**

Run: `npm run lint && npm test && npm run build`
Expected: all green. `dist/` contains the sql.js wasm only as a lazily loaded asset.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add the app shell, theme, primitives and code editor

Routes, providers and the CodeMirror wrapper land before any screen so
each page task can focus on one flow.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Question components and QuestionView

**Files:**
- Create: `src/components/question/SingleChoice.tsx`, `src/components/question/MultiChoice.tsx`, `src/components/question/PredictOutput.tsx`, `src/components/question/CodeExercise.tsx`, `src/components/question/SqlExercise.tsx`, `src/components/question/OpenAnswer.tsx`, `src/components/question/Feedback.tsx`, `src/components/question/QuestionView.tsx`, `src/components/question/QuestionView.test.tsx`

**Interfaces:**
- Consumes: `Question` subtypes, `Answer`, `GradeResult`, `useGrader`, `useProgress`, `Markdown`, `CodeEditor`, `Button`, `Badge`, `Card`.
- Produces: each kind component has props `{ question: <KindQuestion>; disabled: boolean; onSubmit(answer: Answer): void }`; `Feedback({ result })`; `QuestionView({ question, onNext?, position? })` where `position = { index: number; total: number }`. QuestionView records progress on grade, handles flag and notes, exposes keyboard `N` for next and `F` for flag.

- [ ] **Step 1: Write the failing QuestionView test**

`src/components/question/QuestionView.test.tsx`:
```tsx
// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// components
import { QuestionView } from './QuestionView';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';
import { GraderProvider } from '../../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../../hooks/useProgress';

// engine
import { createProgressStore } from '../../engine/progress';
import { createStaticGrader } from '../../engine/staticGrader';
import { executeSource } from '../../engine/runner/execute';
import type { Question } from '../../engine/question';

const single: Question = {
  id: 'javascript-test-single',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'junior',
  kind: 'single',
  prompt: 'Pick **B**',
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
  answer: 'b',
  tags: [],
  source: 'notion',
  explanation: 'Because B.',
};

const code: Question = {
  ...single,
  id: 'javascript-test-code',
  kind: 'code',
  language: 'javascript',
  prompt: 'Return 1',
  starter: 'export function solution() { return 0; }',
  tests: [{ name: 'one', args: [], expected: 1 }],
  solution: 'export function solution() { return 1; }',
};

function setup(question: Question, onNext = vi.fn()): { store: ReturnType<typeof createProgressStore>; onNext: typeof onNext } {
  const store = createProgressStore(null);
  const grader = createStaticGrader({
    runJs: (r) => executeSource(r.source, r.tests, r.language),
    runSql: async () => ({ status: 'error', columns: [], rows: [], error: 'not in test' }),
  });
  render(
    <MemoryRouter>
      <ThemeProvider>
        <ProgressProvider store={store}>
          <GraderProvider grader={grader}>
            <QuestionView question={question} onNext={onNext} />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
  return { store, onNext };
}

describe('QuestionView', () => {
  it('grades a single choice, shows the explanation and records progress', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText('Because B.')).toBeInTheDocument();
    expect(store.get('javascript-test-single')).toMatchObject({ attempts: 1, lastScore: 1 });
  });

  it('shows feedback for a wrong answer and lets the user continue', async () => {
    const user = userEvent.setup();
    const { onNext } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Correct answer: B')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('toggles the flag', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(screen.getByRole('button', { name: /flag/i }));
    expect(store.get('javascript-test-single')?.flagged).toBe(true);
  });

  it('runs a code exercise through the grader', async () => {
    const user = userEvent.setup();
    const { store } = setup(code);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/one: expected 1, got 0/)).toBeInTheDocument();
    expect(store.get('javascript-test-code')?.lastScore).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/question/QuestionView.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Write the kind components**

`src/components/question/SingleChoice.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, SingleQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = { question: SingleQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function SingleChoice({ question, disabled, onSubmit }: Props): JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={(event): void => {
        event.preventDefault();
        if (selected !== null) {
          onSubmit({ kind: 'single', optionId: selected });
        }
      }}
    >
      {question.options.map((option) => (
        <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
          <input type="radio" name={question.id} value={option.id} disabled={disabled} checked={selected === option.id} onChange={(): void => setSelected(option.id)} aria-label={option.text} className="mt-1" />
          <Markdown text={option.text} />
        </label>
      ))}
      <Button type="submit" disabled={disabled || selected === null}>Submit</Button>
    </form>
  );
}
```

`src/components/question/MultiChoice.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, MultiQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = { question: MultiQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function MultiChoice({ question, disabled, onSubmit }: Props): JSX.Element {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string): void => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <form
      className="space-y-2"
      onSubmit={(event): void => {
        event.preventDefault();
        onSubmit({ kind: 'multi', optionIds: selected });
      }}
    >
      {question.options.map((option) => (
        <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
          <input type="checkbox" value={option.id} disabled={disabled} checked={selected.includes(option.id)} onChange={(): void => toggle(option.id)} aria-label={option.text} className="mt-1" />
          <Markdown text={option.text} />
        </label>
      ))}
      <Button type="submit" disabled={disabled || selected.length === 0}>Submit</Button>
    </form>
  );
}
```

`src/components/question/PredictOutput.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, PredictQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = { question: PredictQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function PredictOutput({ question, disabled, onSubmit }: Props): JSX.Element {
  const [text, setText] = useState('');
  return (
    <div className="space-y-3">
      <CodeEditor value={question.code} onChange={(): void => undefined} language={question.language} readOnly ariaLabel="Program" />
      <label className="block text-sm">
        Expected output, one value per line
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          rows={5}
          value={text}
          disabled={disabled}
          onChange={(event): void => setText(event.target.value)}
        />
      </label>
      <Button disabled={disabled || text.trim().length === 0} onClick={(): void => onSubmit({ kind: 'predict', text })}>Submit</Button>
    </div>
  );
}
```

`src/components/question/CodeExercise.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, CodeQuestion, FixQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = { question: CodeQuestion | FixQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function CodeExercise({ question, disabled, onSubmit }: Props): JSX.Element {
  const [source, setSource] = useState(question.starter);
  return (
    <div className="space-y-3">
      <CodeEditor value={source} onChange={setSource} language={question.language} ariaLabel="Solution" />
      <ul className="text-sm text-zinc-600 dark:text-zinc-400">
        {question.tests.map((test) => (
          <li key={test.name}>Test: {test.name}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button disabled={disabled} onClick={(): void => onSubmit({ kind: 'code', source })}>Submit</Button>
        <Button variant="ghost" disabled={disabled} onClick={(): void => setSource(question.starter)}>Reset</Button>
      </div>
    </div>
  );
}
```

`src/components/question/SqlExercise.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, SqlQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = { question: SqlQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function SqlExercise({ question, disabled, onSubmit }: Props): JSX.Element {
  const [query, setQuery] = useState('');
  return (
    <div className="space-y-3">
      <details className="rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-800">
        <summary className="cursor-pointer">Schema and seed data</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{question.schema.trim()}</pre>
      </details>
      <CodeEditor value={query} onChange={setQuery} language="sql" ariaLabel="Query" />
      <Button disabled={disabled || query.trim().length === 0} onClick={(): void => onSubmit({ kind: 'sql', query })}>Submit</Button>
    </div>
  );
}
```

`src/components/question/OpenAnswer.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, OpenQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = { question: OpenQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function OpenAnswer({ question, disabled, onSubmit }: Props): JSX.Element {
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(question.rubric.map(() => false));

  return (
    <div className="space-y-3">
      <textarea
        className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        rows={6}
        placeholder="Say it out loud, then jot the key points here"
        value={draft}
        disabled={revealed}
        onChange={(event): void => setDraft(event.target.value)}
      />
      {!revealed ? (
        <Button onClick={(): void => setRevealed(true)}>Reveal model answer</Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border border-spice-500/40 bg-spice-50/40 p-3 dark:bg-spice-500/10">
            <Markdown text={question.modelAnswer} />
          </div>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Tick what you covered</legend>
            {question.rubric.map((item, i) => (
              <label key={item} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={checked[i] ?? false} disabled={disabled} onChange={(): void => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))} />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>
          <Button disabled={disabled} onClick={(): void => onSubmit({ kind: 'open', checked })}>Submit self-score</Button>
        </div>
      )}
    </div>
  );
}
```

`src/components/question/Feedback.tsx`:
```tsx
// packages
import type { JSX } from 'react';

// engine
import type { GradeResult } from '../../engine/grader';

const headline: Record<GradeResult['verdict'], string> = { pass: 'Correct', fail: 'Not yet', self: 'Self-scored' };
const tone: Record<GradeResult['verdict'], string> = {
  pass: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20',
  fail: 'border-red-500/50 bg-red-50 dark:bg-red-900/20',
  self: 'border-sky-500/50 bg-sky-50 dark:bg-sky-900/20',
};

export function Feedback({ result }: { result: GradeResult }): JSX.Element {
  return (
    <div className={`rounded-md border p-3 text-sm ${tone[result.verdict]}`} role="status">
      <p className="font-semibold">
        {headline[result.verdict]} · {Math.round(result.score * 100)}%
      </p>
      {result.feedback.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {result.feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {result.run !== undefined && result.run.logs.length > 0 && (
        <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-2 font-mono text-xs text-zinc-100">{result.run.logs.join('\n')}</pre>
      )}
      {result.sql !== undefined && result.sql.status === 'ok' && result.sql.rows.length > 0 && (
        <table className="mt-2 text-xs">
          <thead>
            <tr>{result.sql.columns.map((c) => <th key={c} className="border px-2 py-1 text-left">{c}</th>)}</tr>
          </thead>
          <tbody>
            {result.sql.rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} className="border px-2 py-1">{String(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write QuestionView**

`src/components/question/QuestionView.tsx`:
```tsx
// packages
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// engine
import type { Answer, Question } from '../../engine/question';
import type { GradeResult } from '../../engine/grader';

// contexts
import { useGrader } from '../../contexts/GraderContext';

// hooks
import { useProgress } from '../../hooks/useProgress';

// components
import { Markdown } from '../common/Markdown';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Feedback } from './Feedback';
import { SingleChoice } from './SingleChoice';
import { MultiChoice } from './MultiChoice';
import { PredictOutput } from './PredictOutput';
import { CodeExercise } from './CodeExercise';
import { SqlExercise } from './SqlExercise';
import { OpenAnswer } from './OpenAnswer';

type Props = { question: Question; onNext?: () => void; position?: { index: number; total: number } };

function AnswerArea({ question, disabled, onSubmit }: { question: Question; disabled: boolean; onSubmit: (a: Answer) => void }): JSX.Element {
  switch (question.kind) {
    case 'single':
      return <SingleChoice question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'multi':
      return <MultiChoice question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'predict':
      return <PredictOutput question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'code':
    case 'fix':
      return <CodeExercise question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'sql':
      return <SqlExercise question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'open':
      return <OpenAnswer question={question} disabled={disabled} onSubmit={onSubmit} />;
  }
}

export function QuestionView({ question, onNext, position }: Props): JSX.Element {
  const grader = useGrader();
  const { store, progress } = useProgress();
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const entry = progress[question.id];
  const flagged = entry?.flagged ?? false;

  useEffect(() => {
    setResult(null);
    setGrading(false);
  }, [question.id]);

  const submit = useCallback(
    async (answer: Answer): Promise<void> => {
      setGrading(true);
      try {
        const graded = await grader.grade(question, answer);
        setResult(graded);
        store.record(question.id, graded.score);
      } finally {
        setGrading(false);
      }
    },
    [grader, question, store],
  );

  const toggleFlag = useCallback((): void => store.setFlag(question.id, !flagged), [store, question.id, flagged]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target !== null && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
        return;
      }
      if (event.key === 'n' && result !== null && onNext !== undefined) {
        onNext();
      }
      if (event.key === 'f') {
        toggleFlag();
      }
    };
    window.addEventListener('keydown', onKey);
    return (): void => window.removeEventListener('keydown', onKey);
  }, [result, onNext, toggleFlag]);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {position !== undefined && <span>{position.index + 1} / {position.total}</span>}
        <Badge tone={question.level}>{question.level}</Badge>
        <Badge>{question.kind}</Badge>
        <Link to={`/browse/${question.domain}/${question.subject}`} className="underline">{question.subject} · {question.topic}</Link>
        <Link to={`/q/${question.id}`} className="ml-auto underline">permalink</Link>
        <Button variant="ghost" onClick={toggleFlag} aria-pressed={flagged}>{flagged ? 'Flagged' : 'Flag'}</Button>
      </div>
      <Markdown text={question.prompt} />
      <AnswerArea question={question} disabled={grading || result !== null} onSubmit={submit} />
      {grading && <p className="text-sm text-zinc-500">Grading…</p>}
      {result !== null && (
        <div className="space-y-3">
          <Feedback result={result} />
          <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Explanation</p>
            <Markdown text={question.explanation} />
          </div>
          {onNext !== undefined && <Button onClick={onNext}>Next (N)</Button>}
        </div>
      )}
      <label className="block text-xs text-zinc-500">
        Notes
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          rows={2}
          defaultValue={entry?.notes ?? ''}
          onBlur={(event): void => store.setNotes(question.id, event.target.value)}
        />
      </label>
    </Card>
  );
}
```

- [ ] **Step 5: Run the test, lint and build**

Run: `npx vitest run src/components/question && npm run lint`
Expected: 4 passing, lint clean. The `switch` in `AnswerArea` is exhaustive over the seven kinds; do not add a `default` branch, because a missing kind should be a compile error.

- [ ] **Step 6: Commit**

```bash
git add src/components/question
git commit -m "Add the question components and the grading flow

One component per question kind keeps each answer surface small; the
view owns grading, progress and keyboard shortcuts so pages only pass a
question and a next handler.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Browse pages and Home

**Files:**
- Modify: `src/pages/Home.tsx`, `src/pages/Browse.tsx`, `src/pages/BrowseDomain.tsx`, `src/pages/BrowseSubject.tsx`
- Create: `src/pages/Browse.test.tsx`

**Interfaces:**
- Consumes: `DOMAINS`, `findDomain`, `findSubject`, `useQuestionBank`, `useProgress`, `filterQuestions`, `summarize`, `countBy`, `Card`, `ProgressBar`, `Badge`.

- [ ] **Step 1: Write the failing test**

`src/pages/Browse.test.tsx`:
```tsx
// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from '../App';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <ProgressProvider>
        <GraderProvider>
          <RouterProvider router={router} />
        </GraderProvider>
      </ProgressProvider>
    </ThemeProvider>,
  );
}

describe('browse pages', () => {
  it('lists every domain with a count', () => {
    renderAt('/browse');
    expect(screen.getByRole('link', { name: /languages/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /databases/i })).toBeInTheDocument();
  });

  it('lists the subjects of a domain', () => {
    renderAt('/browse/languages');
    expect(screen.getByRole('link', { name: /javascript/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /typescript/i })).toBeInTheDocument();
  });

  it('lists the questions of a subject with a drill link', () => {
    renderAt('/browse/languages/javascript');
    expect(screen.getAllByRole('link', { name: /drill/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/event loop/i)).toBeInTheDocument();
  });

  it('shows not found for an unknown domain', () => {
    renderAt('/browse/nope');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/pages/Browse.test.tsx`
Expected: FAIL (stubs render only headings).

- [ ] **Step 3: Implement the pages**

`src/pages/Browse.tsx`:
```tsx
// packages
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { DOMAINS } from '../content/taxonomy';

// engine
import { filterQuestions, summarize } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Card } from '../components/primitives/Card';
import { ProgressBar } from '../components/primitives/ProgressBar';

export function Browse(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Browse</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((domain) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id }), progress);
          return (
            <Link key={domain.id} to={`/browse/${domain.id}`} aria-label={`${domain.name}, ${summary.total} questions`}>
              <Card className="h-full space-y-2 hover:border-spice-500">
                <p className="text-lg font-medium">{domain.name}</p>
                <p className="text-sm text-zinc-500">{domain.blurb}</p>
                <p className="text-xs text-zinc-500">{summary.total} questions · {summary.attempted} attempted</p>
                <ProgressBar value={summary.mastery} label={`${domain.name} mastery`} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

`src/pages/BrowseDomain.tsx`:
```tsx
// packages
import { Link, useParams } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { findDomain } from '../content/taxonomy';

// engine
import { filterQuestions, summarize } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Card } from '../components/primitives/Card';
import { ProgressBar } from '../components/primitives/ProgressBar';

export function BrowseDomain(): JSX.Element {
  const { domain: domainId = '' } = useParams();
  const domain = findDomain(domainId);
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  if (domain === undefined) {
    return <p>Domain not found.</p>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500"><Link to="/browse" className="underline">Browse</Link> / {domain.name}</p>
      <h1 className="text-2xl font-semibold">{domain.name}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {domain.subjects.map((subject) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id, subject: subject.id }), progress);
          return (
            <Link key={subject.id} to={`/browse/${domain.id}/${subject.id}`} aria-label={`${subject.name}, ${summary.total} questions`}>
              <Card className="h-full space-y-2 hover:border-spice-500">
                <p className="font-medium">{subject.name}</p>
                <p className="text-xs text-zinc-500">{summary.total} questions · {summary.unattempted} unseen · {summary.flagged} flagged</p>
                <ProgressBar value={summary.mastery} label={`${subject.name} mastery`} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

`src/pages/BrowseSubject.tsx`:
```tsx
// packages
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { findDomain, findSubject } from '../content/taxonomy';

// engine
import { filterQuestions } from '../engine/registry';
import { KINDS, LEVELS } from '../engine/question';
import type { Kind, Level } from '../engine/question';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Badge } from '../components/primitives/Badge';
import { Card } from '../components/primitives/Card';

export function BrowseSubject(): JSX.Element {
  const { domain: domainId = '', subject: subjectId = '' } = useParams();
  const domain = findDomain(domainId);
  const subject = findSubject(domainId, subjectId);
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [levels, setLevels] = useState<Level[]>([...LEVELS]);
  const [kinds, setKinds] = useState<Kind[]>([...KINDS]);

  if (domain === undefined || subject === undefined) {
    return <p>Subject not found.</p>;
  }

  const questions = filterQuestions(list, { domain: domain.id, subject: subject.id, levels, kinds });
  const drillParams = new URLSearchParams({ domain: domain.id, subject: subject.id, level: levels.join(','), kind: kinds.join(',') });

  const toggle = <T extends string>(value: T, current: T[], set: (next: T[]) => void): void =>
    set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        <Link to="/browse" className="underline">Browse</Link> / <Link to={`/browse/${domain.id}`} className="underline">{domain.name}</Link> / {subject.name}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{subject.name}</h1>
        <Link to={`/drill?${drillParams.toString()}`} className="ml-auto rounded-md bg-spice-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-spice-600">Drill these {questions.length}</Link>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {LEVELS.map((level) => (
          <label key={level} className="flex items-center gap-1"><input type="checkbox" checked={levels.includes(level)} onChange={(): void => toggle(level, levels, setLevels)} />{level}</label>
        ))}
        <span className="mx-2 text-zinc-400">|</span>
        {KINDS.map((kind) => (
          <label key={kind} className="flex items-center gap-1"><input type="checkbox" checked={kinds.includes(kind)} onChange={(): void => toggle(kind, kinds, setKinds)} />{kind}</label>
        ))}
      </div>
      {subject.topics.map((topic) => {
        const own = questions.filter((q) => q.topic === topic.id);
        if (own.length === 0) {
          return null;
        }
        return (
          <section key={topic.id} className="space-y-2">
            <h2 className="text-lg font-medium">{topic.name}</h2>
            {own.map((q) => {
              const entry = progress[q.id];
              return (
                <Card key={q.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={q.level}>{q.level}</Badge>
                  <Badge>{q.kind}</Badge>
                  <Link to={`/q/${q.id}`} className="underline">{q.prompt.split('\n')[0]?.slice(0, 90)}</Link>
                  <span className="ml-auto text-xs text-zinc-500">
                    {entry === undefined || entry.attempts === 0 ? 'unseen' : `${Math.round(entry.lastScore * 100)}% · ${entry.attempts}x`}
                    {entry?.flagged === true ? ' · flagged' : ''}
                  </span>
                </Card>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
```

`src/pages/Home.tsx`:
```tsx
// packages
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { DOMAINS } from '../content/taxonomy';

// engine
import { filterQuestions, summarize } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';

// components
import { Card } from '../components/primitives/Card';
import { ProgressBar } from '../components/primitives/ProgressBar';

export function Home(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const overall = summarize(list, progress);
  const missed = list.filter((q) => (progress[q.id]?.attempts ?? 0) > 0 && (progress[q.id]?.lastScore ?? 1) < 1).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Engineer Mentat Academy</h1>
        <p className="text-zinc-500">Train like a Mentat: {overall.total} questions, {overall.attempted} attempted, {missed} to revisit.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/drill?unseen=1" className="rounded-md bg-spice-500 px-4 py-2 text-sm font-medium text-white hover:bg-spice-600">Drill unseen</Link>
        <Link to="/mock" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">Mock interview</Link>
        <Link to="/review" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">Review missed ({missed})</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((domain) => {
          const summary = summarize(filterQuestions(list, { domain: domain.id }), progress);
          return (
            <Card key={domain.id} className="space-y-1">
              <Link to={`/browse/${domain.id}`} className="font-medium underline">{domain.name}</Link>
              <p className="text-xs text-zinc-500">{summary.attempted}/{summary.total} attempted</p>
              <ProgressBar value={summary.mastery} label={`${domain.name} mastery`} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test, lint and full suite**

Run: `npx vitest run && npm run lint`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "Add the browse pages and the home summary

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Drill and the single-question page

**Files:**
- Modify: `src/pages/Drill.tsx`, `src/pages/QuestionPage.tsx`
- Create: `src/pages/Drill.test.tsx`, `src/hooks/useDrillQueue.ts`

**Interfaces:**
- Produces: `parseDrillFilter(params: URLSearchParams, progress: ProgressMap): QuestionFilter & { unseen: boolean }`; `useDrillQueue(questions: Question[]): { current: Question | undefined; index: number; total: number; next(): void; done: boolean }`.

- [ ] **Step 1: Write the failing test**

`src/pages/Drill.test.tsx`:
```tsx
// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from '../App';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

// pages
import { parseDrillFilter } from './Drill';

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <ProgressProvider>
        <GraderProvider>
          <RouterProvider router={router} />
        </GraderProvider>
      </ProgressProvider>
    </ThemeProvider>,
  );
}

describe('parseDrillFilter', () => {
  it('reads domain, subject, topic, comma lists and unseen', () => {
    const params = new URLSearchParams('domain=languages&subject=javascript&topic=closures&level=mid,senior&kind=code,fix&unseen=1');
    expect(parseDrillFilter(params)).toEqual({ domain: 'languages', subject: 'javascript', topic: 'closures', levels: ['mid', 'senior'], kinds: ['code', 'fix'], unseen: true });
  });

  it('ignores unknown levels and kinds', () => {
    expect(parseDrillFilter(new URLSearchParams('level=god&kind=essay'))).toEqual({ unseen: false });
  });
});

describe('Drill page', () => {
  it('shows the first question and the position', () => {
    renderAt('/drill?subject=javascript');
    expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('explains when nothing matches', () => {
    renderAt('/drill?subject=nothing');
    expect(screen.getByText(/no questions match/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/pages/Drill.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the queue hook and the pages**

`src/hooks/useDrillQueue.ts`:
```ts
// packages
import { useCallback, useEffect, useState } from 'react';

// engine
import type { Question } from '../engine/question';

export function useDrillQueue(questions: Question[]): { current: Question | undefined; index: number; total: number; next: () => void; done: boolean } {
  const [index, setIndex] = useState(0);
  const key = questions.map((q) => q.id).join('|');
  useEffect(() => {
    setIndex(0);
  }, [key]);
  const next = useCallback((): void => setIndex((i) => i + 1), []);
  return { current: questions[index], index, total: questions.length, next, done: questions.length > 0 && index >= questions.length };
}
```

`src/pages/Drill.tsx`:
```tsx
// packages
import { useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { JSX } from 'react';

// engine
import { filterQuestions } from '../engine/registry';
import { KINDS, LEVELS } from '../engine/question';
import { shuffle } from '../engine/session';
import type { Kind, Level } from '../engine/question';
import type { QuestionFilter } from '../engine/registry';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Button } from '../components/primitives/Button';

export type DrillFilter = QuestionFilter & { unseen: boolean };

function list<T extends string>(raw: string | null, allowed: readonly T[]): T[] | undefined {
  if (raw === null) {
    return undefined;
  }
  const values = raw.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));
  return values.length === 0 ? undefined : values;
}

export function parseDrillFilter(params: URLSearchParams): DrillFilter {
  const filter: DrillFilter = { unseen: params.get('unseen') === '1' };
  const domain = params.get('domain');
  const subject = params.get('subject');
  const topic = params.get('topic');
  const levels = list<Level>(params.get('level'), LEVELS);
  const kinds = list<Kind>(params.get('kind'), KINDS);
  if (domain !== null) filter.domain = domain;
  if (subject !== null) filter.subject = subject;
  if (topic !== null) filter.topic = topic;
  if (levels !== undefined) filter.levels = levels;
  if (kinds !== undefined) filter.kinds = kinds;
  return filter;
}

export function Drill(): JSX.Element {
  const [params] = useSearchParams();
  const { list: bank } = useQuestionBank();
  const { progress } = useProgress();
  const filter = useMemo(() => parseDrillFilter(params), [params]);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  // The queue is computed once per filter; reading progress through a ref keeps answering from reshuffling it.
  const questions = useMemo(() => {
    const matched = filterQuestions(bank, filter);
    const pool = filter.unseen ? matched.filter((q) => (progressRef.current[q.id]?.attempts ?? 0) === 0) : matched;
    return shuffle(pool);
  }, [bank, filter]);
  const queue = useDrillQueue(questions);

  if (questions.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Drill</h1>
        <p>No questions match this filter.</p>
        <Link to="/browse" className="underline">Pick a subject</Link>
      </div>
    );
  }
  if (queue.done || queue.current === undefined) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Drill complete</h1>
        <p>You went through {queue.total} questions.</p>
        <div className="flex gap-2">
          <Link to="/review"><Button>Review misses</Button></Link>
          <Link to="/browse"><Button variant="ghost">Browse</Button></Link>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Drill</h1>
      <QuestionView key={queue.current.id} question={queue.current} onNext={queue.next} position={{ index: queue.index, total: queue.total }} />
    </div>
  );
}
```

`src/pages/QuestionPage.tsx`:
```tsx
// packages
import { Link, useParams } from 'react-router-dom';
import type { JSX } from 'react';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';

// components
import { QuestionView } from '../components/question/QuestionView';

export function QuestionPage(): JSX.Element {
  const { id = '' } = useParams();
  const { byId } = useQuestionBank();
  const question = byId.get(id);
  if (question === undefined) {
    return <p>Question not found. <Link to="/browse" className="underline">Browse</Link></p>;
  }
  return <QuestionView key={question.id} question={question} />;
}
```

- [ ] **Step 4: Run the tests, lint and build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 5: Manual check**

Run `npm run dev`, open `http://localhost:5173/engineer-mentat-academy/drill?subject=javascript`, answer the `fix` question with `firstSubject.greet.call(secondSubject)`, confirm "Correct · 100%" and that the worker chunk loads (Network tab). Then submit `while(true){}` in a code question and confirm "Timed out after 3000 ms" within about three seconds and the page stays responsive.

- [ ] **Step 6: Commit**

```bash
git add src/pages src/hooks/useDrillQueue.ts
git commit -m "Add the drill flow and the single-question page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Review and Settings

**Files:**
- Modify: `src/pages/Review.tsx`, `src/pages/Settings.tsx`
- Create: `src/pages/Settings.test.tsx`

**Interfaces:**
- Consumes: `useProgress`, `useQuestionBank`, `QuestionView`, `useDrillQueue`.
- Produces: Review lists missed (lastScore < 1) and flagged questions, oldest miss first, and drills them in place. Settings offers export (download JSON), import (file input), reset (with confirm), and a disabled "Claude grader" toggle with explanatory text.

- [ ] **Step 1: Write the failing Settings test**

`src/pages/Settings.test.tsx`:
```tsx
// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Settings } from './Settings';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';

describe('Settings', () => {
  it('imports a progress file', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    render(
      <MemoryRouter>
        <ProgressProvider store={store}>
          <Settings />
        </ProgressProvider>
      </MemoryRouter>,
    );
    const file = new File([JSON.stringify({ q1: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' } })], 'progress.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import progress/i), file);
    expect(await screen.findByText(/imported 1/i)).toBeInTheDocument();
    expect(store.get('q1')?.attempts).toBe(1);
  });

  it('reports an invalid import', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProgressProvider store={createProgressStore(null)}>
          <Settings />
        </ProgressProvider>
      </MemoryRouter>,
    );
    await user.upload(screen.getByLabelText(/import progress/i), new File(['[1]'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByText(/not a progress map/i)).toBeInTheDocument();
  });

  it('shows the AI grader as coming later', () => {
    render(
      <MemoryRouter>
        <ProgressProvider store={createProgressStore(null)}>
          <Settings />
        </ProgressProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('checkbox', { name: /claude grader/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/pages/Settings.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Settings**

`src/pages/Settings.tsx`:
```tsx
// packages
import { useState } from 'react';
import type { ChangeEvent, JSX } from 'react';

// hooks
import { useProgress } from '../hooks/useProgress';

// components
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

export function Settings(): JSX.Element {
  const { store, progress } = useProgress();
  const [message, setMessage] = useState<string | null>(null);

  const exportProgress = (): void => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mentat-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }
    try {
      const text = await file.text();
      store.importJson(text);
      setMessage(`Imported ${Object.keys(store.all()).length} question record(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  const reset = (): void => {
    if (window.confirm('Delete all local progress? This cannot be undone.')) {
      store.reset();
      setMessage('Progress cleared.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="space-y-3">
        <h2 className="font-medium">Progress</h2>
        <p className="text-sm text-zinc-500">{Object.keys(progress).length} question record(s) stored in this browser only.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportProgress}>Export JSON</Button>
          <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700">
            Import progress
            <input type="file" accept="application/json" className="sr-only" aria-label="Import progress" onChange={(e): void => void importProgress(e)} />
          </label>
          <Button variant="danger" onClick={reset}>Reset</Button>
        </div>
        {message !== null && <p className="text-sm" role="status">{message}</p>}
      </Card>
      <Card className="space-y-2">
        <h2 className="font-medium">Grading</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled aria-label="Claude grader" />
          Claude grader (coming later)
        </label>
        <p className="text-sm text-zinc-500">
          Open questions are self-scored today. A future grader will send the question, rubric and your answer to Claude with a key you paste here; the key will be held in memory only.
        </p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Implement Review**

`src/pages/Review.tsx`:
```tsx
// packages
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Badge } from '../components/primitives/Badge';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

export function Review(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [drilling, setDrilling] = useState(false);
  const [snapshot, setSnapshot] = useState(progress);

  const source = drilling ? snapshot : progress;
  const queue = useMemo(
    () =>
      list
        .filter((q) => {
          const entry = source[q.id];
          return entry !== undefined && (entry.flagged || (entry.attempts > 0 && entry.lastScore < 1));
        })
        .sort((a, b) => (source[a.id]?.lastAt ?? '').localeCompare(source[b.id]?.lastAt ?? '')),
    [list, source],
  );
  const drill = useDrillQueue(drilling ? queue : []);

  if (drilling && drill.current !== undefined && !drill.done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Review</h1>
        <QuestionView key={drill.current.id} question={drill.current} onNext={drill.next} position={{ index: drill.index, total: drill.total }} />
      </div>
    );
  }
  if (drilling && drill.done) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Review complete</h1>
        <Button onClick={(): void => setDrilling(false)}>Back to the list</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Review</h1>
        <Button className="ml-auto" disabled={queue.length === 0} onClick={(): void => { setSnapshot(progress); setDrilling(true); }}>Drill all {queue.length}</Button>
      </div>
      {queue.length === 0 && <p>Nothing to review. Missed and flagged questions land here.</p>}
      {queue.map((q) => {
        const entry = progress[q.id];
        return (
          <Card key={q.id} className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={q.level}>{q.level}</Badge>
            <Badge>{q.kind}</Badge>
            <Link to={`/q/${q.id}`} className="underline">{q.prompt.split('\n')[0]?.slice(0, 90)}</Link>
            <span className="ml-auto text-xs text-zinc-500">
              {(entry?.attempts ?? 0) > 0 ? `${Math.round((entry?.lastScore ?? 0) * 100)}%` : 'unattempted'}{entry?.flagged === true ? ' · flagged' : ''}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run tests, lint and build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/pages
git commit -m "Add the review queue and the settings page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Mock interview

**Files:**
- Modify: `src/pages/Mock.tsx`
- Create: `src/pages/Mock.test.tsx`, `src/hooks/useCountdown.ts`

**Interfaces:**
- Consumes: `pickMock`, `MockOptions`, `DOMAINS`, `LEVELS`, `useDrillQueue`, `QuestionView`, `useProgress`.
- Produces: `useCountdown(seconds: number, running: boolean): { remaining: number; expired: boolean }`; Mock has three phases: setup, session, results.

- [ ] **Step 1: Write the failing test**

`src/pages/Mock.test.tsx`:
```tsx
// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Mock } from './Mock';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';

function setup(): void {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <ProgressProvider store={createProgressStore(null)}>
          <GraderProvider>
            <Mock />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Mock', () => {
  it('starts a session with the chosen count and shows a timer', async () => {
    const user = userEvent.setup();
    setup();
    await user.clear(screen.getByLabelText(/questions/i));
    await user.type(screen.getByLabelText(/questions/i), '2');
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText(/\d+:\d\d/)).toBeInTheDocument();
  });

  it('refuses to start with no level selected', async () => {
    const user = userEvent.setup();
    setup();
    for (const level of ['junior', 'mid', 'senior']) {
      await user.click(screen.getByLabelText(level));
    }
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/pages/Mock.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the countdown hook and the page**

`src/hooks/useCountdown.ts`:
```ts
// packages
import { useEffect, useState } from 'react';

export function useCountdown(seconds: number, running: boolean): { remaining: number; expired: boolean } {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);
  useEffect(() => {
    if (!running || remaining <= 0) {
      return;
    }
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return (): void => clearInterval(id);
  }, [running, remaining]);
  return { remaining, expired: remaining <= 0 };
}
```

`src/pages/Mock.tsx`:
```tsx
// packages
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { JSX } from 'react';

// content
import { DOMAINS } from '../content/taxonomy';

// engine
import { LEVELS } from '../engine/question';
import { pickMock } from '../engine/session';
import type { Level, Question } from '../engine/question';

// hooks
import { useQuestionBank } from '../hooks/useQuestionBank';
import { useProgress } from '../hooks/useProgress';
import { useDrillQueue } from '../hooks/useDrillQueue';
import { useCountdown } from '../hooks/useCountdown';

// components
import { QuestionView } from '../components/question/QuestionView';
import { Button } from '../components/primitives/Button';
import { Card } from '../components/primitives/Card';

type Phase = 'setup' | 'session' | 'results';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function Session({ questions, minutes, onFinish }: { questions: Question[]; minutes: number; onFinish: () => void }): JSX.Element {
  const queue = useDrillQueue(questions);
  const { remaining, expired } = useCountdown(minutes * 60, !queue.done);
  if (queue.done || expired || queue.current === undefined) {
    return (
      <div className="space-y-3">
        <p>{expired ? 'Time is up.' : 'All questions answered.'}</p>
        <Button onClick={onFinish}>See results</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className={`font-mono text-lg ${remaining < 60 ? 'text-red-500' : ''}`} aria-live="polite">{formatClock(remaining)}</p>
      <QuestionView key={queue.current.id} question={queue.current} onNext={queue.next} position={{ index: queue.index, total: queue.total }} />
    </div>
  );
}

export function Mock(): JSX.Element {
  const { list } = useQuestionBank();
  const { progress } = useProgress();
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(30);
  const [levels, setLevels] = useState<Level[]>(['mid', 'senior']);
  const [domains, setDomains] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const toggle = <T extends string>(value: T, current: T[], set: (next: T[]) => void): void =>
    set(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  const results = useMemo(
    () => questions.map((q) => ({ question: q, score: progress[q.id]?.lastScore ?? 0, attempted: (progress[q.id]?.attempts ?? 0) > 0 })),
    [questions, progress],
  );

  if (phase === 'session') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Mock interview</h1>
        <Session questions={questions} minutes={minutes} onFinish={(): void => setPhase('results')} />
      </div>
    );
  }
  if (phase === 'results') {
    const answered = results.filter((r) => r.attempted);
    const mean = answered.length === 0 ? 0 : answered.reduce((s, r) => s + r.score, 0) / answered.length;
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Results</h1>
        <p>{answered.length} of {results.length} answered · average {Math.round(mean * 100)}%</p>
        {results.map((r) => (
          <Card key={r.question.id} className="flex items-center gap-2 text-sm">
            <Link to={`/q/${r.question.id}`} className="underline">{r.question.prompt.split('\n')[0]?.slice(0, 90)}</Link>
            <span className="ml-auto">{r.attempted ? `${Math.round(r.score * 100)}%` : 'skipped'}</span>
          </Card>
        ))}
        <Button onClick={(): void => setPhase('setup')}>New mock</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mock interview</h1>
      <Card className="space-y-3">
        <label className="block text-sm">
          Questions
          <input type="number" min={1} max={50} value={count} onChange={(e): void => setCount(Number(e.target.value))} className="ml-2 w-20 rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" aria-label="Questions" />
        </label>
        <label className="block text-sm">
          Minutes
          <input type="number" min={5} max={180} value={minutes} onChange={(e): void => setMinutes(Number(e.target.value))} className="ml-2 w-20 rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" aria-label="Minutes" />
        </label>
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="mb-1">Levels</legend>
          {LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-1"><input type="checkbox" checked={levels.includes(level)} onChange={(): void => toggle(level, levels, setLevels)} aria-label={level} />{level}</label>
          ))}
        </fieldset>
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="mb-1">Domains (none selected means all)</legend>
          {DOMAINS.map((domain) => (
            <label key={domain.id} className="flex items-center gap-1"><input type="checkbox" checked={domains.includes(domain.id)} onChange={(): void => toggle(domain.id, domains, setDomains)} />{domain.name}</label>
          ))}
        </fieldset>
        <Button
          disabled={levels.length === 0 || count < 1}
          onClick={(): void => {
            setQuestions(pickMock(list, { count, levels, domains }));
            setPhase('session');
          }}
        >
          Start
        </Button>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, lint and build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Mock.tsx src/pages/Mock.test.tsx src/hooks/useCountdown.ts
git commit -m "Add the timed mock interview mode

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Deploy workflow, README and end-to-end verification

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test with coverage gate
        run: npm run test:coverage
      - name: Build
        run: npm run build
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Write the README**

`README.md`:
```markdown
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
- **Review**: everything you missed or flagged.

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
```

- [ ] **Step 3: Run the full gate locally**

Run: `npm run lint && npm run test:coverage && npm run build && npm run preview`
Expected: coverage thresholds met on `src/engine`; preview serves `http://localhost:4173/engineer-mentat-academy/`. Open it, navigate to `/engineer-mentat-academy/browse/databases/sql`, open a SQL question, run the reference query, confirm rows render and the wasm file loads only then. Reload on a deep link and confirm no 404 (`404.html` fallback).

If coverage is below threshold, the usual culprits are `registry.ts`'s `loadQuestions` (covered by the content test) and `runJs.ts`'s `createRunnerWorker` (browser only). Add `/* v8 ignore next */` above `createRunnerWorker` only; do not lower thresholds.

- [ ] **Step 4: Commit**

```bash
git add .github README.md
git commit -m "Add the Pages deploy workflow and the README

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Do not push. Jose pushes after his own test pass; the workflow then deploys `main`.

---

### Task 15: Content generation (day 2)

**Files:**
- Create: `src/content/languages/typescript.ts`, `src/content/libraries/{react,redux,react-router,react-testing-library,typeorm,prisma}.ts`, `src/content/frameworks/{express,nestjs,nextjs}.ts`, `src/content/runtimes/nodejs.ts`, `src/content/apis/{rest,graphql,api-design,api-security}.ts`, `src/content/architecture/{design-patterns,solid,clean-code,architecture-patterns,distributed-systems}.ts`, `src/content/databases/{nosql,dynamodb,rds}.ts`, `src/content/cloud/{aws,containers,iac,serverless,cicd}.ts`, `src/content/practices/{testing,security,operations,ai-assisted-development}.ts`
- Modify: `src/content/languages/javascript.ts` (append), `src/content/databases/sql.ts` (append)

**Interfaces:**
- Consumes: the schema in `src/engine/question.ts`, the taxonomy, the content test.
- Produces: roughly 250 questions; `npm test` green.

- [ ] **Step 1: Dispatch one subagent per domain, in parallel**

Each subagent receives this brief (fill the domain, the file list, and paste the relevant reference material):

```
You are writing interview questions for Engineer Mentat Academy, a TypeScript question bank.

Write the file(s) <files> in /mnt/media/Sources/GitHub/Personal/engineer-mentat-academy.
Each file exports `export const questions: Question[]` and imports the type with
`import type { Question } from '../../engine/question';` under a `// engine` comment.

Read first: src/engine/question.ts (the schema), src/content/taxonomy.ts (valid
domain/subject/topic ids), src/content/languages/javascript.ts (style reference).

Targets for <domain>: <N> questions per subject, spread across levels
(about 25% junior, 40% mid, 35% senior) and kinds. Use `code`/`fix`/`predict`
wherever the topic is executable in plain JS/TS with no imports (no React runtime, no
Node APIs, no fetch). Use `sql` for SQL topics only. Use `open` for design and
trade-off questions and give every `open` a 3-5 bullet rubric of concrete points an
interviewer listens for. Use `single`/`multi` for facts and pitfalls; make distractors
plausible, never silly.

Rules the content test enforces (npm test will fail otherwise):
- ids are kebab-case and start with "<subject>-"; unique across the whole bank.
- domain/subject/topic must exist in taxonomy.ts.
- code/fix: `solution` must pass every test; `starter` must NOT pass; export a function
  named `solution`; tests call `solution(...args)` and compare with deepEqual.
- predict: the `code` is executed and its console output must equal `answer` exactly,
  one console call per line; keep predict programs synchronous or microtask-only
  (the test settles for 50 ms, so `setTimeout(fn, 0)` is captured but long timers are not).
- sql: `answer` is run against `schema` in SQLite; `expectedRows` are the exact rows
  (numbers as numbers, text as strings); set `ordered: true` only when the prompt
  requires an ORDER BY.
- every question has an `explanation`; senior ones include a line starting with
  "**Say this out loud:**" giving the phrasing an interviewer wants to hear.
- tag with `core-25` when derived from the classic 25 senior JavaScript questions below.

Reference material: <paste the Notion deep-dive sections for this domain and the
relevant items from the classic 25 senior JavaScript questions>.

When done, run `npx vitest run src/content/content.test.ts` and fix every failure
before reporting. Report the count per subject and per kind.
```

Domain assignments and targets:

| Subagent | Files | Target |
| --- | --- | --- |
| languages | javascript (append to 30 total), typescript (20) | 42 new |
| libraries | react 20, redux 6, react-router 5, react-testing-library 6, typeorm 5, prisma 5 | 47 |
| frameworks | express 8, nestjs 8, nextjs 8 | 24 |
| runtimes | nodejs 20 | 20 |
| apis | rest 8, graphql 6, api-design 8, api-security 8 | 30 |
| architecture | design-patterns 10, solid 8, clean-code 5, architecture-patterns 8, distributed-systems 12 | 43 |
| databases | sql (append to 15), nosql 6, dynamodb 6, rds 4 | 29 new |
| cloud | aws 16, containers 6, iac 8, serverless 6, cicd 5 | 41 |
| practices | testing 10, security 8, operations 8, ai-assisted-development 4 | 30 |

- [ ] **Step 2: Run the whole suite after all subagents report**

Run: `npx vitest run && npm run lint && npm run build`
Expected: green. Fix any duplicate ids across files (two subagents may pick the same slug) by renaming the later one.

- [ ] **Step 3: Review the classic-25 coverage**

Run: `grep -o "core-25" src/content/*/*.ts | wc -l`
Expected: at least 25. Cross-check against the classic 25 questions (async handling, == vs ===, closures, null vs undefined, event loop, let/const/var, prototypal inheritance, this, hoisting, method vs function, promises, sync vs async, event delegation, Array.map, functional programming, arrow vs regular functions, destructuring, spread, memoization, static vs instance methods, data binding, expression vs statement, immutability, strict mode, Set). Each must have at least one question; add any missing ones by hand.

- [ ] **Step 4: Commit per domain**

```bash
git add src/content/<domain>
git commit -m "Add the <domain> question bank

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec coverage: §2 taxonomy and schema (Task 2), §3 runners (Tasks 4, 5), §4 grader seam (Task 6, Settings copy in Task 12), §5 navigation (Tasks 8 to 13), §6 progress (Task 3, Settings), §7 pipeline (Task 7, Task 15), §8 tooling and deploy (Tasks 1, 14), §9 testing (each task; coverage gate in Task 1 config and Task 14 CI), §10 cut lines (Mock is Task 13, SQL is Task 5, import/export is Task 12, `/q/:id` is Task 11: all cuttable independently).
- Type consistency: `Answer` for `fix` is `{ kind: 'code' }` everywhere (schema note, grader, CodeExercise). `RunRequest` carries an optional `settleMs` that only the content test uses. `Summary` fields used by Browse, BrowseDomain and Home match `registry.ts`.
