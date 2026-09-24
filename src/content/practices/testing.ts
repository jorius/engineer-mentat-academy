// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'testing-strategies-pyramid-vs-trophy',
    domain: 'practices',
    subject: 'testing',
    topic: 'strategies',
    level: 'senior',
    kind: 'open',
    prompt:
      'You join a team whose React + Node product has 2,000 unit tests, almost no integration tests, and a flaky 40-minute Cypress suite. Production bugs keep slipping through at the seams between modules. **Test pyramid or testing trophy: which shape do you steer the team towards, and how do you get there?**',
    modelAnswer:
      'The pyramid (many unit, fewer integration, few E2E) optimises for speed and isolation; the trophy (static analysis at the base, a thick middle of integration tests, fewer unit and E2E) optimises for confidence per test, which is what this team lacks, so I steer the team towards the trophy. Bugs at the seams mean the unit tests mock exactly the boundaries that are breaking, so I would shift weight to integration tests: components rendered with React Testing Library against a mocked network layer (MSW), and API tests that hit real routes with a real database in a container. TypeScript strict mode and ESLint form the static base and catch a whole class of bugs for free. The E2E suite gets cut down to a handful of critical journeys (sign-up, checkout) and its flakiness fixed or quarantined, not retried. Unit tests stay where logic is dense and pure: pricing rules, parsers, reducers. I would measure the change by escaped defects and suite time, not coverage percentage. The shape is a means; the goal is the most confidence per minute of CI.',
    rubric: [
      'Explains both shapes and what each optimises for (speed and isolation vs confidence)',
      'Diagnoses that over-mocked unit tests miss integration bugs at the seams',
      'Proposes concrete integration tooling (RTL + MSW, API tests with a real DB or containers)',
      'Shrinks E2E to critical paths and treats flakiness as a bug rather than retrying',
      'Measures outcome by escaped defects or confidence, not raw coverage',
    ],
    tags: ['test-pyramid', 'testing-trophy', 'strategy'],
    source: 'topic-list',
    explanation:
      'Neither shape is dogma. The pyramid comes from an era of slow UI tests; the trophy (Kent C. Dodds) reflects that modern integration tests are cheap enough to be the bulk of the suite. The senior move is diagnosing where confidence is missing and moving test effort there.\n\n**Say this out loud:** "I optimise for confidence per minute of CI: static types at the base, integration tests as the bulk because that is where our bugs live, unit tests for dense pure logic, and a thin layer of E2E for the journeys that make money."',
    hint:
      'Compare what each shape optimises for and match it to where this team\'s bugs actually appear; a strong answer also covers tooling, the E2E suite and how you would measure success.',
  },
  {
    id: 'testing-strategies-what-to-mock',
    domain: 'practices',
    subject: 'testing',
    topic: 'strategies',
    level: 'mid',
    kind: 'multi',
    prompt:
      'You are unit testing `OrderService.placeOrder()`. It calls a pure `calculateTax()` helper from the same module, a private `#buildLineItems()` method, `Date.now()` to stamp the order, and a third-party `StripeClient` to charge the card. Which collaborators are good candidates for a test double? Select all that apply.',
    options: [
      { id: 'a', text: 'The third-party `StripeClient`' },
      { id: 'b', text: 'The clock (`Date.now()`), via an injected clock or fake timers' },
      { id: 'c', text: 'The pure `calculateTax()` helper' },
      { id: 'd', text: 'The private `#buildLineItems()` method, by spying on it' },
    ],
    answer: ['a', 'b'],
    tags: ['mocking', 'test-doubles'],
    source: 'topic-list',
    explanation:
      'Mock what is **slow, non-deterministic, or outside your control**: network calls to third parties and the clock. Do not mock pure code you own: `calculateTax()` is fast and deterministic, and mocking it means the test no longer checks that tax is actually applied. Spying on private methods couples the test to the internal structure, so a harmless refactor breaks it; with a real `#private` method it is not even possible, because `#buildLineItems` is not a property that `vi.spyOn` / `jest.spyOn` can replace. A useful rule: mock at the boundaries of the system (network, time, randomness, filesystem), not between your own units.',
    hint:
      'Ask which collaborators are slow, non-deterministic or outside your control, and which are your own code that the test should really exercise.',
  },
  {
    id: 'testing-unit-test-doubles',
    domain: 'practices',
    subject: 'testing',
    topic: 'unit',
    level: 'junior',
    kind: 'single',
    prompt:
      '```ts\nconst send = vi.fn().mockResolvedValue({ ok: true });\nawait notifyUser(user, { send });\nexpect(send).toHaveBeenCalledWith(user.email, expect.stringContaining(\'Welcome\'));\n```\nWhat kind of test double is `send`, and what is the test verifying?',
    options: [
      { id: 'a', text: 'A stub: it only returns canned data, and the test checks the return value of `notifyUser`' },
      { id: 'b', text: 'A mock function (Vitest and Jest vocabulary; Meszaros calls this a test spy): it returns canned data **and** records calls, and the test verifies the interaction (who was called with what)' },
      { id: 'c', text: 'A fake: a working lightweight implementation, like an in-memory email server' },
      { id: 'd', text: 'A `vi.spyOn` wrapper around the real email client: the real email is still sent' },
    ],
    answer: 'b',
    tags: ['test-doubles', 'mocks', 'vitest'],
    source: 'topic-list',
    explanation:
      'Stubs provide canned answers so the code under test can run; fakes are working simplified implementations (an in-memory repository); `vi.spyOn` / `jest.spyOn` wrap a real method, record calls and by default still call through, which is not the case here because `send` is a standalone `vi.fn()`. What you call `send` depends on the vocabulary: Jest and Vitest call it a mock function, while Meszaros\'s *xUnit Test Patterns* (and Fowler\'s "Mocks Aren\'t Stubs") call a double that records calls for assertions afterwards a **test spy**, and keep **mock** for a double whose expectations are set up front and verified by the double itself. Either way, the test verifies the **interaction**. Interaction assertions are right when the side effect *is* the behaviour (an email must be sent); prefer state assertions otherwise.',
    hint:
      'Look at what `vi.fn()` keeps track of besides returning a value, and at what the `expect` line actually asserts on.',
  },
  {
    id: 'testing-unit-fix-deep-equal',
    domain: 'practices',
    subject: 'testing',
    topic: 'unit',
    level: 'mid',
    kind: 'fix',
    language: 'typescript',
    prompt:
      'A teammate wrote a home-grown `expectDeepEqual` comparator for a test helper library. It returns `true` for things that are obviously different, so assertions pass when they should fail. Fix `solution(a, b)` so it has `toStrictEqual`-like semantics for plain objects, arrays and primitives:\n\n- both sides must have exactly the same own keys (an extra key on either side is a difference);\n- an array never equals a plain object;\n- `NaN` equals `NaN`.',
    starter: `export function solution(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  return Object.keys(left).every((key) => solution(left[key], right[key]));
}`,
    tests: [
      { name: 'nested equal objects', args: [{ user: { id: 1, tags: ['a', 'b'] } }, { user: { id: 1, tags: ['a', 'b'] } }], expected: true },
      { name: 'different primitive types', args: [{ a: 1 }, { a: '1' }], expected: false },
      { name: 'extra key on the right', args: [{ a: 1 }, { a: 1, b: 2 }], expected: false },
      { name: 'longer array on the right', args: [[1, 2], [1, 2, 3]], expected: false },
      { name: 'NaN equals NaN', args: [NaN, NaN], expected: true },
      { name: 'an array is not a plain object', args: [[], {}], expected: false },
      { name: 'same key count, different keys', args: [{ a: 1, b: undefined }, { a: 1, c: undefined }], expected: false },
    ],
    solution: `function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function solution(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!isObject(a) || !isObject(b)) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && solution(a[key], b[key]));
}`,
    tags: ['deep-equality', 'test-helpers', 'object-is'],
    source: 'topic-list',
    explanation:
      'Four problems need handling. (1) It only walks the keys of `a`, so extra keys on `b` (including extra array elements) are ignored: the comparison is a *subset* check. (2) `===` says `NaN !== NaN`; `Object.is` treats them as equal. (3) `[]` and `{}` both have zero keys, so they compare equal unless you check `Array.isArray` on both sides. (4) The obvious fix for (1), comparing key **counts**, is not enough: `{ a: 1, b: undefined }` and `{ a: 1, c: undefined }` both read `undefined` for the missing key, so you must check that each key actually exists on the other side.\n\nThis last case is one of the gaps between Jest/Vitest `toEqual` (which ignores `undefined` properties) and `toStrictEqual` (which does not). A helper this simple still misses `Date`, `Map`, `Set` and class instances, which is why you should use the framework matcher rather than roll your own.',
    hint:
      'Check whose keys the recursion walks, how `===` treats `NaN`, and what tells an array apart from an object with the same number of keys.',
  },
  {
    id: 'testing-unit-fix-fake-timers',
    domain: 'practices',
    subject: 'testing',
    topic: 'unit',
    level: 'senior',
    kind: 'fix',
    language: 'typescript',
    prompt:
      'This is a minimal fake-timer scheduler, the kind `vi.useFakeTimers()` gives you. `solution(plan, tickMs)` schedules one timer per step (a step may schedule a follow-up timer from inside its callback), advances the fake clock by `tickMs`, and returns the fired labels as `"label@time"`.\n\nThe `tick` implementation is wrong. Fix it so that, like real fake timers:\n\n- due timers fire in order of due time (ties keep scheduling order);\n- inside a callback, `clock.now()` equals that timer\'s due time;\n- timers scheduled *during* the tick fire in the same tick if they fall inside the window.',
    starter: `type Step = { label: string; delay: number; then?: { label: string; delay: number } };
type Timer = { id: number; at: number; fn: () => void };

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers: Timer[] = [];
  return {
    now: (): number => now,
    setTimeout(fn: () => void, ms: number): number {
      const id = nextId++;
      timers.push({ id, at: now + ms, fn });
      return id;
    },
    tick(ms: number): void {
      const end = now + ms;
      const due = timers.filter((t) => t.at <= end);
      for (const timer of due) {
        timers.splice(timers.indexOf(timer), 1);
        timer.fn();
      }
      now = end;
    },
  };
}

export function solution(plan: Step[], tickMs: number): string[] {
  const clock = createFakeClock();
  const fired: string[] = [];
  for (const step of plan) {
    clock.setTimeout(() => {
      fired.push(step.label + '@' + clock.now());
      const next = step.then;
      if (next) {
        clock.setTimeout(() => fired.push(next.label + '@' + clock.now()), next.delay);
      }
    }, step.delay);
  }
  clock.tick(tickMs);
  return fired;
}`,
    tests: [
      { name: 'fires in due-time order', args: [[{ label: 'a', delay: 300 }, { label: 'b', delay: 100 }], 500], expected: ['b@100', 'a@300'] },
      { name: 'callback sees its own due time', args: [[{ label: 'a', delay: 250 }], 1000], expected: ['a@250'] },
      { name: 'nested timer inside the window fires', args: [[{ label: 'a', delay: 100, then: { label: 'b', delay: 50 } }], 200], expected: ['a@100', 'b@150'] },
      { name: 'nested timer beyond the window stays pending', args: [[{ label: 'a', delay: 100, then: { label: 'b', delay: 500 } }], 200], expected: ['a@100'] },
      { name: 'ties keep scheduling order', args: [[{ label: 'a', delay: 100 }, { label: 'b', delay: 100 }], 100], expected: ['a@100', 'b@100'] },
      { name: 'nothing due yet', args: [[{ label: 'a', delay: 1000 }], 999], expected: [] },
    ],
    solution: `type Step = { label: string; delay: number; then?: { label: string; delay: number } };
type Timer = { id: number; at: number; fn: () => void };

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers: Timer[] = [];
  return {
    now: (): number => now,
    setTimeout(fn: () => void, ms: number): number {
      const id = nextId++;
      timers.push({ id, at: now + ms, fn });
      return id;
    },
    tick(ms: number): void {
      const end = now + ms;
      for (;;) {
        let next: Timer | undefined;
        for (const t of timers) {
          if (t.at <= end && (next === undefined || t.at < next.at)) next = t;
        }
        if (next === undefined) break;
        timers.splice(timers.indexOf(next), 1);
        now = next.at;
        next.fn();
      }
      now = end;
    },
  };
}

export function solution(plan: Step[], tickMs: number): string[] {
  const clock = createFakeClock();
  const fired: string[] = [];
  for (const step of plan) {
    clock.setTimeout(() => {
      fired.push(step.label + '@' + clock.now());
      const next = step.then;
      if (next) {
        clock.setTimeout(() => fired.push(next.label + '@' + clock.now()), next.delay);
      }
    }, step.delay);
  }
  clock.tick(tickMs);
  return fired;
}`,
    tags: ['fake-timers', 'determinism', 'test-helpers'],
    source: 'topic-list',
    explanation:
      'The buggy `tick` takes a **snapshot** of due timers once, runs them in insertion order, and only moves `now` at the end. That breaks three guarantees: order by due time, `now` equal to the due time inside the callback (so a nested `setTimeout(fn, 50)` is scheduled relative to the wrong base), and timers created during the tick being picked up. The fix is a loop: repeatedly pick the earliest due timer (strict `<` keeps ties in scheduling order), advance `now` to its due time, remove it, run it, and re-scan, because the callback may have added timers.\n\nThis is how `@sinonjs/fake-timers` (behind `vi.useFakeTimers()` and Jest modern timers) implements `tick`, and why `vi.advanceTimersByTime(200)` runs a retry scheduled at +50 ms from inside a +100 ms timer.\n\n**Say this out loud:** "Fake timers make time an input to the test: I control the clock, advance it deterministically, and assert on what fired, instead of sleeping and hoping. The key invariant is that time advances timer by timer, not in one jump."',
    hint:
      'Think about what breaks when the due list is computed once up front: firing order, the value of `now` inside a callback, and timers added mid-tick.',
  },
  {
    id: 'testing-integration-flaky-suite',
    domain: 'practices',
    subject: 'testing',
    topic: 'integration',
    level: 'mid',
    kind: 'multi',
    prompt:
      'Your API integration suite fails about one CI run in five, always on different tests, and always passes locally. Which of these are real fixes rather than ways to hide the problem? Select all that apply.',
    options: [
      { id: 'a', text: 'Isolate database state per test: wrap each test in a transaction that is rolled back, or truncate tables in `beforeEach`' },
      { id: 'b', text: 'Set `retry: 3` in the CI config so the pipeline goes green' },
      { id: 'c', text: 'Replace `await sleep(2000)` with polling for the expected condition with a timeout' },
      { id: 'd', text: 'Inject a clock and freeze time instead of relying on `new Date()` and the CI machine timezone' },
      { id: 'e', text: 'Raise every test timeout to 60 seconds' },
    ],
    answer: ['a', 'c', 'd'],
    tags: ['flaky-tests', 'test-isolation', 'ci'],
    source: 'topic-list',
    explanation:
      'Flakiness has causes: **shared state** between tests (order-dependent data, parallel workers writing the same rows), **timing assumptions** (fixed sleeps that are long enough on a laptop but not on a loaded CI runner), and **environment dependence** (clock, timezone, locale, random seeds). Isolating state, waiting for conditions instead of durations, and injecting the clock remove those causes. Two caveats: truncating in `beforeEach` only isolates tests that run serially against one database, so parallel workers each need their own database or schema (keyed by `VITEST_POOL_ID` or `JEST_WORKER_ID`); and a timezone mismatch on its own fails every CI run, while reading the real clock fails intermittently (a run that crosses midnight, a month end or a DST change). Retries and huge timeouts make the pipeline green while the non-determinism (which may be a real race in production code) stays. If you must quarantine a flaky test, track it as a bug with an owner.',
    hint:
      'Sort each option by whether it removes a source of non-determinism (shared state, timing, environment) or only makes the pipeline tolerate it.',
  },
  {
    id: 'testing-backend-testcontainers',
    domain: 'practices',
    subject: 'testing',
    topic: 'backend',
    level: 'mid',
    kind: 'single',
    prompt:
      'Your repository-layer tests either mock the database driver or run against in-memory SQLite, and they all pass. In production, a query fails because a migration renamed `customer_id` to `client_id`, and another bug slips through because SQLite and Postgres (used in production) sort `NULL` differently. What is the cheapest test that would have caught **both**?',
    options: [
      { id: 'a', text: 'More unit tests with stricter mocks that assert the exact SQL string' },
      { id: 'b', text: 'Integration tests that start a real Postgres of the production version with Testcontainers, run the migrations, and exercise the repository' },
      { id: 'c', text: 'A browser E2E test of the whole checkout flow against staging' },
      { id: 'd', text: 'Switching the in-memory test database from SQLite to an in-memory mock of the ORM' },
    ],
    answer: 'b',
    tags: ['testcontainers', 'integration', 'database'],
    source: 'topic-list',
    explanation:
      'Mocks only verify what you *think* the database does. Asserting SQL strings re-states the implementation and still never runs the migration. A substitute engine (SQLite, H2, an ORM mock) diverges from production semantics (NULL ordering, JSON operators, locking, collations): SQLite, for example, puts `NULL` first in ascending order, and Postgres puts it last. Testcontainers starts a throwaway Docker container of the **same engine and version** per suite, so migrations and queries run for real, in seconds, and in CI. E2E would also catch it, but slower, later and with a much worse failure signal.',
    hint:
      'Ask which option actually executes your migrations and queries on the same engine and version that production uses.',
  },
  {
    id: 'testing-backend-contract-tests',
    domain: 'practices',
    subject: 'testing',
    topic: 'backend',
    level: 'senior',
    kind: 'open',
    prompt:
      'The web BFF and three microservices (orders, payments, inventory) are owned by different teams. Breaking API changes keep reaching staging, and the shared end-to-end environment is always broken. **How would you use contract testing here, and what does it replace?**',
    modelAnswer:
      'I would introduce consumer-driven contract tests, for example with Pact. Each consumer (the BFF) writes tests against a mock provider that record the exact requests it makes and the response fields it relies on; those interactions become a contract published to a broker. Each provider runs contract verification in its own CI against the real service, with provider states to seed data, so orders cannot ship a change that breaks a field the BFF reads. A `can-i-deploy` check against the broker gates deploys per environment. This replaces most cross-team E2E tests for API compatibility, which are slow, flaky and fail far from the change; a thin E2E smoke layer remains for critical journeys. Contracts check shape and semantics of interactions, not business logic, so each service still needs its own integration tests. For event-driven parts, the same idea applies to message schemas, often with a schema registry.',
    rubric: [
      'Explains consumer-driven contracts: consumer defines expectations, provider verifies them in its own pipeline',
      'Mentions a broker and a deploy gate (`can-i-deploy` or equivalent) to decouple team release cycles',
      'Contrasts with shared E2E environments (slow, flaky, late feedback) and keeps only a thin E2E layer',
      'Notes limits: contracts do not test business logic; services still need their own integration tests',
      'Extends the idea to async messaging or schema registries',
    ],
    tags: ['contract-testing', 'pact', 'microservices'],
    source: 'topic-list',
    explanation:
      'Contract tests move integration feedback to the pipeline of the team that caused the break. Only fields the consumer actually uses are in the contract, so providers can evolve everything else freely.\n\n**Say this out loud:** "Consumer-driven contracts let each team verify compatibility in its own CI in minutes, so a shared end-to-end environment is no longer the only place we discover that two services disagree."',
    hint:
      'Think about who defines the expectations, where they get verified, and what gates a deploy; also say what contracts do not cover.',
  },
  {
    id: 'testing-frontend-rtl-query-priority',
    domain: 'practices',
    subject: 'testing',
    topic: 'frontend',
    level: 'junior',
    kind: 'single',
    prompt: 'In a React Testing Library test, which query should you reach for **first** to find the form\'s submit button?',
    options: [
      { id: 'a', text: '```ts\nscreen.getByTestId(\'submit-btn\')\n```' },
      { id: 'b', text: '```ts\ncontainer.querySelector(\'.btn-primary\')\n```' },
      { id: 'c', text: '```ts\nscreen.getByRole(\'button\', { name: /save/i })\n```' },
      { id: 'd', text: '```ts\nscreen.getByText(\'Save\')\n```' },
    ],
    answer: 'c',
    tags: ['react-testing-library', 'accessibility', 'queries'],
    source: 'topic-list',
    explanation:
      'RTL\'s guiding principle is "the more your tests resemble the way your software is used, the more confidence they can give you". Users (and assistive technology) find a button by its role and accessible name, so `getByRole` is first in the recommended priority, followed by `getByLabelText`, `getByPlaceholderText` and `getByText`. `getByTestId` is an escape hatch for when nothing semantic exists, and CSS selectors couple the test to styling. A bonus: if `getByRole` cannot find your button, it is often an accessibility bug.',
    hint:
      'Remember RTL\'s guiding principle: query the way a user or assistive technology would find the element.',
  },
  {
    id: 'testing-frontend-implementation-details',
    domain: 'practices',
    subject: 'testing',
    topic: 'frontend',
    level: 'mid',
    kind: 'multi',
    prompt:
      'A `SignupForm` component shows an error when the email is empty and opens a confirmation dialog on success. Which of these assertions test **implementation details** and would break on a harmless refactor (say, moving state into `useReducer` or splitting a child component)? Select all that apply.',
    options: [
      { id: 'a', text: 'Mocking `React.useState` and asserting `setIsOpen` was called with `true`' },
      { id: 'b', text: 'After `await user.click(submit)`, asserting `screen.getByRole(\'dialog\')` is visible' },
      { id: 'c', text: 'Shallow-rendering the form and asserting the `<EmailField>` child received `error="Email is required"` as a prop' },
      { id: 'd', text: 'Asserting `screen.getByRole(\'alert\')` has the text "Email is required"' },
      { id: 'e', text: 'If the form were a class component, reading its instance state with Enzyme: `wrapper.state(\'isOpen\')` equals `true`' },
    ],
    answer: ['a', 'c', 'e'],
    tags: ['react-testing-library', 'implementation-details', 'refactoring'],
    source: 'topic-list',
    explanation:
      'Implementation details are things the user cannot observe: internal state, which hook holds it, which child receives which prop. Tests that assert on them give **false negatives** (they fail on a correct refactor) and **false positives** (state can be `true` while the dialog is not rendered). The two `getByRole` assertions check what the user sees and interacts with, through roles, so they survive refactors and fail only when behaviour breaks. `wrapper.state()` and shallow rendering are Enzyme APIs, and Enzyme has no official adapter for React 17 or later, so on a React 19 codebase these tests cannot even run. This is the core argument for React Testing Library over Enzyme-style shallow rendering.',
    hint:
      'For each assertion, ask whether a user could observe it on screen, or whether it depends on which hook or child component holds the state.',
  },
];
