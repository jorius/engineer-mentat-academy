// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'clean-code-intention-revealing-names',
    domain: 'architecture',
    subject: 'clean-code',
    topic: 'naming',
    level: 'junior',
    kind: 'single',
    prompt:
      '```js\nconst d = 86400000;\nfunction chk(u) {\n  return Date.now() - u.lc > 30 * d;\n}\n```\nWhich rewrite communicates intent best?',
    options: [
      {
        id: 'a',
        text: '`const MS_PER_DAY = 86_400_000; const INACTIVE_AFTER_DAYS = 30; function isInactive(user) { return Date.now() - user.lastLoginAt > INACTIVE_AFTER_DAYS * MS_PER_DAY; }`',
      },
      { id: 'b', text: '`const DAY = 86400000; function check(user) { return Date.now() - user.lastLogin > 30 * DAY; }`' },
      { id: 'c', text: 'Keep the names and add comments: `// one day in ms` above `d` and `// true if the user is inactive` above `chk`' },
      {
        id: 'd',
        text: '`const dayInMillisecondsConstantValue = 86400000; function checkUserLastLoginTimeAgainstThirtyDaysAndReturnBoolean(u) { ... }`',
      },
    ],
    answer: 'a',
    tags: ['naming', 'magic-numbers', 'booleans'],
    source: 'topic-list',
    explanation:
      'Good names answer *what* and *why* so comments become unnecessary: a predicate reads as a question (`isInactive`, `hasAccess`, `canRetry`), units live in the name (`MS_PER_DAY`, `lastLoginAt`), and the business number gets a name so it is not a magic `30`. `check` hides what is checked, comments that restate code drift out of date, and names that narrate the implementation are noise that must change whenever the code does.',
  },
  {
    id: 'clean-code-positional-flags-to-options',
    domain: 'architecture',
    subject: 'clean-code',
    topic: 'functions',
    level: 'mid',
    kind: 'fix',
    language: 'javascript',
    prompt:
      "`createUser(name, email, isAdmin, isActive, sendWelcome)` takes three positional booleans, and the call in `solution` has already mixed two of them up. Refactor `createUser` to take a **single options object** with defaults `isAdmin = false`, `isActive = true`, `sendWelcome = false`, and update the call so each flag is passed by name. `request` fields that are missing must fall back to those defaults.",
    starter: `function createUser(name, email, isAdmin, isActive, sendWelcome) {
  return {
    name,
    email,
    role: isAdmin ? 'admin' : 'member',
    status: isActive ? 'active' : 'pending',
    welcomeEmail: sendWelcome,
  };
}

export function solution(request) {
  return createUser(request.name, request.email, request.admin, request.welcome, request.active);
}`,
    tests: [
      {
        name: 'active member without welcome email',
        args: [{ name: 'Ana', email: 'ana@example.com', admin: false, active: true, welcome: false }],
        expected: { name: 'Ana', email: 'ana@example.com', role: 'member', status: 'active', welcomeEmail: false },
      },
      {
        name: 'pending admin with welcome email',
        args: [{ name: 'Bo', email: 'bo@example.com', admin: true, active: false, welcome: true }],
        expected: { name: 'Bo', email: 'bo@example.com', role: 'admin', status: 'pending', welcomeEmail: true },
      },
      {
        name: 'missing flags use defaults',
        args: [{ name: 'Lee', email: 'lee@example.com' }],
        expected: { name: 'Lee', email: 'lee@example.com', role: 'member', status: 'active', welcomeEmail: false },
      },
    ],
    solution: `function createUser({ name, email, isAdmin = false, isActive = true, sendWelcome = false }) {
  return {
    name,
    email,
    role: isAdmin ? 'admin' : 'member',
    status: isActive ? 'active' : 'pending',
    welcomeEmail: sendWelcome,
  };
}

export function solution(request) {
  return createUser({
    name: request.name,
    email: request.email,
    isAdmin: request.admin,
    isActive: request.active,
    sendWelcome: request.welcome,
  });
}`,
    tags: ['parameter-object', 'boolean-flags', 'defaults'],
    source: 'topic-list',
    explanation:
      'A call like `createUser(n, e, false, true, false)` is unreadable, and swapping two booleans compiles, type-checks and ships. A parameter object names every argument at the call site, makes order irrelevant, and destructuring defaults document the default behavior in the signature. Destructuring defaults only apply to `undefined`, so an explicit `false` is respected. Beyond three parameters, or with any boolean, prefer an options object. A boolean that switches between two *behaviors* (not two values) is a stronger smell: split it into two functions.',
  },
  {
    id: 'clean-code-pure-discount',
    domain: 'architecture',
    subject: 'clean-code',
    topic: 'functions',
    level: 'mid',
    kind: 'fix',
    language: 'javascript',
    prompt:
      "The checkout shows a discount preview and then applies the same discount at payment. Customers report that the charged total is lower than the preview. Make `applyDiscount` a **pure function**: it must return a new cart and leave its input untouched. Keep the rounding helper and `solution` unchanged.",
    starter: `const roundCents = (value) => Math.round(value * 100) / 100;

function applyDiscount(cart, percent) {
  cart.items.forEach((item) => {
    item.price = roundCents(item.price * (1 - percent / 100));
  });
  cart.total = roundCents(cart.items.reduce((sum, item) => sum + item.price * item.qty, 0));
  return cart;
}

export function solution(cart, percent) {
  const snapshot = JSON.stringify(cart);
  const preview = applyDiscount(cart, percent);
  const previewTotal = preview.total;
  const charged = applyDiscount(cart, percent);
  return { previewTotal, chargedTotal: charged.total, inputUnchanged: JSON.stringify(cart) === snapshot };
}`,
    tests: [
      {
        name: 'preview equals charge and input is untouched',
        args: [
          {
            id: 'c1',
            items: [
              { sku: 'a', price: 10, qty: 2 },
              { sku: 'b', price: 5, qty: 1 },
            ],
            total: 25,
          },
          10,
        ],
        expected: { previewTotal: 22.5, chargedTotal: 22.5, inputUnchanged: true },
      },
      {
        name: 'zero discount',
        args: [{ id: 'c2', items: [{ sku: 'a', price: 4, qty: 3 }], total: 12 }, 0],
        expected: { previewTotal: 12, chargedTotal: 12, inputUnchanged: true },
      },
    ],
    solution: `const roundCents = (value) => Math.round(value * 100) / 100;

function applyDiscount(cart, percent) {
  const items = cart.items.map((item) => ({
    ...item,
    price: roundCents(item.price * (1 - percent / 100)),
  }));
  const total = roundCents(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  return { ...cart, items, total };
}

export function solution(cart, percent) {
  const snapshot = JSON.stringify(cart);
  const preview = applyDiscount(cart, percent);
  const previewTotal = preview.total;
  const charged = applyDiscount(cart, percent);
  return { previewTotal, chargedTotal: charged.total, inputUnchanged: JSON.stringify(cart) === snapshot };
}`,
    tags: ['pure-functions', 'immutability', 'side-effects', 'core-25'],
    source: 'epam-pdf',
    explanation:
      "The starter mutates the caller's cart, so the second call discounts already-discounted prices (22.5 becomes 20.25). A pure function depends only on its inputs and has no side effects, so calling it twice gives the same answer and it is trivially testable. Note that `{ ...cart }` alone is not enough: it is a shallow copy and `items` would still be shared, so each item is copied too.\n\nThis is the functional-core idea: keep calculations pure and push mutation and I/O to the edges. Immutability is also what makes React and Redux change detection by reference work.",
  },
  {
    id: 'clean-code-function-split-signals',
    domain: 'architecture',
    subject: 'clean-code',
    topic: 'functions',
    level: 'mid',
    kind: 'multi',
    prompt: 'Which of these are genuine signals that a function should be split or restructured? Select all that apply.',
    options: [
      { id: 'a', text: 'A boolean parameter selects between two different behaviors inside it' },
      { id: 'b', text: 'It computes a business result **and** writes it to the database and sends an email' },
      { id: 'c', text: 'Its body needs section comments like `// step 2: validate` and `// step 3: persist`' },
      { id: 'd', text: 'It has a single `return` statement at the end' },
      { id: 'e', text: 'It is called from many places in the codebase' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['functions', 'single-level-of-abstraction', 'side-effects'],
    source: 'topic-list',
    explanation:
      "A flag argument means the function does two things; split it into two named functions. Mixing calculation with I/O makes the logic impossible to test without mocks: extract the pure part. Section comments are extract-function candidates whose names are already written. A single return is a style choice (guard clauses with early returns are often clearer), and being widely used is a sign of a useful function, not a bad one. Functions should do one thing at one level of abstraction.",
  },
  {
    id: 'clean-code-refactor-legacy-function',
    domain: 'architecture',
    subject: 'clean-code',
    topic: 'functions',
    level: 'senior',
    kind: 'open',
    prompt:
      'A 180-line `processOrder` function validates input, computes prices, writes to three tables and publishes an event. It works, has almost no tests, and changes every sprint. How do you argue for refactoring it, and how do you do it safely?',
    modelAnswer:
      'I would make the case with evidence rather than taste: how often it changes, how many incidents or review rounds it caused, and how long changes take. Before touching it I add characterization tests around its current observable behavior (inputs, rows written, event published) so the refactor is provably behavior-preserving. Then I extract in small, separately reviewable steps: validation and pricing become pure functions with unit tests, and the database writes and event publish stay in a thin orchestrating shell (functional core, imperative shell). Names come from the domain so each step reads as the business process. I would do it incrementally alongside feature work, keep each PR small, and fix the dual-write between the tables and the event with a transactional outbox as a separate, explicit change rather than hiding it in the refactor.',
    rubric: [
      'Justifies the refactor with churn, defect or lead-time evidence, not personal style',
      'Writes characterization tests before changing behavior',
      'Separates pure calculation from I/O (functional core, imperative shell)',
      'Refactors in small, reversible, reviewable steps rather than a rewrite',
      'Keeps behavior changes (such as fixing the dual write) separate from pure refactoring',
    ],
    tags: ['refactoring', 'characterization-tests', 'code-review'],
    source: 'topic-list',
    explanation:
      'Senior signal: refactoring is a risk-management exercise. Tests first, small steps, and a business reason the team and product can agree with.\n\n**Say this out loud:** "I pin current behavior with characterization tests, then extract pure logic from I/O in small PRs, so every step is behavior-preserving and reversible."',
  },
];
