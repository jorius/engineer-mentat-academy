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
    id: 'javascript-equality-coercion-epam',
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
    tags: ['coercion', 'epam-25'],
    source: 'epam-pdf',
    explanation: '`==` coerces (`""` becomes 0; `null`/`undefined` are loosely equal only to each other). `[] + {}` stringifies both sides. `NaN` is never equal to anything; use `Number.isNaN` or `Object.is`.',
  },
  {
    id: 'javascript-hoisting-tdz-epam',
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
    tags: ['hoisting', 'tdz', 'epam-25'],
    source: 'epam-pdf',
    explanation: '`let` is hoisted but uninitialized until its declaration runs, so reading it throws. `var` would print `undefined`; the function declaration is fully hoisted but never reached here.',
  },
];
