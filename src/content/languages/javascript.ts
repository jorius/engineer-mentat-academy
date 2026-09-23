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
];
