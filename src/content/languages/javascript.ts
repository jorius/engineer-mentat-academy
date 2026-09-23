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
      '`this` is bound by the call site, not by where the function was defined. `secondSubject.greet()` or `firstSubject.greet.call(secondSubject)` both work; `bind` returns a new function. Arrow functions would ignore all of these because they capture `this` lexically.\n\n**Say this out loud:** "`this` is decided by the call site, not by where the function was defined, so a spread copy shares the function but I still have to call it through the right receiver, with a method call or `call`."',
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
    explanation:
      'Senior signal: choosing the combinator by failure semantics, then adding timeouts so the slowest dependency bounds latency.\n\n**Say this out loud:** "I pick the combinator by failure semantics: `all` fails fast, `allSettled` waits for every result, `any` takes the first success and `race` the first settlement, and I add a timeout so one slow dependency cannot set my latency."',
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
  {
    id: 'javascript-null-vs-undefined-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'fundamentals',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks for the difference between `null` and `undefined`. Show you know how each one behaves in real code: what does this print, one value per line?',
    code: `const user = { name: 'Ana', nickname: null };
function greet(name = 'guest') {
  return name;
}
console.log(user.age);
console.log(typeof null, typeof undefined);
console.log(JSON.stringify({ a: undefined, b: null }));
console.log(user.nickname ?? 'none', user.nickname?.length);
console.log(greet(undefined), greet(null));
console.log(null + 1, Number.isNaN(undefined + 1));`,
    answer: 'undefined\nobject undefined\n{"b":null}\nnone undefined\nguest null\n1 true',
    tags: ['null', 'undefined', 'nullish', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      '`undefined` is what the **engine** reports for "no value yet": a missing property, an unassigned variable, a missing argument, a function without `return`. `null` is a value a **program** assigns on purpose to mean "empty".\n\n- `typeof null` is `"object"`, a historical bug that can never be fixed.\n- `JSON.stringify` drops keys whose value is `undefined` but keeps `null`, so only `null` survives a network hop.\n- `??` and `?.` treat both as nullish, but **default parameters only fire for `undefined`**: `greet(null)` returns `null`.\n- Numeric coercion differs: `null` becomes `0`, `undefined` becomes `NaN`.\n\nThat asymmetry is why APIs often use it deliberately: in a PATCH body, a missing field means "leave it" and `null` means "clear it".',
  },
  {
    id: 'javascript-arrow-object-literal-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'fundamentals',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks for the difference between an **expression** and a **statement**. This snippet is where that difference bites. What does it print, one value per line?',
    code: `const asBlock = () => { value: 1 };
const asExpression = () => ({ value: 1 });
console.log(asBlock());
console.log(asExpression());
const result = (function () {
  return 'iife';
})();
console.log(result);
let total;
console.log((total = 3) * 2);
const size = total > 2 ? 'big' : 'small';
console.log(size);`,
    answer: 'undefined\n{"value":1}\niife\n6\nbig',
    tags: ['expression-vs-statement', 'arrow-functions', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'An **expression** produces a value and can appear anywhere a value is expected (`a + b`, `x ? y : z`, `total = 3`, a function expression). A **statement** performs an action and produces no usable value (`if`, `for`, `return`, declarations, blocks).\n\n- `() => { value: 1 }` parses the braces as a **block statement** containing a *label* `value:` and the expression `1`. There is no `return`, so it yields `undefined`. Wrapping in parentheses forces expression context: `() => ({ value: 1 })`.\n- The IIFE needs the outer parentheses for the same reason: `function () {}` at the start of a statement is a declaration, not an expression you can call.\n- Assignment is an expression whose value is the assigned value, which is why `(total = 3) * 2` is `6`.\n- The ternary is the expression form of `if`, which is why JSX `{...}` slots (expression-only) use ternaries and `&&` instead of `if`.',
  },
  {
    id: 'javascript-event-loop-async-await-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-loop',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks how the event loop works. Prove it on code that mixes `async`/`await`, promises, `queueMicrotask` and a timer. What does this print, one value per line?',
    code: `async function a() {
  console.log('a1');
  await b();
  console.log('a2');
}
async function b() {
  console.log('b');
}
console.log('start');
setTimeout(() => console.log('timeout'), 0);
a();
Promise.resolve().then(() => console.log('then'));
queueMicrotask(() => console.log('micro'));
console.log('end');`,
    answer: 'start\na1\nb\nend\na2\nthen\nmicro\ntimeout',
    tags: ['event-loop', 'microtasks', 'async-await', 'epam-25'],
    source: 'notion',
    explanation:
      'The script itself is one macrotask. Everything synchronous runs first, **including the body of an `async` function up to its first `await`** and the body of `b`: `start`, `a1`, `b`, `end`.\n\n`await b()` suspends `a` and schedules its continuation as a microtask when `b()`\'s promise settles (already, so it is queued immediately, before the later `.then` and `queueMicrotask`). When the stack empties, the **entire** microtask queue drains in FIFO order: `a2`, `then`, `micro`. Only then does the loop take the next macrotask, the timer.\n\n**Say this out loud:** "An async function runs synchronously until its first await; every continuation after that is a microtask, and the whole microtask queue drains before the next timer or I/O callback, so an endless chain of promise callbacks can starve timers and rendering."',
  },
  {
    id: 'javascript-promise-executor-sync-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-loop',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks for the difference between synchronous and asynchronous code. Which parts of this snippet are actually asynchronous? What does it print, one value per line?',
    code: `console.log('A');
const p = new Promise((resolve) => {
  console.log('B');
  resolve('C');
  console.log('D');
});
p.then((value) => console.log(value));
console.log('E');
async function load() {
  console.log('F');
  return 'G';
}
load().then((value) => console.log(value));
console.log('H');`,
    answer: 'A\nB\nD\nE\nF\nH\nC\nG',
    tags: ['sync-vs-async', 'promises', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Synchronous code runs to completion on the call stack; asynchronous code registers a callback that runs **later**, on the same single thread, when the stack is empty.\n\n- The Promise **executor runs synchronously** inside `new Promise`, so `B` and `D` print immediately; `resolve` does not stop the function.\n- An `async` function body also runs synchronously until its first `await` (here there is none), so `F` prints in order.\n- Only the `.then` callbacks are deferred, as microtasks, in registration order: `C`, then `G`.\n\nAsync is not parallel: wrapping CPU-heavy work in a Promise still blocks the thread. Only I/O (or a Worker) actually runs elsewhere.',
  },
  {
    id: 'javascript-stale-closure-getter-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'senior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      '`createCounter` is meant to keep `count` private (a closure) while exposing its live value as `counter.count`, but `counter.count` is always `0`. Fix **`createCounter`** (leave `solution` as is) so the exposed value reflects every increment. Do not move `count` onto the object as a writable field.',
    starter: `function createCounter() {
  let count = 0;
  return {
    count,
    increment() {
      count += 1;
    },
  };
}

export function solution(steps) {
  const counter = createCounter();
  for (let i = 0; i < steps; i += 1) {
    counter.increment();
  }
  return counter.count;
}`,
    tests: [
      { name: 'three increments', args: [3], expected: 3 },
      { name: 'five increments', args: [5], expected: 5 },
      { name: 'no increments', args: [0], expected: 0 },
    ],
    solution: `function createCounter() {
  let count = 0;
  return {
    get count() {
      return count;
    },
    increment() {
      count += 1;
    },
  };
}

export function solution(steps) {
  const counter = createCounter();
  for (let i = 0; i < steps; i += 1) {
    counter.increment();
  }
  return counter.count;
}`,
    tags: ['closures', 'encapsulation', 'getters', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'A closure is a function bundled with the **variables** (bindings) of the scope it was created in, so `increment` keeps updating the same `count` long after `createCounter` returned. But `{ count }` is shorthand for `{ count: count }`: it **copies the current primitive value (0) into a property** at creation time. From then on the property and the closed-over variable are unrelated.\n\nA getter (or a `getCount()` function) reads the live binding on every access and keeps the variable private, since nothing outside can assign it.\n\nThe same snapshot bug shows up in React as a *stale closure*: a callback created during an old render keeps reading that render\'s values. Closures also keep their whole scope alive, which is how closures holding large objects or DOM nodes cause leaks.\n\n**Say this out loud:** "A closure captures variables, not values, but the moment you copy a primitive into an object property you have taken a snapshot; expose a getter if you want the live value."',
  },
  {
    id: 'javascript-var-let-const-loop-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'hoisting-and-scope',
    level: 'junior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks for the difference between `var`, `let` and `const`. What does this print, one value per line?',
    code: `const byVar = [];
for (var i = 0; i < 3; i += 1) {
  byVar.push(() => i);
}
const byLet = [];
for (let j = 0; j < 3; j += 1) {
  byLet.push(() => j);
}
console.log(byVar.map((f) => f()));
console.log(byLet.map((f) => f()));
console.log(typeof i, typeof j);
const list = [1];
list.push(2);
console.log(list);
try {
  list = [];
} catch (error) {
  console.log(error.name);
}`,
    answer: '[3,3,3]\n[0,1,2]\nnumber undefined\n[1,2]\nTypeError',
    tags: ['var', 'let', 'const', 'block-scope', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      '- `var` is **function-scoped**: there is one `i` for the whole loop (it even leaks out of it, hence `typeof i` is `"number"`), and all three arrows read its final value, `3`.\n- `let` is **block-scoped** and a `for (let ...)` loop creates a **fresh binding per iteration**, so each arrow captures its own `j`. Outside the loop `j` does not exist, and `typeof` on an undeclared name returns `"undefined"` instead of throwing.\n- `const` forbids **reassigning the binding** (a `TypeError` at runtime), not mutating the value it points to: `list.push(2)` is fine. Use `Object.freeze` or immutable updates for the value.\n\nAlso: `let`/`const` are hoisted but sit in the temporal dead zone until their declaration runs, and `var` at the top level of a classic script becomes a property of `window`.',
  },
  {
    id: 'javascript-prototype-shared-state-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'prototypes',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks how prototypal inheritance works. This constructor has a classic bug. What does it print, one value per line?',
    code: `function Team(name) {
  this.name = name;
}
Team.prototype.members = [];
Team.prototype.add = function (member) {
  this.members.push(member);
  return this;
};
const a = new Team('a');
const b = new Team('b');
a.add('x');
console.log(b.members);
b.members = ['y'];
console.log(a.members, b.members);
console.log(Object.hasOwn(a, 'members'), Object.hasOwn(b, 'members'));
delete b.members;
console.log(b.members);
console.log(Object.getPrototypeOf(a) === Team.prototype, 'add' in a, Object.hasOwn(a, 'add'));`,
    answer: '["x"]\n["x"] ["y"]\nfalse true\n["x"]\ntrue true false',
    tags: ['prototype-chain', 'shadowing', 'epam-25'],
    source: 'notion',
    explanation:
      'Every object has an internal `[[Prototype]]` link; `new Team()` sets it to `Team.prototype`. **Reads** walk the chain until a property is found (ending at `null`). **Writes** always create or update an **own** property on the receiver.\n\n- `a.add(\'x\')` *reads* `this.members`, finds the one array on the prototype and mutates it, so every instance sees `["x"]`. Mutable state on a prototype is shared state.\n- `b.members = [\'y\']` *writes*, creating an own property on `b` that **shadows** the prototype one. Deleting it uncovers the shared array again.\n- `in` checks the whole chain; `Object.hasOwn` checks only the object itself. Methods live once on the prototype, which is why they are shared cheaply.\n\n`class` syntax is sugar over exactly this: methods go on `Class.prototype`, and per-instance state belongs in the constructor or class fields.\n\n**Say this out loud:** "Property reads walk the prototype chain but writes land on the object itself, so put behavior on the prototype and state on the instance; mutable data on a prototype is shared across every instance."',
  },
  {
    id: 'javascript-static-vs-instance-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'prototypes',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks for the difference between a static method and an instance method. What does this print, one value per line?',
    code: `class Temperature {
  static fromFahrenheit(f) {
    return new this(((f - 32) * 5) / 9);
  }
  constructor(celsius) {
    this.celsius = celsius;
  }
  toString() {
    return this.celsius.toFixed(1) + 'C';
  }
}
class Reading extends Temperature {}
const t = Temperature.fromFahrenheit(212);
const r = Reading.fromFahrenheit(32);
console.log(String(t));
console.log(String(r), r instanceof Reading);
console.log(typeof t.fromFahrenheit);
console.log(Object.getPrototypeOf(Reading) === Temperature);
console.log(Object.hasOwn(Temperature, 'fromFahrenheit'), Object.hasOwn(Temperature.prototype, 'toString'));`,
    answer: '100.0C\n0.0C true\nundefined\ntrue\ntrue true',
    tags: ['classes', 'static', 'factory', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'A **static** method is a property of the constructor function itself (`Temperature.fromFahrenheit`); an **instance** method lives on `Temperature.prototype` and is reached by instances through the prototype chain. Instances therefore cannot see statics (`typeof t.fromFahrenheit` is `"undefined"`), and statics have no instance `this`.\n\nInside a static method `this` is **the class it was called on**. `extends` links the constructors too (`Object.getPrototypeOf(Reading) === Temperature`), so `Reading.fromFahrenheit` is inherited and `new this(...)` builds a `Reading`. That makes statics the idiomatic home for factory methods, parsers and caches that belong to the type rather than to one object.',
  },
  {
    id: 'javascript-this-call-site-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'this-binding',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks what `this` is for. The snippet runs as an ES module (strict mode). What does it print, one value per line?',
    code: `const account = {
  owner: 'ana',
  regular() {
    return this === undefined ? 'no this' : this.owner;
  },
  arrow: () => (this === undefined ? 'no this' : 'has this'),
  nested() {
    return [1].map(function () {
      return this === undefined ? 'no this' : this.owner;
    })[0];
  },
  nestedArrow() {
    return [1].map(() => this.owner)[0];
  },
};
const { regular } = account;
console.log(account.regular());
console.log(regular());
console.log(account.arrow());
console.log(account.nested());
console.log(account.nestedArrow());
console.log(regular.call({ owner: 'bo' }));
const bound = account.regular.bind({ owner: 'cy' });
console.log(bound.call({ owner: 'di' }));`,
    answer: 'ana\nno this\nno this\nno this\nana\nbo\ncy',
    tags: ['this', 'call-site', 'bind', 'arrow-functions', 'strict-mode', 'epam-25'],
    source: 'notion',
    explanation:
      'For regular functions `this` is decided **at the call site**, by these rules in priority order: `new` > explicit `bind` > `call`/`apply` > method call `obj.fn()` > plain call (`undefined` in strict mode, the global object in sloppy scripts).\n\n- `regular()` is a plain call after destructuring: the receiver is gone.\n- `arrow` was created at module top level, where `this` is `undefined`; arrows never get their own `this`, and an object literal is not a scope.\n- The `function` callback inside `map` is a plain call, so it loses `account`; the arrow inside `nestedArrow` inherits `this` from `nestedArrow`, which was called as a method.\n- A bound function ignores later `call`/`apply`: the first `bind` wins.\n\n**Say this out loud:** "`this` is not where the function is written but how it is called; arrows opt out and take `this` from the enclosing scope, and `bind` fixes it permanently."',
  },
  {
    id: 'javascript-method-vs-function-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'this-binding',
    level: 'junior',
    kind: 'single',
    prompt:
      'EPAM asks for the difference between a method and a function.\n```js\nconst cart = {\n  items: [\'a\', \'b\'],\n  count() {\n    return this.items.length;\n  },\n};\nsetTimeout(cart.count, 0);\n```\nWhich statement is accurate?',
    options: [
      { id: 'a', text: 'A method is just a function stored as an object property; `this` comes from the call, so passing `cart.count` as a callback loses `cart` and the call throws.' },
      { id: 'b', text: 'A method is permanently bound to the object it was defined on, so `setTimeout(cart.count, 0)` safely returns 2.' },
      { id: 'c', text: 'Methods should be written as arrow functions so `this` is bound to the object literal.' },
      { id: 'd', text: 'Methods are a separate type: `typeof cart.count` is `"method"`.' },
    ],
    answer: 'a',
    tags: ['methods', 'this', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'JavaScript has no separate method type: a method is a function-valued property (`typeof` is `"function"`) that usually reads `this`. The binding to the object happens only in the call expression `cart.count()`. Passing `cart.count` hands over the bare function; the timer calls it without a receiver, `this` is `undefined` (or the global object in sloppy mode) and `this.items` throws.\n\nFixes: `setTimeout(() => cart.count(), 0)` or `setTimeout(cart.count.bind(cart), 0)`. An arrow function as a method does *not* help: arrows take `this` from the surrounding scope, not from the object literal. Shorthand methods do differ in two small ways: they cannot be used with `new`, and they can use `super`.',
  },
  {
    id: 'javascript-promise-chain-recovery-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'async',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks you to explain promises. Trace settlement, error propagation and `finally` through this code. What does it print, one value per line?',
    code: `const settled = new Promise((resolve, reject) => {
  resolve('first');
  reject(new Error('too late'));
  resolve('second');
});
settled.then((value) => console.log(value));

Promise.resolve(1)
  .then((value) => {
    throw new Error('bad ' + value);
  })
  .then(() => console.log('skipped'))
  .catch((error) => {
    console.log(error.message);
    return 2;
  })
  .then((value) => {
    console.log('after catch', value);
    return value * 10;
  })
  .finally(() => {
    console.log('finally');
    return 'ignored';
  })
  .then((value) => console.log('result', value));`,
    answer: 'first\nbad 1\nafter catch 2\nfinally\nresult 20',
    tags: ['promises', 'error-handling', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'A promise is a placeholder for a future value with three states: **pending**, then exactly once **fulfilled** or **rejected**. After it settles it is immutable, so the later `reject` and `resolve` calls are ignored.\n\nEvery `.then`/`.catch`/`.finally` returns a **new** promise:\n- A `throw` inside `then` rejects that new promise; rejection skips fulfillment handlers until a `catch`.\n- `catch` that **returns** a value recovers the chain with that value (2). Rethrow if you only meant to log.\n- `finally` receives no argument and **passes the previous value through**; its return value is ignored (unless it throws or returns a rejected promise).\n\n`first` prints first because its handler was queued before the other chain needed several microtask hops.',
  },
  {
    id: 'javascript-async-foreach-fix-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'async',
    level: 'senior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      'This reviewer-favorite bug returns `0` no matter the input. Fix `solution` so it returns the sum of the prices for `ids`, fetching them **concurrently**. Keep `fetchPrice` unchanged.',
    starter: `const prices = { a: 3, b: 5, c: 7 };

async function fetchPrice(id) {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return prices[id];
}

export async function solution(ids) {
  let total = 0;
  ids.forEach(async (id) => {
    total += await fetchPrice(id);
  });
  return total;
}`,
    tests: [
      { name: 'sums three prices', args: [['a', 'b', 'c']], expected: 15 },
      { name: 'repeated id', args: [['b', 'b']], expected: 10 },
      { name: 'empty list', args: [[]], expected: 0 },
    ],
    solution: `const prices = { a: 3, b: 5, c: 7 };

async function fetchPrice(id) {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return prices[id];
}

export async function solution(ids) {
  const values = await Promise.all(ids.map((id) => fetchPrice(id)));
  return values.reduce((sum, value) => sum + value, 0);
}`,
    tags: ['async-await', 'promise-all', 'foreach', 'race-condition', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      '`forEach` ignores the promises its callback returns, so `solution` returns before any price arrives. Two more problems hide here:\n- **Lost updates:** `total += await x` reads `total` *before* the await. With concurrent callbacks every one reads `0`, so even if you waited, the last writer wins.\n- **Unhandled rejections:** a failing callback rejects a promise nobody observes.\n\nJavaScript handles async work with callbacks, promises and `async`/`await` (sugar over promises). Pick the shape deliberately: `for...of` with `await` for **sequential** work (ordering, rate limits), `Promise.all(items.map(...))` for **concurrent** fail-fast work, `Promise.allSettled` when partial failure is acceptable, and a concurrency limiter (p-limit style) when the list is large.\n\n**Say this out loud:** "`forEach` is not promise-aware; I map to promises and await `Promise.all` for concurrency, or use `for...of` with `await` when order or rate limits matter, and I never accumulate shared state across concurrent awaits."',
  },
  {
    id: 'javascript-promisify-callback-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'async',
    level: 'mid',
    kind: 'code',
    language: 'javascript',
    prompt:
      'A legacy library uses Node-style error-first callbacks. Implement `promisify(fn)` so it returns a function that takes the same arguments (minus the callback) and returns a Promise that **rejects** with the callback error or **resolves** with the result. `solution` shows the async/await usage you must support.',
    starter: `function legacyDivide(a, b, callback) {
  setTimeout(() => {
    if (b === 0) {
      callback(new Error('division by zero'));
    } else {
      callback(null, a / b);
    }
  }, 0);
}

function promisify(fn) {
  return () => Promise.reject(new Error('not implemented'));
}

export async function solution(a, b) {
  const divide = promisify(legacyDivide);
  try {
    return await divide(a, b);
  } catch (error) {
    return 'error: ' + error.message;
  }
}`,
    tests: [
      { name: 'resolves with the result', args: [10, 2], expected: 5 },
      { name: 'rejects with the callback error', args: [1, 0], expected: 'error: division by zero' },
      { name: 'passes all arguments through', args: [9, 3], expected: 3 },
    ],
    solution: `function legacyDivide(a, b, callback) {
  setTimeout(() => {
    if (b === 0) {
      callback(new Error('division by zero'));
    } else {
      callback(null, a / b);
    }
  }, 0);
}

function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
}

export async function solution(a, b) {
  const divide = promisify(legacyDivide);
  try {
    return await divide(a, b);
  } catch (error) {
    return 'error: ' + error.message;
  }
}`,
    tags: ['callbacks', 'promises', 'async-await', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'This is the whole history of async JavaScript in one function: **callbacks** (error-first by Node convention), wrapped into a **Promise**, consumed with **async/await**.\n\n- The Promise constructor is the bridge: call the old API inside the executor, and route `error` to `reject` and the value to `resolve`.\n- Rest/spread (`...args`) keeps the wrapper generic for any arity.\n- `await` turns the rejection into an exception, so `try/catch` works like synchronous code.\n\nCallbacks compose badly (nesting, no single error channel, easy to call twice); promises settle once and chain. Node ships `util.promisify` and most core modules have promise variants (`fs/promises`); if `fn` relies on `this`, the wrapper must forward it with `fn.call(this, ...)`.',
  },
  {
    id: 'javascript-map-parseint-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'array-methods',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks what `Array.prototype.map` is for. These are the edge cases a senior is expected to know. What does this print, one value per line?',
    code: `console.log(['1', '2', '3'].map(parseInt).join(','));
console.log(['1', '2', '3'].map(Number).join(','));
console.log([1, , 3].map((x) => x * 2).join('|'));
const original = [{ n: 1 }];
const mapped = original.map((item) => {
  item.n += 1;
  return item;
});
console.log(original[0].n, mapped[0] === original[0]);
const result = [1, 2, 3].map((x) => {
  if (x > 1) return x;
});
console.log(result.length, result[0]);`,
    answer: '1,NaN,NaN\n1,2,3\n2||6\n2 true\n3 undefined',
    tags: ['map', 'parseInt', 'immutability', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      '`map` builds a **new array of the same length** by calling the callback with `(element, index, array)`.\n\n- `parseInt` accepts `(string, radix)`, so it receives the index as the radix: `parseInt(\'2\', 1)` and `parseInt(\'3\', 2)` are `NaN`. Pass an explicit arrow, `(s) => parseInt(s, 10)`, or use `Number`.\n- `map` skips holes in sparse arrays and keeps them as holes.\n- `map` does not mutate the *array*, but it does nothing to stop the callback mutating the *elements*: the result shares the same objects. Return `{ ...item, n: item.n + 1 }` for a real immutable transform.\n- A callback that does not return yields `undefined` slots; `map` is never a filter. Use `filter` then `map`, `flatMap`, or `reduce`, and use `forEach` when you only want side effects.',
  },
  {
    id: 'javascript-pipe-functional-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'functional',
    level: 'mid',
    kind: 'code',
    language: 'javascript',
    prompt:
      'EPAM asks how functional programming applies to JavaScript. Implement the higher-order function `pipe(...fns)`: it returns a function that passes its input through `fns` **left to right**, each output feeding the next. With no functions it returns the input unchanged.',
    starter: `function pipe(...fns) {
  return (value) => value;
}

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const dashes = (s) => s.split(' ').filter(Boolean).join('-');
const exclaim = (s) => s + '!';

const slugify = pipe(trim, lower, dashes, exclaim);

export function solution(input) {
  return slugify(input);
}`,
    tests: [
      { name: 'full pipeline', args: ['  Hello World '], expected: 'hello-world!' },
      { name: 'collapses repeated spaces', args: ['A  B'], expected: 'a-b!' },
      { name: 'single word', args: ['x'], expected: 'x!' },
    ],
    solution: `function pipe(...fns) {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}

const trim = (s) => s.trim();
const lower = (s) => s.toLowerCase();
const dashes = (s) => s.split(' ').filter(Boolean).join('-');
const exclaim = (s) => s + '!';

const slugify = pipe(trim, lower, dashes, exclaim);

export function solution(input) {
  return slugify(input);
}`,
    tags: ['higher-order-functions', 'composition', 'pure-functions', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Functional programming builds programs from **pure functions** (same input, same output, no side effects) combined by **higher-order functions**, avoiding shared mutable state. JavaScript supports it because functions are first-class values: you can pass them, return them and store them.\n\n`pipe` is `reduce` over functions: the accumulator is the value flowing through. `compose` is the same thing right to left (`reduceRight`). Each step here is pure and trivially unit-testable; the pipeline is just data.\n\nIn day-to-day JavaScript this shows up as `map`/`filter`/`reduce` instead of loops with mutation, immutable state updates in Redux reducers, and small composable utilities. The pragmatic stance: keep the core pure and push side effects (I/O, logging, time) to the edges.',
  },
  {
    id: 'javascript-memoize-cache-key-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'functional',
    level: 'senior',
    kind: 'code',
    language: 'javascript',
    prompt:
      'EPAM asks you to explain memoization. Implement `memoize(fn)` so repeated calls with the **same arguments** return the cached result without calling `fn` again. Arguments are JSON-serializable, and different argument lists must never share a cache entry (`(1, 2)` and `("1,2")` are different calls).',
    starter: `function memoize(fn) {
  return fn;
}

export function solution(calls) {
  let computed = 0;
  const slowAdd = (a, b) => {
    computed += 1;
    return a + b;
  };
  const add = memoize(slowAdd);
  const results = calls.map((args) => add(...args));
  return { results, computed };
}`,
    tests: [
      { name: 'caches repeated arguments', args: [[[1, 2], [1, 2], [2, 1]]], expected: { results: [3, 3, 3], computed: 2 } },
      { name: 'no cache-key collisions', args: [[[1, 2], ['1,2']]], expected: { results: [3, '1,2undefined'], computed: 2 } },
      { name: 'computes once for the same call', args: [[[5, 5], [5, 5], [5, 5]]], expected: { results: [10, 10, 10], computed: 1 } },
    ],
    solution: `function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  };
}

export function solution(calls) {
  let computed = 0;
  const slowAdd = (a, b) => {
    computed += 1;
    return a + b;
  };
  const add = memoize(slowAdd);
  const results = calls.map((args) => add(...args));
  return { results, computed };
}`,
    tags: ['memoization', 'closures', 'caching', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Memoization caches a function\'s result per input, trading memory for time. The cache lives in a **closure**, private to the returned function.\n\nThe hard part is the **key**:\n- `args.join(\',\')` or `String(args)` collide (`[1, 2]` and `[\'1,2\']` both become `"1,2"`). `JSON.stringify(args)` keeps types and boundaries for serializable input.\n- Object arguments compared by identity belong in a `WeakMap` (entries are collected with the key); structural keys need a stable serializer.\n- Use `cache.has`, not a truthiness check, or cached `0`, `""` and `undefined` results are recomputed.\n\nOnly memoize **pure** functions: a cached impure call returns stale data. An unbounded `Map` is a memory leak in a long-running process, so production caches need an LRU bound or a TTL. For async functions, cache the **promise** so concurrent callers share one in-flight request, and evict it on rejection.\n\n**Say this out loud:** "Memoization is only correct for pure functions, the cache key is the real design decision, and in a server every cache needs an eviction policy or it is a leak."',
  },
  {
    id: 'javascript-immutability-freeze-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'functional',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks about immutability. The snippet runs as an ES module (strict mode). What does it print, one value per line?',
    code: `const config = Object.freeze({ retries: 3, hosts: ['a'] });
try {
  config.retries = 5;
} catch (error) {
  console.log(error.name);
}
config.hosts.push('b');
console.log(config.retries, config.hosts.length);
console.log(Object.isFrozen(config), Object.isFrozen(config.hosts));
const next = { ...config, retries: 4 };
console.log(next.hosts === config.hosts, Object.isFrozen(next));
const numbers = [3, 1, 2];
const sorted = numbers.toSorted();
console.log(numbers.join(','), sorted.join(','));`,
    answer: 'TypeError\n3 2\ntrue false\ntrue false\n3,1,2 1,2,3',
    tags: ['immutability', 'object-freeze', 'strict-mode', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Primitives are already immutable; objects and arrays are mutable by default. Immutability means producing **new** values instead of changing existing ones.\n\n- `Object.freeze` is **shallow**: the nested `hosts` array is still mutable. A deep freeze must recurse.\n- In strict mode, writing to a frozen property **throws**; in sloppy mode it fails silently, which is worse.\n- Spreading creates a new, unfrozen object that **shares** nested references (structural sharing). That is the model Redux, React state and Immer use: copy the path you change, share the rest.\n- ES2023 added non-mutating array methods (`toSorted`, `toReversed`, `toSpliced`, `with`) for exactly this; `sort` and `reverse` mutate in place.\n\nWhy bother: predictable data flow, cheap change detection by reference (`prev !== next`), safe sharing between modules, and fewer "who changed this" bugs.\n\n**Say this out loud:** "`const` and `Object.freeze` are shallow; real immutability is a discipline of returning new objects with structural sharing, which is what makes reference-equality change detection in React and Redux work."',
  },
  {
    id: 'javascript-arrow-vs-regular-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks for the difference between arrow and regular functions. What does this print, one value per line?',
    code: `function regular() {
  return arguments.length;
}
const arrow = (...args) => args.length;
console.log(regular(1, 2, 3), arrow(1, 2));
console.log(typeof regular.prototype, typeof arrow.prototype);
try {
  new arrow();
} catch (error) {
  console.log(error.name);
}
const widget = {
  name: 'widget',
  describe() {
    const viaArrow = () => this.name;
    return viaArrow.call({ name: 'other' });
  },
};
console.log(widget.describe());`,
    answer: '3 2\nobject undefined\nTypeError\nwidget',
    tags: ['arrow-functions', 'this', 'arguments', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Arrow functions are not just shorter syntax. They have **no own** `this`, `arguments`, `super` or `new.target`; all of these resolve lexically from the enclosing function.\n\n- No `arguments` object: use rest parameters.\n- No `prototype` and no `[[Construct]]`, so `new` throws a `TypeError`.\n- `call`, `apply` and `bind` cannot change an arrow\'s `this`; `viaArrow` keeps the `this` of `describe`.\n\nRule of thumb: arrows for callbacks that need the outer `this` (array methods, promise handlers, React handlers); regular functions or method shorthand for object methods, prototype methods and constructors. An arrow as an object-literal method is a bug because it captures the outer `this`, not the object.',
  },
  {
    id: 'javascript-destructuring-defaults-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks you to explain destructuring. What does this print, one value per line?',
    code: `const { a = 1, b = 2, c: renamed = 3 } = { a: undefined, b: null };
console.log(a, b, renamed);
const [first, , third = 'x', ...rest] = [10, 20, undefined, 40, 50];
console.log(first, third, rest);
const { settings: { theme = 'dark' } = {} } = {};
console.log(theme);
let p = 1;
let q = 2;
[p, q] = [q, p];
console.log(p, q);
try {
  const { x } = null;
  console.log(x);
} catch (error) {
  console.log(error.name);
}`,
    answer: '1 null 3\n10 x [40,50]\ndark\n2 1\nTypeError',
    tags: ['destructuring', 'default-values', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Destructuring unpacks array items (by **position**, via the iterator) or object properties (by **name**) into bindings.\n\n- Defaults apply **only when the value is `undefined`**, not `null`: `b` stays `null`. This is the most common production surprise with API data.\n- `c: renamed = 3` renames and defaults at once; holes (`, ,`) skip positions; `...rest` collects the remainder.\n- Nested patterns need their own fallback (`= {}`), otherwise destructuring a missing object throws.\n- Destructuring `null` or `undefined` throws a `TypeError`, which is why function signatures often write `({ page = 1 } = {})`.\n- Swapping with `[p, q] = [q, p]` needs the previous statement to end with a semicolon, or ASI joins the lines.',
  },
  {
    id: 'javascript-spread-shallow-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'references-and-copies',
    level: 'junior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks what the spread operator is for. What does this print, one value per line?',
    code: `const base = { id: 1, tags: ['a'], meta: { v: 1 } };
const copy = { ...base, id: 2 };
copy.tags.push('b');
copy.meta = { v: 2 };
console.log(base.tags, base.meta.v, copy.id);
console.log({ ...{ x: 1, y: 1 }, ...{ y: 2 }, ...null });
console.log(Math.max(...[3, 9, 4]));
console.log([...'hey', ...[1, 2]]);`,
    answer: '["a","b"] 1 2\n{"x":1,"y":2}\n9\n["h","e","y",1,2]',
    tags: ['spread', 'shallow-copy', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Spread expands an iterable into elements (array literals, call arguments) or an object\'s own enumerable properties into a new object literal.\n\n- The copy is **shallow**: `copy.tags` is the same array as `base.tags`, so `push` shows up in both. **Reassigning** `copy.meta` only rebinds the copy\'s property. For a real deep copy use `structuredClone`.\n- Later properties override earlier ones, which is the idiom for defaults plus overrides.\n- Spreading `null`/`undefined` into an **object** is a no-op, but into an **array** or call it throws, because they are not iterable.\n- Strings are iterable by code point, and spread into a call replaces `fn.apply(null, arr)`.\n\nThe mirror syntax, `...rest` in parameters and destructuring, collects instead of expanding.',
  },
  {
    id: 'javascript-set-semantics-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'junior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks what the `Set` object is for. What does this print, one value per line?',
    code: `const values = new Set([1, '1', NaN, NaN, 0, -0]);
console.log(values.size);
const a = { id: 1 };
const objects = new Set([a, a, { id: 1 }]);
console.log(objects.size);
console.log([...new Set('mississippi')].join(''));
const seen = new Set();
console.log(seen.add(1) === seen, seen.has(1), seen.has('1'));`,
    answer: '4\n2\nmisp\ntrue true false',
    tags: ['set', 'same-value-zero', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'A `Set` stores **unique values in insertion order**, with O(1) average `add`, `has` and `delete`.\n\n- Uniqueness uses **SameValueZero**: like `===`, except `NaN` equals `NaN` (so it is stored once) and `0`/`-0` are the same. No coercion: `1` and `\'1\'` are different.\n- Objects are compared **by reference**; two look-alike objects are two entries. To dedupe records by id, use a `Map` keyed by id.\n- The constructor takes any iterable, so `[...new Set(arr)]` is the idiomatic dedupe that keeps first-seen order.\n- `add` returns the set, so calls chain.\n\nPrefer `set.has(x)` over `array.includes(x)` inside loops: it turns an O(n*m) intersection into O(n+m). `WeakSet` holds objects weakly for "already visited" tracking without leaks.',
  },
  {
    id: 'javascript-strict-mode-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'EPAM asks you to explain strict mode. This code is an ES module, so it is already strict. What does it print, one value per line?',
    code: `function assignUndeclared() {
  try {
    undeclaredTotal = 5;
    return 'created a global';
  } catch (error) {
    return error.name;
  }
}
console.log(assignUndeclared());
const point = Object.freeze({ x: 1 });
try {
  point.x = 2;
} catch (error) {
  console.log(error.name);
}
function whoAmI() {
  return typeof this;
}
console.log(whoAmI());
try {
  delete Object.prototype;
} catch (error) {
  console.log(error.name);
}
function alias(a) {
  a = 99;
  return arguments[0];
}
console.log(alias(1));`,
    answer: 'ReferenceError\nTypeError\nundefined\nTypeError\n1',
    tags: ['strict-mode', 'modules', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Strict mode (`\'use strict\'`, or **automatically** in ES modules and `class` bodies) turns silent failures into errors and removes legacy semantics:\n\n- Assigning to an undeclared name throws `ReferenceError` instead of creating an accidental global.\n- Writes to read-only or frozen properties, and deleting non-configurable ones, throw `TypeError` instead of doing nothing.\n- A plain function call gets `this === undefined` instead of the global object, so a lost receiver fails loudly.\n- `arguments` no longer aliases named parameters, and `with`, octal literals and duplicate parameter names are syntax errors.\n\nThese rules also let engines optimize better. In practice, modern code is strict by default because it is written as modules and classes; the leftover risk is old concatenated scripts and inline `<script>` tags.\n\n**Say this out loud:** "ES modules and class bodies are always strict; strict mode turns silent failures like accidental globals or writes to frozen objects into thrown errors, and makes an unbound `this` undefined instead of the global object."',
  },
  {
    id: 'javascript-event-delegation-closest-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-delegation',
    level: 'mid',
    kind: 'single',
    prompt:
      'EPAM asks you to explain event delegation. One listener on the list handles deletes for every current **and future** item:\n```js\nconst list = document.querySelector(\'#todo-list\');\nlist.addEventListener(\'click\', (event) => {\n  const button = event.target.closest(\'button[data-action="delete"]\');\n  if (!button || !list.contains(button)) return;\n  removeTodo(button.closest(\'li\').dataset.id);\n});\n```\nWhy does the handler call `event.target.closest(...)` instead of checking `event.target.matches(...)`?',
    options: [
      { id: 'a', text: '`event.target` is the innermost element clicked (for example an `<svg>` icon inside the button), so the handler walks up to the button; `closest` returns `null` when the click was not inside one.' },
      { id: 'b', text: '`event.target` is always the `<ul>` the listener is attached to, so `closest` is needed to reach the button.' },
      { id: 'c', text: '`matches` does not work on elements that were added after the listener was registered.' },
      { id: 'd', text: '`closest` stops the event from bubbling further, which prevents the delete from running twice.' },
    ],
    answer: 'a',
    tags: ['event-delegation', 'bubbling', 'dom', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'Event delegation puts **one listener on a common ancestor** and relies on **bubbling**: a click on any descendant travels up through its ancestors, so the ancestor sees it. It works for elements added later and avoids attaching (and cleaning up) one listener per item.\n\n- `event.target` is the element where the event originated, often a child of the thing you care about; `event.currentTarget` is the element the listener is on (the `<ul>`, option b\'s confusion).\n- `closest` walks up from the target; the `list.contains` guard stops a match *outside* the list (for example when lists are nested).\n- `matches` works fine on new elements; it just fails when the click landed on a child.\n\nCaveats: `focus`/`blur`/`mouseenter` do not bubble (use `focusin`/`focusout`, `mouseover`), and a child calling `stopPropagation()` silently breaks the delegated handler. React itself delegates: it attaches its listeners at the root container.',
  },
  {
    id: 'javascript-data-binding-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-delegation',
    level: 'senior',
    kind: 'open',
    prompt:
      'EPAM asks you to explain **data binding** in JavaScript. Go beyond the definition: compare one-way and two-way binding, sketch how you would implement two-way binding for a form in plain JavaScript, and say what React chose and why.',
    modelAnswer:
      'Data binding keeps the model (application state) and the view (DOM) in sync so you do not hand-write every update. In **one-way** binding state flows down into the view, and user input changes state only through explicit event handlers or actions; React and Redux work this way. In **two-way** binding a view edit writes straight into the model and model changes re-render the view, as in Angular `[(ngModel)]` or Vue `v-model`. In plain JavaScript I would put one delegated `input` listener on the form that writes `model[event.target.name] = event.target.value`, and wrap the model in a `Proxy` whose `set` trap (or an observer with subscribers) updates the bound inputs and any dependent DOM. I would skip writes when the value is unchanged to avoid update loops, and batch DOM updates in a microtask or `requestAnimationFrame`. React chose one-way flow with a single source of truth because explicit updates are traceable and debuggable at scale; two-way behavior is recreated with controlled components (`value` plus `onChange`). The trade-off is boilerplate versus predictability: two-way is convenient for forms, but implicit cascading updates get hard to reason about in large apps.',
    rubric: [
      'Defines binding as model and view synchronization and distinguishes one-way from two-way',
      'Describes a plain-JS mechanism: input/change events to update the model plus a Proxy, setter or observer to update the view',
      'Mentions preventing update loops or batching DOM updates',
      'Explains React one-way data flow and controlled components as its two-way equivalent',
      'States the trade-off: convenience versus traceability at scale',
    ],
    tags: ['data-binding', 'dom', 'proxy', 'react', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer ("synchronization between model and view") is the junior version. The senior version shows you know the **mechanism** (events in one direction, observation via Proxy/setters/subscriptions in the other), the **failure modes** (feedback loops, cascading updates, over-rendering) and why the ecosystem converged on unidirectional flow.\n\n**Say this out loud:** "Two-way binding is just two one-way bindings, events into the model and observation back into the view; React makes the second half explicit with controlled components so every state change has one traceable source."',
  },
  {
    id: 'javascript-coercion-to-primitive-epam',
    domain: 'languages',
    subject: 'javascript',
    topic: 'coercion-and-equality',
    level: 'senior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'Follow-up to `==` vs `===`: how do objects and `null` coerce? What does this print, one value per line?',
    code: `const price = {
  valueOf() {
    return 42;
  },
  toString() {
    return 'price';
  },
};
console.log(price + 1);
console.log(\`\${price}\`);
console.log(price == 42, price === 42);
console.log([] == false, !![]);
console.log(null == 0, null >= 0);`,
    answer: '43\nprice\ntrue false\ntrue true\nfalse true',
    tags: ['coercion', 'to-primitive', 'loose-equality', 'epam-25'],
    source: 'epam-pdf',
    explanation:
      'When an object meets an operator it is converted with **ToPrimitive** and a hint: `+` and `==` use the *default* hint (`valueOf` first), template literals and `String()` use the *string* hint (`toString` first). `Symbol.toPrimitive` overrides both.\n\n- `==` then compares primitives, so `price == 42` is `true`; `===` never converts, so different types are simply unequal.\n- `[] == false`: `false` becomes `0`, `[]` becomes `""` then `0`, so it is `true`, while `!![]` is `true` because every object is truthy. The same value is "equal to false" and truthy.\n- `null == 0` is `false` because `==` special-cases `null`: it only equals `undefined`. But relational operators convert with ToNumber, so `null >= 0` is `true`.\n\nThis inconsistency is the argument for `===` everywhere, with one accepted exception: `x == null` as a deliberate check for both `null` and `undefined`.\n\n**Say this out loud:** "`===` compares without conversion; `==` runs the abstract equality algorithm with ToPrimitive and ToNumber, and the only `==` I allow in code review is `x == null`."',
  },
  {
    id: 'javascript-async-operations-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'async',
    level: 'senior',
    kind: 'open',
    prompt:
      'How does JavaScript handle asynchronous operations? Walk me through the options and when you would pick each.',
    modelAnswer:
      'JavaScript runs your code on a single thread, so asynchrony comes from the host (the browser, or libuv in Node) doing the waiting for timers, network and file I/O, then queuing a callback when the work finishes; the event loop runs that callback once the call stack is empty. The oldest pattern is callbacks, which work but nest badly, make error handling manual (Node\'s error-first convention) and invert control, because you hand your continuation to someone else\'s code. Promises represent the eventual result as a value: they settle once, compose with `then` chains and combinators like `Promise.all` and `Promise.allSettled`, and propagate errors to a single `catch`. `async`/`await` is syntax over promises: `await` suspends the function and resumes it as a microtask, so the code reads top to bottom and `try`/`catch` works again. The traps I watch for are accidental serialization (awaiting independent calls one after another instead of using `Promise.all`), `forEach` with an async callback (nothing awaits it), unhandled rejections, and missing timeouts or cancellation with `AbortController`. None of these makes CPU-heavy work asynchronous; that needs a Web Worker or a worker thread.',
    rubric: [
      'Explains the mechanism: one JS thread, host APIs do the waiting, the event loop runs the queued continuation',
      'Compares callbacks, promises and async/await with a concrete drawback of callbacks (nesting, inversion of control, manual errors)',
      'Names a composition tool (Promise.all, allSettled, race, any) and the serial-await pitfall',
      'Covers error handling and cancellation or timeouts (try/catch, unhandled rejections, AbortController)',
      'Notes that CPU-bound work needs workers, not async',
    ],
    tags: ['epam-25', 'async', 'callbacks', 'promises', 'async-await'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s reference answer lists callbacks, promises and async/await. A senior answer starts one level lower, with **who does the waiting** (the host, not the JavaScript thread), treats the three styles as an evolution of the same continuation idea, and finishes with production concerns: parallelism, error propagation, cancellation, and I/O-bound versus CPU-bound work. Companion exercises: `javascript-promisify-callback-epam` and `javascript-async-foreach-fix-epam`.\n\n**Say this out loud:** "JavaScript never waits on the main thread: the host does the I/O and queues a continuation. Callbacks, promises and async/await are three ways of writing that continuation, and async/await wins because errors and control flow read like synchronous code."',
  },
  {
    id: 'javascript-equality-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'coercion-and-equality',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between `==` and `===`? When, if ever, would you allow `==` in a code review?',
    modelAnswer:
      '`===` is strict equality: if the types differ it returns `false` without converting anything, and for objects it compares references. `==` runs the Abstract Equality algorithm, which coerces: strings and booleans become numbers, objects are reduced with ToPrimitive (`valueOf`, then `toString`, or `Symbol.toPrimitive`), and `null` and `undefined` are equal only to each other. That produces surprises like `\'\' == 0`, `\'0\' == false` and `[] == false` all being `true`, while `null == 0` is `false`. Neither operator treats `NaN` as equal to itself; `Object.is` implements SameValue, so it is the tool when you need `NaN` equal to `NaN` or `+0` distinct from `-0`. My rule is `===` everywhere, enforced with ESLint\'s `eqeqeq`, with one deliberate exception: `value == null` as a concise check for both `null` and `undefined`, which the rule\'s `null: \'ignore\'` option allows. For objects neither operator compares contents, so structural equality needs a deep-equal helper.',
    rubric: [
      'States that === never coerces while == applies abstract equality with type conversion',
      'Gives at least one concrete coercion surprise (\'\' == 0, [] == false, or null == 0 being false)',
      'Mentions NaN and Object.is (SameValue) as the edge beyond both operators',
      'Gives a team rule: === by default, x == null as the only accepted exception, enforced by lint',
    ],
    tags: ['epam-25', 'coercion', 'equality', 'object-is'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer stops at "`==` coerces, `===` does not". Interviewers push for the **algorithm** (ToNumber, ToPrimitive, the `null`/`undefined` special case), for **`NaN` and `Object.is`**, and for a **policy** you would actually enforce. Companion exercises: `javascript-equality-coercion-epam` and `javascript-coercion-to-primitive-epam`.\n\n**Say this out loud:** "`===` compares type and value with no conversion; `==` runs a coercion algorithm with enough edge cases that I ban it by lint except for `x == null`, and I reach for `Object.is` when `NaN` or signed zero matter."',
  },
  {
    id: 'javascript-closures-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain closures? Give me a real use case and a way closures cause bugs.',
    modelAnswer:
      'A closure is a function together with the lexical environment it was created in: it keeps references to the outer variables it uses, so they stay alive after the outer function returns. It captures bindings, not values, so if the variable changes later the closure sees the new value. Real uses are everywhere: private state through the module pattern or factories (a counter whose state is unreachable from outside), partial application and function factories, memoization caches, and every callback or event handler that needs context. The classic bug is `var` in a loop, where every callback shares one function-scoped binding; `let` fixes it because each iteration gets a fresh binding. In React the same mechanism produces stale closures: an effect or interval callback captures the state from the render that created it, and you fix it with a correct dependency array, a functional update or a ref. Closures can also leak memory when a long-lived callback, such as a listener that is never removed, keeps a large object reachable, because whatever a closure references lives as long as the closure does.',
    rubric: [
      'Defines a closure as a function plus its lexical environment, capturing bindings rather than values',
      'Gives a practical use (private state, factories, memoization, callbacks)',
      'Explains the var-in-a-loop bug and why let fixes it',
      'Mentions stale closures (React effects or intervals) or memory retention by long-lived listeners',
    ],
    tags: ['epam-25', 'closures', 'encapsulation', 'stale-closure', 'memory'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s reference answer describes access to outer scopes. The senior layer is that closures capture **live bindings**, which explains both the `var` loop bug and React\'s stale closures, plus the **lifetime** consequence: whatever a closure references stays reachable. Companion exercises: `javascript-stale-closure-getter-epam` and `javascript-closure-counter-independence`.\n\n**Say this out loud:** "A closure is a function plus the scope it was created in; it captures variables by reference, which is what makes private state possible and also what causes stale-closure bugs when the captured binding is not the one you think."',
  },
  {
    id: 'javascript-null-undefined-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'fundamentals',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between `null` and `undefined`, and how do you handle both in an API or a codebase?',
    modelAnswer:
      '`undefined` is the language\'s default for "no value yet": an unassigned variable, a missing property, a missing argument and a function without `return` all produce it. `null` is an explicit value a programmer assigns to say "intentionally empty". They behave differently: `typeof undefined` is `\'undefined\'` but `typeof null` is `\'object\'`, a historical bug; `Number(undefined)` is `NaN` while `Number(null)` is `0`; default parameters and destructuring defaults apply only to `undefined`, not `null`; and `JSON.stringify` drops properties whose value is `undefined` but keeps `null`. They are loosely equal to each other and to nothing else, which is why `x == null` checks both. Modern operators treat them together: `??` falls back only on `null` or `undefined` (unlike `||`, which also swallows `0` and `\'\'`), and `?.` short-circuits on either. In an API I pick one convention, usually `null` for "known to be empty" and an absent field for "not provided", because that maps cleanly to JSON and to PATCH semantics, where omitting a field and clearing it mean different things.',
    rubric: [
      'Distinguishes the engine default (undefined) from the intentional empty value (null)',
      'Names concrete behavioral differences (typeof, Number conversion, defaults, JSON.stringify)',
      'Uses ?? and ?. correctly and contrasts ?? with ||',
      'Proposes an API convention, such as absent versus null in PATCH payloads',
    ],
    tags: ['epam-25', 'null', 'undefined', 'nullish', 'api-design'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer is the definition. A senior answer adds the **observable differences** that cause bugs (defaults ignore `null`, JSON drops `undefined`, `typeof null`) and a **convention** that survives serialization boundaries. Companion exercise: `javascript-null-vs-undefined-epam`.\n\n**Say this out loud:** "`undefined` means nobody set it, `null` means someone set it to empty; defaults and JSON treat them differently, so I use `??` to handle both and keep a clear convention at the API boundary, like absent versus `null` in a PATCH."',
  },
  {
    id: 'javascript-event-loop-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-loop',
    level: 'senior',
    kind: 'open',
    prompt:
      'How does the JavaScript event loop work? Be precise about microtasks and macrotasks.',
    modelAnswer:
      'JavaScript runs on one call stack per thread; the event loop is the host\'s scheduler that decides what runs when that stack is empty. Completed timers, I/O and UI events queue **tasks** (macrotasks); the loop takes one task, runs it to completion, then drains the **microtask** queue completely, which holds promise reactions, `await` continuations and `queueMicrotask` callbacks. In the browser, rendering (style, layout, paint, plus `requestAnimationFrame` callbacks) can happen between tasks, never in the middle of one. That ordering explains why a resolved promise\'s `then` runs before a `setTimeout(fn, 0)`, and why code after `await` resumes asynchronously even when the promise was already resolved. It also explains the failure modes: a long synchronous task freezes the UI and delays every timer, and a microtask that keeps scheduling microtasks starves both rendering and tasks. Node adds its own phases (timers, poll, check for `setImmediate`, close callbacks) and a `process.nextTick` queue that runs before promise microtasks. The practical rules are to keep tasks short, chunk long work or move CPU work to a worker, and never rely on timer precision.',
    rubric: [
      'Explains one call stack, run-to-completion, and the loop picking work when the stack is empty',
      'Distinguishes microtasks (promises, await, queueMicrotask) from tasks (timers, I/O, events) and says microtasks fully drain after each task',
      'Mentions rendering between tasks or requestAnimationFrame in the browser',
      'Names a failure mode: long tasks blocking, microtask starvation, or delayed timers',
      'Bonus: Node phases, setImmediate and process.nextTick',
    ],
    tags: ['epam-25', 'event-loop', 'microtasks', 'macrotasks', 'rendering'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s reference answer describes a single "callback queue". That is the junior model; the senior model has **two queues with different drain rules** plus **rendering opportunities**, and it predicts real output. Companion exercises: `javascript-event-loop-async-await-epam` and `javascript-event-loop-order-basic`.\n\n**Say this out loud:** "After every task the engine drains the entire microtask queue before it renders or takes the next task, so promise callbacks beat timers, and both a long task and an endless chain of microtasks will freeze the page."',
  },
  {
    id: 'javascript-var-let-const-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'hoisting-and-scope',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between `var`, `let` and `const`, and what do you use by default?',
    modelAnswer:
      '`var` is function-scoped (or global), is hoisted and initialized to `undefined`, can be redeclared, and at the top level of a classic script it becomes a property of the global object. `let` and `const` are block-scoped and are hoisted too, but they stay uninitialized in the temporal dead zone until the declaration runs, so touching them early throws a `ReferenceError` instead of silently reading `undefined`. `let` can be reassigned and `const` cannot, but `const` makes the **binding** immutable, not the value, so a `const` object or array can still be mutated. In loops, `let` creates a fresh binding per iteration, which is why closures over a `let` loop variable see their own iteration\'s value while `var` shares one binding. Neither `let` nor `const` can be redeclared in the same scope. My default is `const` everywhere, `let` only when a variable is genuinely reassigned, and no `var`, enforced with `prefer-const` and `no-var`, because it makes reassignment visible to the reader.',
    rubric: [
      'Contrasts function scope (var) with block scope (let and const)',
      'Explains the hoisting difference: var initialized to undefined versus the TDZ for let and const',
      'States that const prevents reassignment, not mutation',
      'Explains per-iteration loop bindings with let',
      'Gives a default policy: const, then let, never var',
    ],
    tags: ['epam-25', 'var', 'let', 'const', 'block-scope', 'tdz'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer covers scope and redeclaration. Interviewers follow up on the **TDZ**, **`const` versus immutability** and the **loop binding** behavior, because that is where the bugs live. Companion exercises: `javascript-var-let-const-loop-epam` and `javascript-hoisting-tdz-epam`.\n\n**Say this out loud:** "`var` is function-scoped and silently `undefined` before its line; `let` and `const` are block-scoped and throw in the temporal dead zone. I default to `const`, knowing it freezes the binding, not the object."',
  },
  {
    id: 'javascript-prototypal-inheritance-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'prototypes',
    level: 'senior',
    kind: 'open',
    prompt:
      'How does prototypal inheritance work in JavaScript, and how do ES classes relate to it?',
    modelAnswer:
      'Every object has an internal `[[Prototype]]` link to another object or to `null`. When you read a property, the engine checks the object\'s own properties first and then walks that chain until it finds the key or reaches `null`; a write, by contrast, creates or updates an own property on the target, which shadows the inherited one (unless an inherited setter or a non-writable property intercepts it). Functions have a `prototype` property, and `new F()` creates an object whose `[[Prototype]]` is `F.prototype`, runs `F` with `this` bound to it and returns it. ES classes are syntax over the same model: methods live on `Class.prototype`, `extends` links `Child.prototype` to `Parent.prototype` and also links the constructors so static members inherit, and `super` walks that chain. Because methods are shared through the prototype, putting mutable state such as an array on the prototype shares it across every instance, a classic bug. You can create links directly with `Object.create(proto)` and inspect them with `Object.getPrototypeOf`, while changing a live object\'s prototype with `Object.setPrototypeOf` is slow and best avoided. In practice I prefer composition over deep inheritance chains, but the chain is what explains `instanceof`, method lookup and `Object.hasOwn` versus `in`.',
    rubric: [
      'Describes the [[Prototype]] link and lookup walking the chain up to null',
      'Explains that writes create own properties that shadow, and the shared mutable state on a prototype bug',
      'Explains what new does with F.prototype',
      'Relates class, extends and super to the same prototype mechanics',
      'Mentions Object.create or Object.getPrototypeOf, or prefers composition over deep hierarchies',
    ],
    tags: ['epam-25', 'prototype-chain', 'classes', 'inheritance'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s reference answer describes the chain. The senior layer is the **read versus write asymmetry** (lookup walks the chain, assignment shadows), what **`new`** does step by step, and that **classes are the same mechanism**. Companion exercises: `javascript-prototype-shared-state-epam` and `javascript-static-vs-instance-epam`.\n\n**Say this out loud:** "Reads walk the prototype chain and writes land on the object itself; classes are just a nicer way to wire the same chain, which is why mutable state on a prototype leaks across every instance."',
  },
  {
    id: 'javascript-this-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'this-binding',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the purpose of the `this` keyword, and how is its value determined?',
    modelAnswer:
      '`this` gives a function access to the object it is operating on, so one method implementation can serve many objects. For regular functions its value is decided at call time by the call site, not where the function was defined, with a precedence: `new` binds the freshly created object; `call`, `apply` or `bind` bind the object you pass; a method call `obj.fn()` binds `obj`; and a plain call `fn()` gives `undefined` in strict code (including modules and classes) or the global object in sloppy mode. Arrow functions have no `this` of their own and use the `this` of the enclosing scope, which is why they suit callbacks inside methods and why they are wrong as object-literal methods. The classic bug is losing the receiver: passing `obj.method` as a callback or destructuring it calls it as a plain function, so `this` is `undefined`. Fixes are `bind` in the constructor, an arrow wrapper at the call site, or class fields holding arrow functions. In a DOM listener registered as a regular function, `this` is the element the listener is attached to, the same as `event.currentTarget`. `bind` is also permanent: a bound function ignores later `call` or `bind`, although `new` still overrides it.',
    rubric: [
      'States that this is determined by the call site for regular functions',
      'Lists the binding rules in precedence order (new, explicit, method call, default with undefined in strict code)',
      'Explains that arrow functions inherit a lexical this',
      'Describes the lost-receiver bug (passing a method as a callback) and a fix',
    ],
    tags: ['epam-25', 'this', 'call-site', 'bind', 'arrow-functions', 'strict-mode'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s reference answer lists contexts (method, alone, function, event) and says a plain function gets the global object, which is **wrong in strict mode, modules and classes**, where a plain call gives `undefined`. A senior answer states the rules in precedence order and names the lost-receiver bug. Companion exercises: `javascript-this-call-site-epam` and `javascript-this-spread-greet`.\n\n**Say this out loud:** "For regular functions `this` is decided by how the function is called: `new`, then `call`/`apply`/`bind`, then the object before the dot, otherwise `undefined` in strict code; arrow functions skip all of that and use the surrounding `this`."',
  },
  {
    id: 'javascript-hoisting-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'hoisting-and-scope',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain how hoisting works? What actually happens, and where does it bite?',
    modelAnswer:
      'Nothing is physically moved. Before running a scope, the engine creates bindings for every declaration in it, and hoisting is the observable result of that setup phase. Function declarations are fully initialized up front, so you can call them before their line. `var` bindings are created and initialized to `undefined`, so reading one early gives `undefined` instead of an error. `let`, `const` and `class` bindings are also created up front but stay uninitialized in the temporal dead zone until their declaration runs, so an early read throws a `ReferenceError`; the TDZ even shadows an outer variable of the same name for the whole block. Function expressions and arrow functions assigned to variables follow the variable\'s rules, so calling one early throws `TypeError: x is not a function` with `var`, or a `ReferenceError` with `let` or `const`. ES module imports are hoisted too: they are resolved and linked before any module code runs. Where it bites is code that relies on `var` reading `undefined`, circular module imports hitting a TDZ, and a local `let` that shadows an outer name, making earlier lines in the block throw.',
    rubric: [
      'Explains hoisting as bindings created during scope setup, not code being moved',
      'Differentiates function declarations, var (undefined) and let/const/class (TDZ)',
      'Explains that function expressions and arrows follow variable hoisting (TypeError versus ReferenceError)',
      'Gives a real bite: TDZ shadowing, circular imports, or reliance on var being undefined',
    ],
    tags: ['epam-25', 'hoisting', 'tdz', 'function-declarations'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s reference answer says declarations are "moved to the top". Interviewers probing seniority want the **creation-phase** explanation and the **TDZ**, including its shadowing effect and the different errors for early calls. Companion exercises: `javascript-hoisting-tdz-epam` and `javascript-var-let-const-loop-epam`.\n\n**Say this out loud:** "Hoisting is the engine creating a scope\'s bindings before running it: function declarations are ready to call, `var` starts as `undefined`, and `let`, `const` and `class` sit in the temporal dead zone and throw until their line runs."',
  },
  {
    id: 'javascript-method-vs-function-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'this-binding',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between a method and a function in JavaScript? Is there a real technical difference?',
    modelAnswer:
      'Every method is a function; "method" describes how the function is reached and called: as a property of an object, called through that object, so `this` is that object. The same function value can be both: `const f = obj.greet; f()` calls it as a plain function and `this` is no longer `obj`. There are real differences for **method definitions** in object literals and classes (`greet() {}`): they have a home object so `super` works inside them, they are not constructors so `new obj.greet()` throws, and class methods are non-enumerable and always strict. A property holding an arrow function looks like a method but does not behave like one: it captures `this` lexically and ignores the receiver. In classes, prototype methods are shared by all instances, while arrow-function class fields create a new function per instance, trading memory for a pre-bound `this`. So the practical distinction is about the receiver, and a senior chooses the form based on whether `this` must follow the call site or be fixed.',
    rubric: [
      'States that methods are functions accessed as object properties and called with a receiver',
      'Shows the same function losing its receiver when extracted and called plainly',
      'Mentions method-definition specifics (super, not constructible, non-enumerable in classes)',
      'Contrasts prototype methods with arrow-function class fields (shared versus per instance, bound this)',
    ],
    tags: ['epam-25', 'methods', 'this', 'classes'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer ("a method is a function assigned to an object property") is correct but shallow. The senior version is that the difference lives in **the call**, not the function, plus the concrete semantics of **method definitions** and the prototype-versus-field trade-off in classes. Companion exercise: `javascript-method-vs-function-epam`.\n\n**Say this out loud:** "A method is just a function called through an object, so `this` is that object; pull it off the object and it is a plain function again, which is why I choose between prototype methods and arrow class fields deliberately."',
  },
  {
    id: 'javascript-promises-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'async',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain promises? How do they work under the hood, and what are the common mistakes?',
    modelAnswer:
      'A promise is an object that stands for a value that will be available later; it starts pending and settles exactly once, either fulfilled with a value or rejected with a reason, and then never changes. The executor passed to `new Promise` runs synchronously; only the reactions registered with `then`, `catch` and `finally` run asynchronously, always as microtasks, even if the promise is already settled. `then` returns a new promise that adopts whatever the handler produces: a plain value fulfills it, a thrown error rejects it, and a returned promise or thenable is followed, which is how chains flatten. A rejection skips fulfillment handlers until a `catch` (or a `then` with a second argument) handles it, and a handler that returns normally recovers the chain. For concurrency, `Promise.all` fails fast, `allSettled` waits for every result, `race` takes the first to settle and `any` takes the first fulfillment. Common mistakes are forgetting to `return` inside a `then` (the chain continues with `undefined` and errors escape), wrapping an existing promise in `new Promise` (the explicit-construction anti-pattern), leaving rejections unhandled, and assuming a promise can be cancelled; it cannot, so you cancel the underlying work with `AbortController`.',
    rubric: [
      'Describes the states (pending, fulfilled, rejected) and that a promise settles once',
      'Explains that then returns a new promise shaped by the handler (value, throw, returned promise) and runs as a microtask',
      'Explains error propagation and recovery through a chain',
      'Compares the combinators (all, allSettled, race, any)',
      'Names common mistakes: missing return, constructor anti-pattern, unhandled rejection, no cancellation',
    ],
    tags: ['epam-25', 'promises', 'error-handling', 'microtasks'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer covers the three states. A senior answer adds **chaining semantics** (what the handler returns decides the next promise), **microtask timing**, **combinator choice** by failure behavior, and the mistakes you catch in review. Companion exercises: `javascript-promise-chain-recovery-epam` and `javascript-promise-combinators-choice`.\n\n**Say this out loud:** "A promise settles once, and every `then` returns a new promise shaped by what its handler returns or throws; that one rule explains chaining, error propagation and recovery."',
  },
  {
    id: 'javascript-sync-vs-async-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-loop',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between synchronous and asynchronous programming in JavaScript, and how do you decide which one a piece of work needs?',
    modelAnswer:
      'Synchronous code runs to completion on the call stack: each statement finishes before the next begins, and while it runs nothing else on that thread can, including rendering and event handlers. Asynchronous code starts an operation, returns immediately and continues later through a callback, a promise reaction or an `await` continuation scheduled by the event loop. The key point is that async does not mean parallel: the waiting happens in the host (network stack, timers, OS I/O), but the JavaScript itself still runs on one thread, one piece at a time. A promise executor runs synchronously and only its reactions are deferred, and an `async` function runs synchronously until its first `await`. So async is the right tool for I/O-bound work, where you would otherwise block while waiting, and it does nothing for CPU-bound work: a tight loop inside an `async` function still freezes the page or the Node process. For CPU work the options are chunking it across tasks, Web Workers or `worker_threads`, or moving it to a backend job. The cost of async is harder control flow, ordering and error handling, so I keep pure computation synchronous and make only the I/O boundary async.',
    rubric: [
      'Defines synchronous as blocking run-to-completion and asynchronous as a deferred continuation via the event loop',
      'States that async is not parallelism: one JS thread, the host does the waiting',
      'Knows what runs synchronously inside async code (promise executor, async function until its first await)',
      'Distinguishes I/O-bound work (async helps) from CPU-bound work (needs workers or chunking)',
    ],
    tags: ['epam-25', 'sync-vs-async', 'concurrency', 'workers'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer explains blocking versus non-blocking. The senior distinction is **concurrency without parallelism** and the **I/O-bound versus CPU-bound** decision, including the myth that marking a function `async` stops it from blocking. Companion exercise: `javascript-promise-executor-sync-epam`.\n\n**Say this out loud:** "Async in JavaScript is concurrency, not parallelism: it frees the thread while the host waits on I/O, but CPU work still blocks unless I chunk it or move it to a worker."',
  },
  {
    id: 'javascript-event-delegation-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'event-delegation',
    level: 'senior',
    kind: 'open',
    prompt:
      'Explain event delegation. How would you implement it correctly, and what are its limits?',
    modelAnswer:
      'Event delegation attaches one listener to a common ancestor instead of one per child, relying on the fact that most events bubble from the target up through its ancestors. Inside the handler you find the logical target with `event.target.closest(\'[data-action]\')` and check that the match is inside the container with `container.contains(match)`, because `event.target` is often a nested element such as an icon inside the button. The benefits are fewer listeners and less memory, automatic support for elements added later, and no adding and removing of listeners when a list re-renders. The limits: some events do not bubble (`focus`, `blur`, `mouseenter`, `mouseleave`), so you use `focusin`, `focusout`, `mouseover` and `mouseout` or a capture-phase listener; a descendant calling `stopPropagation` hides the event from the delegate; and high-frequency events like `mousemove` on a large ancestor run the handler for everything. Inside shadow DOM, events are retargeted to the host, so you inspect `event.composedPath()`. React itself relies on delegation: it attaches listeners at the root container and dispatches its synthetic events through its own tree.',
    rubric: [
      'Explains bubbling as the mechanism and one listener on an ancestor',
      'Uses event.target.closest plus a containment check rather than comparing event.target directly',
      'States the benefits: dynamic elements, fewer listeners, no re-binding',
      'Names limits: non-bubbling events and their alternatives, stopPropagation, high-frequency events',
      'Bonus: React\'s root-level delegation or shadow DOM retargeting',
    ],
    tags: ['epam-25', 'event-delegation', 'bubbling', 'dom'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer explains delegation and bubbling. The senior details are **`closest` plus containment** for nested targets, the **events that do not bubble**, and how **`stopPropagation`** silently breaks delegates. Companion exercise: `javascript-event-delegation-closest-epam`.\n\n**Say this out loud:** "I put one listener on the container and resolve the real target with `event.target.closest(selector)`, which handles nested markup and elements added later; for focus I listen to `focusin`, because `focus` does not bubble."',
  },
  {
    id: 'javascript-array-map-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'array-methods',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is `Array.prototype.map` for, and what would you flag in a code review about how it is used?',
    modelAnswer:
      '`map` creates a new array of the same length by calling a callback on each element and collecting the return values, so it expresses a one-to-one transformation without mutating the source array. The callback receives `(element, index, array)`, which is why `[\'1\', \'2\', \'3\'].map(parseInt)` returns `[1, NaN, NaN]`: `parseInt` treats the index as a radix. It skips holes in sparse arrays and keeps them as holes in the result, and the result is shallow, so mutating objects inside the callback still changes the originals. In review I flag `map` used only for side effects with the result thrown away (that is `forEach` or `for...of`), braced callbacks that forget to `return` and produce `undefined`s, `map` followed by `flat` where `flatMap` states the intent, and `async` callbacks, which produce an array of promises that must go through `Promise.all`. `map` is only as pure as its callback; the method itself just guarantees it does not modify the array. In React, `map` renders lists, and each element needs a stable `key` that is not the index when items can be reordered.',
    rubric: [
      'Defines map as a one-to-one transformation returning a new array without mutating the source',
      'Knows the callback signature and the parseInt pitfall',
      'Flags misuse: side-effect-only map, missing return, async callbacks needing Promise.all',
      'Notes that purity depends on the callback and the result is shallow; bonus: stable keys in React lists',
    ],
    tags: ['epam-25', 'map', 'immutability', 'code-review'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer calls `map` pure. Precisely: `map` does not mutate the array, but it is only as pure as its callback, and the result is a **shallow** new array. Seniors are expected to know the callback-signature traps and to catch misuse in review. Companion exercise: `javascript-map-parseint-epam`.\n\n**Say this out loud:** "`map` is for one-to-one transformations that return a new array; if I am ignoring the result I want `forEach`, and if the callback is async I need `Promise.all` around it."',
  },
  {
    id: 'javascript-functional-programming-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'functional',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain functional programming and how you apply it in JavaScript day to day?',
    modelAnswer:
      'Functional programming builds programs from pure functions, where the same inputs always give the same output with no side effects, and treats data as immutable, producing new values instead of changing existing ones. JavaScript supports it because functions are first-class values that can be passed, returned and stored, which enables higher-order functions like `map`, `filter` and `reduce`, closures, currying, partial application and composition with `pipe` or `compose`. The payoff is code that is easier to test and reason about: a pure function needs no mocks, can be memoized safely, and makes state changes explicit. Day to day I apply it pragmatically, with a functional core of pure transformations and business rules and an imperative shell at the edges for I/O, logging, and DOM or database access. React and Redux are built on these ideas: components as functions of props and state, reducers as pure `(state, action) => newState`, and immutable updates so reference equality can detect change. The costs are allocations from copying, which rarely matter but can in hot loops, and point-free or heavily curried code that hurts readability for the team, so I keep it idiomatic rather than dogmatic.',
    rubric: [
      'Defines pure functions and immutability as the core principles',
      'Names first-class and higher-order functions, composition, currying or closures in JavaScript',
      'Explains the benefits: testability, predictability, safe memoization',
      'Describes pragmatic application: functional core with an imperative shell, reducers, React components',
      'Acknowledges trade-offs: copying cost and the readability of point-free code',
    ],
    tags: ['epam-25', 'pure-functions', 'higher-order-functions', 'composition', 'immutability'],
    source: 'epam-pdf',
    explanation:
      'The EPAM answer lists first-class, higher-order and pure functions. A senior shows **where** they apply it (a pure core, reducers, React components) and **where they stop** (I/O at the edges, readability over cleverness). Companion exercises: `javascript-pipe-functional-epam` and `javascript-memoize-cache-key-epam`.\n\n**Say this out loud:** "I keep business logic as pure functions over immutable data and push side effects to the edges; that makes the core trivial to test, and it is exactly the model reducers and React components already use."',
  },
  {
    id: 'javascript-arrow-vs-regular-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between an arrow function and a regular function, and when do you choose each?',
    modelAnswer:
      'Arrow functions are more than short syntax: they have no own `this`, `arguments`, `super` or `new.target`, and resolve all of these lexically from the enclosing scope. That makes them ideal for callbacks inside methods, such as a `setTimeout` or `array.map` callback in a class, where a regular function would lose `this`. They also cannot be constructors (`new` throws), have no `prototype` property, and `call`, `apply` and `bind` cannot change their `this`. Regular functions get `this` from the call site, have `arguments`, can be constructors, and function declarations are hoisted so they can be called before their line. So I use regular functions or method shorthand for object and class methods that need the receiver and for constructors, and arrows for callbacks and small expressions. Two gotchas: an arrow used as an object-literal method sees the outer `this`, not the object, and returning an object literal needs parentheses, `() => ({ a: 1 })`, because a brace starts a function body. In classes, arrow-function fields give a per-instance, pre-bound function, handy for event handlers but not shared on the prototype.',
    rubric: [
      'States that arrows have a lexical this and no own arguments, super or new.target',
      'Notes arrows cannot be constructors, have no prototype, and ignore call/apply/bind for this',
      'Gives usage guidance: arrows for callbacks, regular or method syntax for methods and constructors',
      'Names a gotcha: arrow as an object method, object literal needing parentheses, or per-instance class fields',
    ],
    tags: ['epam-25', 'arrow-functions', 'this', 'arguments', 'constructors'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer lists the differences. The senior value is turning them into a **decision rule** and knowing the **gotchas** that show up in real code. Companion exercises: `javascript-arrow-vs-regular-epam` and `javascript-arrow-object-literal-epam`.\n\n**Say this out loud:** "Arrow functions take `this` and `arguments` from where they are written, so I use them for callbacks and regular methods where the receiver matters; an arrow can never be a constructor or a correct object-literal method."',
  },
  {
    id: 'javascript-destructuring-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain destructuring, including the parts people get wrong?',
    modelAnswer:
      'Destructuring unpacks values from arrays by position and from objects by property name into variables, in declarations, assignments and function parameters. Array destructuring works on any iterable and supports skipping (`const [, second] = arr`), rest (`[first, ...rest]`) and swaps (`[a, b] = [b, a]`). Object destructuring supports renaming (`{ id: userId }`), defaults (`{ page = 1 }`), nesting and rest (`{ password, ...safe }`), which is a neat way to omit fields immutably. The gotchas: defaults apply only when the value is `undefined`, not `null`; destructuring `null` or `undefined` itself throws a `TypeError`, so parameters usually get a default like `function f({ a } = {})`; nested patterns throw when an intermediate object is missing; and assigning to existing variables with object syntax needs parentheses, `({ a } = obj);`, because a leading brace is parsed as a block. Destructuring copies values, so objects are still shared references. Applied to an options object in parameters, it gives named arguments, self-documenting defaults and freedom from argument order.',
    rubric: [
      'Covers array (positional, any iterable) and object (by name) destructuring with rename, defaults and rest',
      'States that defaults apply only for undefined, not null',
      'Knows destructuring null or undefined throws, and the parameter default = {} fix',
      'Mentions the parenthesized assignment gotcha or that nested objects are still shared references',
      'Applies it to options-object parameters as named arguments',
    ],
    tags: ['epam-25', 'destructuring', 'default-values', 'parameters'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer shows the basic syntax. Interviewers check the **edge semantics**: defaults and `null`, destructuring `undefined`, the block-versus-object brace ambiguity, and that nothing is deep-copied. Companion exercise: `javascript-destructuring-defaults-epam`.\n\n**Say this out loud:** "Destructuring defaults only kick in for `undefined`, and destructuring `undefined` itself throws, so for option parameters I write `function f({ timeout = 1000 } = {})`."',
  },
  {
    id: 'javascript-spread-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'references-and-copies',
    level: 'senior',
    kind: 'open',
    prompt:
      'Describe the purpose of the spread operator. Where does it help, and where does it mislead people?',
    modelAnswer:
      'Spread expands an iterable into individual elements in array literals and call arguments (`[...a, ...b]`, `Math.max(...nums)`), and copies an object\'s own enumerable properties into a new object literal (`{ ...defaults, ...overrides }`, where later keys win). Its main job is immutable updates: copying arrays and objects, merging configuration, and the reducer and React state pattern `{ ...state, user: { ...state.user, name } }`. It misleads because it is a **shallow** copy: nested objects and arrays are shared, so mutating `copy.user.name` also changes the original; a real deep copy needs `structuredClone` or an explicit spread at every level. Object spread only takes own enumerable properties, so prototype methods and class identity are lost (a spread class instance becomes a plain object), getters are invoked and their current values copied, and symbol keys are included. Array spread requires an iterable, so spreading a plain object into an array throws, while spreading `null` or `undefined` into an object literal is silently ignored. Spreading a very large array into a function call can exceed the engine\'s argument limit, and spreading inside a loop to grow an array is quadratic. Rest syntax looks the same but does the opposite, collecting values into an array or object.',
    rubric: [
      'Explains spread for iterables in arrays and calls, and for own enumerable properties in objects, with later keys winning',
      'States it is a shallow copy, gives the nested mutation bug and a deep-copy alternative',
      'Notes lost prototypes and class identity, or getter evaluation, in object spread',
      'Mentions limits (argument limits, quadratic spreads in loops) or distinguishes rest from spread',
    ],
    tags: ['epam-25', 'spread', 'shallow-copy', 'structuredClone', 'immutability'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer defines spread. A senior answer is about **copy semantics**: shallow, own enumerable properties only, prototype lost. That is where production bugs come from, especially in state updates. Companion exercise: `javascript-spread-shallow-epam`.\n\n**Say this out loud:** "Spread makes a shallow copy of own enumerable properties, so it is perfect for immutable top-level updates, but nested objects are still shared; for a real deep copy I use `structuredClone`."',
  },
  {
    id: 'javascript-static-vs-instance-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'prototypes',
    level: 'senior',
    kind: 'open',
    prompt:
      'Describe the difference between a static method and an instance method, and when you would design something as static.',
    modelAnswer:
      'An instance method lives on `Class.prototype`, is shared by all instances and is called on an instance, so `this` is that instance and it can read and change its state. A static method lives on the constructor itself and is called as `Class.method()`; its `this` is the class (or the subclass it was called through), and calling it on an instance fails because instances do not inherit from the constructor. Static members are inherited by subclasses because `extends` also links the constructors, so `this` inside a static method can be a subclass, which is how `static create() { return new this(); }` builds the right type. Typical static uses are factories and named constructors (`Array.from`, `Date.now()`, `User.fromJson`), parsing or validation helpers tied to the type, and class-level constants or caches, including `static #private` fields. I avoid static for anything that needs per-instance state, and I am wary of static mutable state, because it is effectively a global shared across the app and across tests. If a static method never touches the class, a plain module-level function is often simpler and easier to tree-shake.',
    rubric: [
      'Places instance methods on the prototype with this as the instance, and static methods on the constructor with this as the class',
      'Knows static methods are not callable on instances and are inherited by subclasses',
      'Gives good static use cases: factories or named constructors, parsing helpers, constants',
      'Warns that static mutable state is global state, or prefers module functions when no class access is needed',
    ],
    tags: ['epam-25', 'classes', 'static', 'factory'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer says where each method is called. The senior additions are **where each one lives** (prototype versus constructor), **static inheritance** with `this` pointing at the subclass, and the **design judgment** about factories versus hidden global state. Companion exercise: `javascript-static-vs-instance-epam`.\n\n**Say this out loud:** "Instance methods live on the prototype and work with one object\'s state; static methods live on the class, which makes them right for factories like `User.fromJson` and wrong for anything that quietly stores shared mutable state."',
  },
  {
    id: 'javascript-expression-vs-statement-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'fundamentals',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the difference between an expression and a statement in JavaScript, and why does it matter in real code?',
    modelAnswer:
      'An expression is any piece of code that produces a value: `2 + 2`, `user.name`, a function call, `a ? b : c`, an arrow function or an assignment. A statement performs an action and does not produce a value you can use: `if`, `for`, `while`, `return`, declarations with `let`, `const` or `function`, and blocks. Anywhere JavaScript expects a value you can put an expression but not a statement, which is why you cannot write an `if` inside a template literal or a JSX `{}` and use a ternary, `&&` or a mapped array instead. The same syntax can be either depending on position: `function f() {}` at the start of a statement is a hoisted declaration, while in expression position it is a function expression that is not hoisted. Braces are the classic trap: the arrow body in `() => { a: 1 }` is a block containing a label, so it returns `undefined` and you need `() => ({ a: 1 })`, and a statement that starts with `{` cannot be an object destructuring assignment without parentheses. Automatic semicolon insertion depends on the same grammar: `return` followed by a newline ends the statement, so the value on the next line is never returned. Knowing the distinction explains JSX rules, IIFE syntax and a whole family of "why is this undefined" bugs.',
    rubric: [
      'Defines expressions as producing values and statements as performing actions',
      'Explains why JSX and template literals accept only expressions (ternary or && instead of if)',
      'Shows position-dependent parsing: declaration versus function expression, or braces as block versus object literal',
      'Names a real bug: arrow returning an object literal, return followed by a newline, or destructuring assignment parentheses',
    ],
    tags: ['epam-25', 'expression-vs-statement', 'jsx', 'asi', 'parsing'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer gives definitions. Seniors are expected to connect the distinction to **parsing**: the same characters mean different things in statement and expression position, which explains the object-literal arrow bug, ASI after `return`, and JSX\'s `{}` rule. Companion exercise: `javascript-arrow-object-literal-epam`.\n\n**Say this out loud:** "Expressions produce values and statements do things; JSX braces and template literals only take expressions, and a leading `{` is parsed as a block in statement position, which is why an arrow returning an object needs parentheses."',
  },
  {
    id: 'javascript-immutability-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'functional',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain immutability in JavaScript, how you achieve it, and why it matters?',
    modelAnswer:
      'Immutability means a value is never changed after it is created; to "change" it you create a new value. Primitives are already immutable, but objects and arrays are mutable and shared by reference, so anyone holding a reference can change them for everyone. You get immutability through discipline and tools: non-mutating operations such as spread, `map` and `filter`, and the ES2023 copying methods `toSorted`, `toReversed`, `toSpliced` and `with`; `Object.freeze` for a runtime guarantee, remembering it is shallow and that writes to a frozen object only throw in strict mode (sloppy code ignores them silently); TypeScript `readonly` and `as const` for compile-time guarantees; and Immer, which Redux Toolkit uses to turn "mutating" code into immutable updates. It matters because it makes change detection cheap and reliable: React state, `React.memo` and Redux selectors compare by reference, so mutating state in place means nothing re-renders or a memoized value goes stale. It also removes bugs caused by shared mutable state, makes undo and time travel easy, and makes functions safe to memoize. The cost is extra allocation and copying, which structural sharing keeps small, and very hot paths may still mutate local data that never escapes.',
    rubric: [
      'Defines immutability and notes primitives are immutable while objects and arrays are shared references',
      'Names techniques: spread and non-mutating methods (toSorted and friends), shallow Object.freeze, readonly or as const, Immer',
      'Explains why it matters for reference-equality change detection in React and Redux',
      'Mentions other benefits (fewer shared-state bugs, undo, safe memoization) and the copying cost or structural sharing',
    ],
    tags: ['epam-25', 'immutability', 'object-freeze', 'react', 'redux'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer is one line. A senior connects immutability to **reference equality**, which is what makes React and Redux change detection work, and knows the **limits of each tool**: `freeze` is shallow and only throws in strict mode, `readonly` disappears at runtime. Companion exercise: `javascript-immutability-freeze-epam`.\n\n**Say this out loud:** "React and Redux detect change by reference, so I never mutate state; I create new objects with spread or the `toSorted`-style methods, or let Immer do it, and I remember that `Object.freeze` is shallow."',
  },
  {
    id: 'javascript-strict-mode-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'senior',
    kind: 'open',
    prompt:
      'Can you explain strict mode? What does it change, and do you still need `\'use strict\'` today?',
    modelAnswer:
      'Strict mode is an opt-in, restricted variant of JavaScript that turns silent failures into errors and removes some confusing features. The key changes: assigning to an undeclared variable throws a `ReferenceError` instead of creating a global; writing to a non-writable or getter-only property, or adding a property to a frozen or non-extensible object, throws a `TypeError`; `this` in a plain function call is `undefined` instead of the global object; `with` is banned; duplicate parameter names and `delete` of a plain variable are syntax errors; `arguments` no longer aliases the named parameters; and `eval` gets its own scope so it cannot inject variables. These restrictions also make code easier for engines to optimize. You enable it with `\'use strict\'` at the top of a script or function, but ES modules and class bodies are always strict, so in modern codebases built on modules you rarely write the directive. It still matters in classic scripts and older CommonJS files that never emitted it, and a function with default, destructured or rest parameters cannot even contain the directive itself. In debugging, it is what explains why `this` is `undefined` in a detached method and why a write to a frozen object throws in one file but silently does nothing in another.',
    rubric: [
      'Explains that strict mode turns silent errors into thrown errors and removes unsafe features',
      'Lists concrete changes: undeclared assignment, read-only writes throw, this undefined in plain calls, with banned',
      'States that ES modules and classes are automatically strict',
      'Explains where it still matters (classic scripts, legacy CommonJS) or its effect on debugging this and frozen writes',
    ],
    tags: ['epam-25', 'strict-mode', 'modules', 'classes'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer is the definition. The senior answer names **specific behavior changes** and knows that **modules and classes are strict by default**, which is why most modern code is strict without the directive. Companion exercises: `javascript-strict-mode-epam` and `javascript-immutability-freeze-epam`.\n\n**Say this out loud:** "Strict mode turns silent failures into errors, like writes to frozen objects and accidental globals, and makes `this` `undefined` in plain calls; ES modules and classes are always strict, so modern code gets it for free."',
  },
  {
    id: 'javascript-set-explain',
    domain: 'languages',
    subject: 'javascript',
    topic: 'es-features',
    level: 'senior',
    kind: 'open',
    prompt:
      'What is the purpose of the `Set` object, and how would you use it in production code?',
    modelAnswer:
      'A `Set` is a collection of unique values of any type, iterated in insertion order, with `add`, `has`, `delete` and `size`. Uniqueness uses SameValueZero: like `===` except that `NaN` equals `NaN` (and `+0` and `-0` count as the same value), and objects are compared by reference, so two structurally equal objects are two entries. Its value is performance and intent: `has` is roughly constant time versus a linear `array.includes`, so it is the right tool for membership checks inside loops, deduplication (`[...new Set(ids)]`) and tracking visited nodes. Modern engines also ship set-algebra methods, `union`, `intersection`, `difference`, `symmetricDifference` and `isSubsetOf`, which used to need manual filtering. The gotchas: a `Set` does not deduplicate objects by content, so you dedupe records by a key with a `Map` keyed by id; `JSON.stringify` turns a `Set` into `{}`, so you convert it to an array at API boundaries; and there is no index access. `WeakSet` holds objects weakly, which is useful for tagging objects, such as marking which ones were already processed, without keeping them alive.',
    rubric: [
      'Defines a Set as unique values in insertion order with add, has, delete and size',
      'Explains SameValueZero: NaN equals itself, objects compare by reference',
      'Uses it for constant-time membership and deduplication instead of array.includes',
      'Names a gotcha or extension: object dedupe needs a key, JSON serializes it to {}, WeakSet, or the set-algebra methods',
    ],
    tags: ['epam-25', 'set', 'same-value-zero', 'performance'],
    source: 'epam-pdf',
    explanation:
      'EPAM\'s answer defines uniqueness. A senior knows **how** uniqueness is decided (SameValueZero, reference identity), **why** a `Set` beats an array for membership, and the **serialization gotcha** at API boundaries. Companion exercise: `javascript-set-semantics-epam`.\n\n**Say this out loud:** "A `Set` gives me constant-time membership and deduplication by SameValueZero, which means objects are unique by reference, so to dedupe records I key a `Map` by id, and I convert to an array before `JSON.stringify`."',
  },
];
