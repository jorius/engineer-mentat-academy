// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'typescript-basics-inference-widening',
    domain: 'languages',
    subject: 'typescript',
    topic: 'basics',
    level: 'junior',
    kind: 'single',
    prompt: '```ts\nlet a = \'open\';\nconst b = \'open\';\nconst task = { status: \'open\' };\n```\nWhat types does TypeScript infer for `a`, `b` and `task.status`?',
    options: [
      { id: 'a', text: '`string`, `"open"`, `string`' },
      { id: 'b', text: '`"open"`, `"open"`, `"open"`' },
      { id: 'c', text: '`string`, `string`, `"open"`' },
      { id: 'd', text: '`string`, `"open"`, `"open"`' },
    ],
    answer: 'a',
    tags: ['inference', 'literal-types', 'widening'],
    source: 'notion',
    explanation:
      'TypeScript infers from the initializer, then **widens** literals wherever the value could change. A `let` can be reassigned, so `a` widens to `string`; a `const` primitive cannot, so `b` keeps the literal `"open"`. Object properties are mutable even inside a `const` object, so `task.status` widens to `string`, which is why passing `task` to a function expecting `{ status: \'open\' | \'closed\' }` fails.\n\nKeep the literal with `as const`, `satisfies`, or an explicit annotation. Practical rule: let inference type locals, and annotate function parameters, exported APIs and return types of public functions so the contract is stated, not accidental.',
    hint: 'Recall when TypeScript keeps a literal type and when it widens it, and apply that to a `let`, a `const` and an object property.',
  },
  {
    id: 'typescript-basics-unknown-any-never',
    domain: 'languages',
    subject: 'typescript',
    topic: 'basics',
    level: 'mid',
    kind: 'single',
    prompt: 'Which statement about `any`, `unknown` and `never` is correct?',
    options: [
      { id: 'a', text: '`unknown` accepts any value but must be narrowed before you read properties or call it; `any` switches checking off and spreads silently; `never` has no values and is what is left in the `default` of an exhaustive `switch`.' },
      { id: 'b', text: '`unknown` is the newer name for `any`; they behave the same, but linters prefer `unknown`.' },
      { id: 'c', text: '`never` is the type of `null` and `undefined` when `strictNullChecks` is on.' },
      { id: 'd', text: '`any` is the safer choice for `JSON.parse` results because it keeps property autocompletion.' },
    ],
    answer: 'a',
    tags: ['unknown', 'any', 'never', 'type-safety'],
    source: 'notion',
    explanation:
      '- `any` opts out of type checking in both directions: it is assignable to everything and everything is callable on it, so one `any` leaks through return values and quietly disables safety downstream.\n- `unknown` is the safe **top type**: anything can go in, but nothing comes out until you narrow (`typeof`, `instanceof`, `in`, a type guard or a schema). It is the right type for `JSON.parse`, `catch` variables, API responses and LLM/tool output.\n- `never` is the **bottom type**: no value has it. It types functions that always throw and powers exhaustiveness checks (`assertNever(x: never)`).\n\n`null` and `undefined` are their own types under `strictNullChecks`, not `never`.',
    hint: 'Recall where each of these types sits in the type hierarchy, and what the compiler lets you do with a value of each.',
  },
  {
    id: 'typescript-basics-types-erased',
    domain: 'languages',
    subject: 'typescript',
    topic: 'basics',
    level: 'mid',
    kind: 'predict',
    language: 'typescript',
    prompt: 'This compiles cleanly under `strict`. What does it print at runtime, one line per `console.log` call?',
    code: `type UserId = string;
interface User {
  id: UserId;
  age: number;
}
function asUserId(value: unknown): UserId {
  return value as UserId;
}
function isUser(value: unknown): value is User {
  return value !== undefined;
}
const id = asUserId(42);
const user = JSON.parse('{"id": 7, "age": "30"}') as User;
console.log(typeof id);
console.log(typeof user.id, typeof user.age);
console.log(user.age + 1);
console.log(isUser(null));`,
    answer: 'number\nnumber string\n301\ntrue',
    tags: ['type-erasure', 'type-assertions', 'type-guards'],
    source: 'notion',
    explanation:
      'TypeScript types are **erased**: the emitted JavaScript contains no checks. `as` is an assertion ("trust me"), not a conversion, and a user-defined type guard (`value is User`) is only as honest as its body. The compiler believes `user.age` is a `number`, so `user.age + 1` type-checks, and at runtime it concatenates `"30" + 1`.\n\nThat is why data crossing a boundary (`JSON.parse`, `fetch`, env vars) must be typed `unknown` and validated at runtime, and why `as` in application code deserves a review comment.',
    hint: 'Types and `as` assertions vanish in the emitted JavaScript, so ask what the runtime values really are and what the type guard\'s body actually checks.',
  },
  {
    id: 'typescript-generics-pluck',
    domain: 'languages',
    subject: 'typescript',
    topic: 'generics',
    level: 'junior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement the generic `pluck(items, key)` so it returns the value of `key` from every item, in order. The signature is given: `K extends keyof T` means `pluck(products, \'price\')` is typed `number[]` and a typo in the key is a compile error.',
    starter: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return [];
}

type Product = { sku: string; price: number };

export function solution(items: Product[], key: keyof Product) {
  return pluck(items, key);
}`,
    tests: [
      { name: 'plucks strings', args: [[{ sku: 'a', price: 1 }, { sku: 'b', price: 2 }], 'sku'], expected: ['a', 'b'] },
      { name: 'plucks numbers', args: [[{ sku: 'a', price: 1 }, { sku: 'b', price: 2 }], 'price'], expected: [1, 2] },
      { name: 'empty list', args: [[], 'sku'], expected: [] },
    ],
    solution: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

type Product = { sku: string; price: number };

export function solution(items: Product[], key: keyof Product) {
  return pluck(items, key);
}`,
    tags: ['generics', 'keyof', 'indexed-access'],
    source: 'notion',
    explanation:
      'Generics are type parameters: the caller\'s types flow through the function instead of being erased to `any`. `K extends keyof T` **constrains** the key to real property names of `T`, and the indexed access type `T[K]` gives the exact value type for that key. The implementation is plain `map`; the value of the exercise is the signature, which makes the call site precise without overloads.',
    hint: 'The signature already does the typing; the body only has to read one key from each item and keep the order.',
  },
  {
    id: 'typescript-generics-group-by',
    domain: 'languages',
    subject: 'typescript',
    topic: 'generics',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement `groupBy(items, keyOf)`: return an object mapping each key produced by `keyOf` to the items with that key, in their original order. Only keys that occur should be present.',
    starter: `function groupBy<T, K extends PropertyKey>(items: readonly T[], keyOf: (item: T) => K): Partial<Record<K, T[]>> {
  return {};
}

type Ticket = { id: number; status: 'open' | 'closed' };

export function solution(tickets: Ticket[]) {
  return groupBy(tickets, (ticket) => ticket.status);
}`,
    tests: [
      {
        name: 'groups by status',
        args: [[{ id: 1, status: 'open' }, { id: 2, status: 'closed' }, { id: 3, status: 'open' }]],
        expected: { open: [{ id: 1, status: 'open' }, { id: 3, status: 'open' }], closed: [{ id: 2, status: 'closed' }] },
      },
      { name: 'only present keys', args: [[{ id: 5, status: 'closed' }]], expected: { closed: [{ id: 5, status: 'closed' }] } },
      { name: 'empty input', args: [[]], expected: {} },
    ],
    solution: `function groupBy<T, K extends PropertyKey>(items: readonly T[], keyOf: (item: T) => K): Partial<Record<K, T[]>> {
  const groups: Partial<Record<K, T[]>> = {};
  for (const item of items) {
    const key = keyOf(item);
    (groups[key] ??= []).push(item);
  }
  return groups;
}

type Ticket = { id: number; status: 'open' | 'closed' };

export function solution(tickets: Ticket[]) {
  return groupBy(tickets, (ticket) => ticket.status);
}`,
    tags: ['generics', 'constraints', 'inference', 'record'],
    source: 'topic-list',
    explanation:
      'Two type parameters, both **inferred** at the call site: `T` from the array, `K` from the callback\'s return type. With the `Ticket` data, `K` is `\'open\' | \'closed\'`, so the result is `Partial<Record<\'open\' | \'closed\', Ticket[]>>`.\n\n- `K extends PropertyKey` (`string | number | symbol`) is the constraint that makes `K` legal as an object key.\n- `Partial` is honest: not every possible key has a group, so reading `groups.open` forces an `undefined` check.\n- `??=` creates the bucket on first use.\n\nES2024 ships `Object.groupBy` with the same shape (returning a null-prototype object); writing it yourself is a standard generics exercise.',
    hint: 'Ask what the result needs the first time a key appears versus every later time, and how to keep each group in the original order.',
  },
  {
    id: 'typescript-generics-constraint',
    domain: 'languages',
    subject: 'typescript',
    topic: 'generics',
    level: 'junior',
    kind: 'single',
    prompt:
      '```ts\nfunction longest<T>(a: T, b: T): T {\n  return a.length >= b.length ? a : b;\n}\n```\nThis fails with `Property \'length\' does not exist on type \'T\'`. Which fix keeps the caller\'s type, so `longest(\'ab\', \'c\')` stays a string type (TypeScript infers `\'ab\' | \'c\'`) and `longest([1], [2, 3])` is a `number[]`?',
    options: [
      { id: 'a', text: '```ts\nfunction longest<T extends { length: number }>(\n  a: T,\n  b: T,\n): T\n```' },
      { id: 'b', text: '```ts\nfunction longest(\n  a: { length: number },\n  b: { length: number },\n): { length: number }\n```' },
      { id: 'c', text: 'Keep `<T>` and write `(a as any).length >= (b as any).length`' },
      { id: 'd', text: '```ts\nfunction longest<T = string>(\n  a: T,\n  b: T,\n): T\n```' },
    ],
    answer: 'a',
    tags: ['generics', 'constraints'],
    source: 'notion',
    explanation:
      'An unconstrained `T` could be anything, so the compiler only allows what is valid for *every* type. `extends { length: number }` is a **constraint**: callers can pass any type that has a numeric `length`, and `T` still carries their exact type out.\n\n- The non-generic `{ length: number }` signature compiles but erases the type: the caller gets back `{ length: number }` and loses string or array methods.\n- The `as any` cast compiles by switching checking off, so `longest(1, 2)` would compile and return garbage.\n- `<T = string>` sets a **default**, not a constraint; it does not tell the compiler anything about `length`.',
    hint: 'Recall the ways to tell the compiler what a generic value supports, then check what type each option hands back to the caller.',
  },
  {
    id: 'typescript-interface-vs-type-open',
    domain: 'languages',
    subject: 'typescript',
    topic: 'aliases-vs-interfaces',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your team is writing its TypeScript style guide. When do you use `interface` and when `type`? Defend a default and name the cases where the choice actually matters.',
    modelAnswer:
      'For plain object shapes they are almost interchangeable, so the choice matters only at the edges. `interface` supports **declaration merging**, which is how you augment library types (`Window`, Express `Request`, a module\'s types), but the same feature means two same-named interfaces silently combine, where a duplicate `type` is an error. `interface extends` checks conflicts eagerly and reports a clear error, whereas an intersection (`A & B`) with conflicting property types silently produces `never` properties. The compiler caches interface relationships by name, which helps type-check performance and error readability in large codebases. `type` is required for everything that is not a plain object shape: unions and discriminated unions, tuples, primitive aliases, function types, mapped, conditional and template literal types. My default is `interface` for public object contracts that others extend or augment and `type` for unions, compositions and derived types; a team that uses `type` everywhere except where merging is needed is also fine. The real rule is consistency enforced by a lint rule (`consistent-type-definitions`), not debating it per pull request.',
    rubric: [
      'Declaration merging is interface-only, and when it helps (augmentation) or hurts (accidental merges)',
      'Unions, tuples, mapped and conditional types require `type`',
      '`extends` reports conflicts while intersections can silently produce `never`',
      'Mentions compiler performance or error readability for interfaces in large codebases',
      'States a concrete team default and enforcement, not just "it depends"',
    ],
    tags: ['interface', 'type-alias', 'declaration-merging', 'style-guide'],
    source: 'notion',
    explanation:
      'Interviewers use this to separate people who repeat "interfaces are for objects" from people who know the mechanical differences (merging, conflict reporting, what only aliases can express) and can turn them into a team rule.\n\n**Say this out loud:** "They are interchangeable for object shapes; I use `interface` where I want extension or module augmentation, `type` for unions and derived types, and I let a lint rule enforce the default so we never argue about it in review."',
    hint: 'Pick a default, then name the mechanical differences: declaration merging, how conflicts are reported when extending, and what only type aliases can express.',
  },
  {
    id: 'typescript-declaration-merging',
    domain: 'languages',
    subject: 'typescript',
    topic: 'aliases-vs-interfaces',
    level: 'junior',
    kind: 'single',
    prompt: '```ts\ninterface Box {\n  width: number;\n}\ninterface Box {\n  height: number;\n}\nconst box: Box = { width: 10 };\n```\nWhat does the compiler report?',
    options: [
      { id: 'a', text: 'Property `height` is missing: the two declarations merged, so `Box` requires both `width` and `height`.' },
      { id: 'b', text: 'Duplicate identifier `Box`.' },
      { id: 'c', text: 'Nothing: the first declaration wins and `height` is ignored.' },
      { id: 'd', text: 'Object literal may only specify known properties: `width` does not exist, because the second declaration replaced the first.' },
    ],
    answer: 'a',
    tags: ['interface', 'declaration-merging'],
    source: 'notion',
    explanation:
      'Interfaces with the same name in the same scope **merge** their members. That is deliberate: it is how `declare global { interface Window { analytics: Analytics } }` or Express request augmentation work.\n\nThe same code with `type Box = ...` twice fails with *Duplicate identifier*: type aliases are closed. Merging is also the risk: an accidental second `interface User` somewhere in scope quietly changes the shape everyone depends on.',
    hint: 'Recall what TypeScript does with two interfaces of the same name in the same scope, and how that differs from two type aliases.',
  },
  {
    id: 'typescript-enum-runtime-output',
    domain: 'languages',
    subject: 'typescript',
    topic: 'enums',
    level: 'mid',
    kind: 'predict',
    language: 'typescript',
    prompt: 'Enums are one of the few TypeScript features that emit runtime code. What does this print, one line per `console.log` call?',
    code: `enum Status {
  Draft,
  Published = 5,
  Archived,
}
enum Color {
  Red = 'RED',
  Blue = 'BLUE',
}
console.log(Status.Draft, Status.Archived);
console.log(Status[5]);
console.log(Object.keys(Status).join(','));
console.log(Object.values(Color).join(','));
const raw: string = 'RED';
console.log(raw === Color.Red, Color['RED' as keyof typeof Color]);`,
    answer: '0 6\nPublished\n0,5,6,Draft,Published,Archived\nRED,BLUE\ntrue undefined',
    tags: ['enums', 'reverse-mapping', 'runtime'],
    source: 'notion',
    explanation:
      'A numeric enum compiles to an object with **both directions**: `Status.Draft === 0` and `Status[0] === \'Draft\'`. Members auto-increment from the previous value, so `Archived` is `6`. Because of the reverse entries, `Object.keys` returns six keys (integer-like keys first, in ascending order), which breaks naive "iterate the enum" code.\n\nString enums have **no reverse mapping**: `Color` has keys `Red` and `Blue`, so looking up `\'RED\'` gives `undefined`. At runtime a string enum value is just the string, so comparing with a plain string works, but TypeScript will not let you *assign* `\'RED\'` to a `Color` without a cast, because enums are nominal.',
    hint: 'Numeric enums emit an object with reverse mappings and auto-increment from the previous member; string enums get no reverse entries.',
  },
  {
    id: 'typescript-as-const-satisfies',
    domain: 'languages',
    subject: 'typescript',
    topic: 'enums',
    level: 'senior',
    kind: 'predict',
    language: 'typescript',
    prompt: 'This is the common "enum without `enum`" pattern. What does it print, one line per `console.log` call?',
    code: `const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number];
function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
const routes = {
  home: '/',
  user: '/users/:id',
} satisfies Record<string, \`/\${string}\`>;
console.log(ROLES.length, isRole('editor'), isRole('owner'));
console.log(routes.user.split('/').length);
(ROLES as unknown as string[]).push('owner');
console.log(ROLES.length, isRole('owner'));
console.log(Object.isFrozen(ROLES));`,
    answer: '3 true false\n3\n4 true\nfalse',
    tags: ['as-const', 'satisfies', 'literal-types', 'type-guards'],
    source: 'notion',
    explanation:
      '`as const` makes the compiler infer the **narrowest** type: a `readonly` tuple of literals, from which `(typeof ROLES)[number]` derives the union `\'admin\' | \'editor\' | \'viewer\'`. One array is both the runtime list (for validation and dropdowns) and the type. But `readonly` exists only at compile time: one cast later, `push` succeeds and the array is not frozen. If you need runtime immutability, add `Object.freeze`.\n\n`satisfies` checks the value against a type **without widening** it: every route must start with `/`, yet `routes` keeps its exact keys, so `routes.user` autocompletes and `routes.missing` is a compile error. Annotating `const routes: Record<string, ...>` instead would accept any key and lose that precision.\n\n**Say this out loud:** "`as const` and `satisfies` are compile-time only: `as const` narrows literals and adds readonly without freezing anything, and `satisfies` validates a value against a type while keeping its inferred shape."',
    hint: '`as const` and `readonly` exist only at compile time; ask what the emitted JavaScript does when code mutates the array or searches it.',
  },
  {
    id: 'typescript-enum-vs-union',
    domain: 'languages',
    subject: 'typescript',
    topic: 'enums',
    level: 'mid',
    kind: 'single',
    prompt: 'Many teams prefer `type Status = \'open\' | \'closed\'` (often derived from an `as const` array) over `enum Status`. What is the best reason?',
    options: [
      { id: 'a', text: 'A literal union is erased, matches plain JSON strings with no conversion and needs no special compiler support; an enum emits a runtime object, is nominal (a plain `\'open\'` is not assignable to it), and `const enum` breaks with single-file transpilers.' },
      { id: 'b', text: 'Unions run faster because engines optimize string comparisons better than property lookups.' },
      { id: 'c', text: 'Enums cannot be used in `switch` statements or exhaustiveness checks.' },
      { id: 'd', text: 'A union can be iterated at runtime with `Object.values`, and an enum cannot.' },
    ],
    answer: 'a',
    tags: ['enums', 'literal-types', 'isolated-modules'],
    source: 'notion',
    explanation:
      'Enums are one of the few non-erasable TypeScript features. That shows up as friction: values arriving as JSON strings must be cast to the enum; `const enum` is inlined across files, which Babel, esbuild and `isolatedModules` cannot do; and Node\'s built-in type stripping (and `--erasableSyntaxOnly`) rejects enums altogether.\n\nA union of literals has none of that, and pairing it with an `as const` array gives you the runtime list back. The claim that only a union can be iterated with `Object.values` is backwards: an enum *is* a runtime object you can iterate (reverse mappings included), while a union type does not exist at runtime at all.',
    hint: 'Think about what each form becomes after compilation and how the compiler treats values of each, then test every claim against that.',
  },
  {
    id: 'typescript-discriminated-union-render',
    domain: 'languages',
    subject: 'typescript',
    topic: 'unions-and-narrowing',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement `solution(state)` for this discriminated union: `idle` returns `Start a search`, `loading` returns `Loading`, `success` returns `<n> results` (the length of `data`), and `error` returns `Error: <error>`. Switch on the discriminant and end with the `assertNever` exhaustiveness guard.',
    starter: `type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: string };

function assertNever(value: never): never {
  throw new Error('Unhandled state: ' + JSON.stringify(value));
}

export function solution(state: RequestState): string {
  return '';
}`,
    tests: [
      { name: 'idle', args: [{ status: 'idle' }], expected: 'Start a search' },
      { name: 'loading', args: [{ status: 'loading' }], expected: 'Loading' },
      { name: 'success', args: [{ status: 'success', data: ['a', 'b', 'c'] }], expected: '3 results' },
      { name: 'error', args: [{ status: 'error', error: 'timeout' }], expected: 'Error: timeout' },
    ],
    solution: `type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: string };

function assertNever(value: never): never {
  throw new Error('Unhandled state: ' + JSON.stringify(value));
}

export function solution(state: RequestState): string {
  switch (state.status) {
    case 'idle':
      return 'Start a search';
    case 'loading':
      return 'Loading';
    case 'success':
      return state.data.length + ' results';
    case 'error':
      return 'Error: ' + state.error;
    default:
      return assertNever(state);
  }
}`,
    tags: ['discriminated-unions', 'narrowing', 'exhaustiveness', 'never'],
    source: 'notion',
    explanation:
      'A shared literal field (the **discriminant**, here `status`) lets the compiler narrow each `case` to exactly one member, so `state.data` exists only in `success` and `state.error` only in `error`.\n\nThis *makes illegal states unrepresentable*: compare the usual `{ isLoading: boolean; data?: T; error?: string }` bag, which allows loading-with-an-error and success-without-data. The `default` branch receives `never` once every case is handled; add a `cancelled` state later and `assertNever(state)` becomes a **compile error** at every switch that forgot it.',
    hint: '`switch` on `state.status` so each `case` narrows to one member, and pass the value to `assertNever` in the `default`.',
  },
  {
    id: 'typescript-narrow-unknown-error',
    domain: 'languages',
    subject: 'typescript',
    topic: 'unions-and-narrowing',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'In a `catch` block the error is `unknown`: anything can be thrown. Implement `toMessage(error)`: for an `Error`, return its `message`; for a string, return the string; for any other object with a **string** `message` property, return that; otherwise return `Unknown error`. Use narrowing, not `as`.',
    starter: `function toMessage(error: unknown): string {
  return 'Unknown error';
}

export function solution(thrown: unknown): string {
  try {
    throw thrown;
  } catch (error) {
    return toMessage(error);
  }
}`,
    tests: [
      { name: 'thrown string', args: ['timeout'], expected: 'timeout' },
      { name: 'error-like object', args: [{ message: 'bad gateway' }], expected: 'bad gateway' },
      { name: 'non-string message', args: [{ message: 42 }], expected: 'Unknown error' },
      { name: 'null', args: [null], expected: 'Unknown error' },
      { name: 'number', args: [7], expected: 'Unknown error' },
    ],
    solution: `function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unknown error';
}

export function solution(thrown: unknown): string {
  try {
    throw thrown;
  } catch (error) {
    return toMessage(error);
  }
}`,
    tags: ['narrowing', 'unknown', 'type-guards', 'error-handling'],
    source: 'notion',
    explanation:
      'Under `strict` (`useUnknownInCatchVariables`) catch variables are `unknown`, because JavaScript lets you throw anything. Each check narrows the type for the code that follows:\n\n- `instanceof` narrows to the class.\n- `typeof error === \'string\'` narrows to `string`.\n- `typeof error === \'object\'` still includes `null` (the old `typeof null` bug), so the null check is required.\n- Since TypeScript 4.9, `\'message\' in error` narrows to `object & Record<\'message\', unknown>`, and the final `typeof` check makes it a string.\n\nWriting `(error as Error).message` compiles but crashes or lies on exactly the inputs this handler exists for.',
    hint: 'Recall the narrowing checks TypeScript understands (`instanceof`, `typeof`, `in`), and rule out `null` before reading a property of an object.',
  },
  {
    id: 'typescript-optional-zero-fix',
    domain: 'languages',
    subject: 'typescript',
    topic: 'optional-fields',
    level: 'junior',
    kind: 'fix',
    language: 'typescript',
    prompt:
      'An inventory report says `bolts: not tracked` even though the warehouse has zero bolts on record. Fix the check so only a **missing** or `null` quantity counts as untracked.',
    starter: `type StockLine = { name: string; quantity?: number | null };

export function solution(line: StockLine): string {
  if (!line.quantity) {
    return line.name + ': not tracked';
  }
  return line.name + ': ' + line.quantity;
}`,
    tests: [
      { name: 'zero is a real quantity', args: [{ name: 'bolts', quantity: 0 }], expected: 'bolts: 0' },
      { name: 'missing is untracked', args: [{ name: 'nuts' }], expected: 'nuts: not tracked' },
      { name: 'null is untracked', args: [{ name: 'pins', quantity: null }], expected: 'pins: not tracked' },
      { name: 'positive quantity', args: [{ name: 'rods', quantity: 12 }], expected: 'rods: 12' },
    ],
    solution: `type StockLine = { name: string; quantity?: number | null };

export function solution(line: StockLine): string {
  if (line.quantity === undefined || line.quantity === null) {
    return line.name + ': not tracked';
  }
  return line.name + ': ' + line.quantity;
}`,
    tags: ['optional-properties', 'truthiness', 'narrowing'],
    source: 'topic-list',
    explanation:
      'Truthiness narrowing removes `undefined` and `null` from the type, so the buggy check looks fine to the compiler, but at runtime it also rejects the falsy numbers `0` and `NaN`. For an optional number, check for nullish explicitly (`=== undefined || === null`, or the idiomatic `line.quantity == null`), or use `??` when you want a fallback value (`line.quantity ?? \'n/a\'`) instead of `||`.',
    hint: 'Truthiness also rejects `0`; ask which comparison matches only the nullish values.',
  },
  {
    id: 'typescript-optional-vs-undefined',
    domain: 'languages',
    subject: 'typescript',
    topic: 'optional-fields',
    level: 'mid',
    kind: 'single',
    prompt: '```ts\ntype First = { nickname?: string };\ntype Second = { nickname: string | undefined };\n```\nWith `strict` on (and `exactOptionalPropertyTypes` off), what is the difference between these two types?',
    options: [
      { id: 'a', text: 'The first lets callers omit the key; the second requires the key to be present, although its value may be `undefined`. Turning on `exactOptionalPropertyTypes` also stops the first from accepting an explicit `nickname: undefined`.' },
      { id: 'b', text: 'There is no difference; `?` is shorthand for `| undefined`.' },
      { id: 'c', text: 'The first also accepts `null`; the second does not.' },
      { id: 'd', text: 'The second lets callers omit the key; the first requires it.' },
    ],
    answer: 'a',
    tags: ['optional-properties', 'exact-optional-property-types', 'strict'],
    source: 'topic-list',
    explanation:
      '`?` means **the key may be absent**; `| undefined` means **the value may be undefined**. Reading either gives `string | undefined`, but only the optional one can be left out of an object literal. Neither accepts `null`; you have to add `| null` explicitly.\n\nThe difference matters whenever presence is meaningful: `\'nickname\' in obj`, `Object.keys`, object spread and PATCH semantics ("absent means unchanged, `null` means clear"; an explicit `undefined` disappears in `JSON.stringify`, so it cannot carry meaning over the wire). By default TypeScript lets `nickname?: string` receive an explicit `undefined`; `exactOptionalPropertyTypes` tightens that so the type describes what the runtime actually sees.',
    hint: 'Write an object literal for each type, with and without the key, and recall what `exactOptionalPropertyTypes` tightens.',
  },
  {
    id: 'typescript-partial-spread-undefined',
    domain: 'languages',
    subject: 'typescript',
    topic: 'optional-fields',
    level: 'senior',
    kind: 'predict',
    language: 'typescript',
    prompt: 'A settings screen merges a `Partial` patch over defaults. This compiles under `strict`. What does it print, one line per `console.log` call?',
    code: `type Settings = { theme: string; fontSize: number };
const defaults: Settings = { theme: 'dark', fontSize: 14 };
const patch: Partial<Settings> = { theme: undefined, fontSize: 16 };
const merged: Settings = { ...defaults, ...patch };
console.log(merged.theme, merged.fontSize);
console.log('theme' in patch, Object.keys(patch).length);
const cleaned: Partial<Settings> = Object.fromEntries(
  Object.entries(patch).filter(([, value]) => value !== undefined),
);
const safe: Settings = { ...defaults, ...cleaned };
console.log(safe.theme, safe.fontSize);`,
    answer: 'undefined 16\ntrue 2\ndark 16',
    tags: ['partial', 'spread', 'exact-optional-property-types', 'soundness'],
    source: 'topic-list',
    explanation:
      '`Partial<Settings>` makes every key optional, and without `exactOptionalPropertyTypes` an optional key also accepts an explicit `undefined`. Object spread copies **own** properties, including ones whose value is `undefined`, so `theme: undefined` overwrites the default.\n\nThe compiler still types `merged.theme` as `string`: it models an optional property in a spread as "maybe missing", not "maybe present and undefined". That is a known unsoundness, and it ships `undefined` into code that trusts the type.\n\nFixes: strip `undefined` entries before merging (as above), enable `exactOptionalPropertyTypes` so `{ theme: undefined }` is rejected, or merge field by field with `??`.\n\n**Say this out loud:** "An optional property and a property set to `undefined` are different at runtime; spread copies the `undefined`, TypeScript does not model it by default, and `exactOptionalPropertyTypes` is how you make the type match the runtime."',
    hint: 'Object spread copies own properties even when their value is empty, and without `exactOptionalPropertyTypes` a `Partial` key accepts an explicit `undefined`.',
  },
  {
    id: 'typescript-pick-omit-runtime',
    domain: 'languages',
    subject: 'typescript',
    topic: 'utility-types',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'The built-in `Pick<T, K>` and `Omit<T, K>` only exist at compile time. Implement runtime `pick` and `omit` whose return types are those utility types, so `solution` returns a card with only `id` and `name`, and a public user **without** `passwordHash`.',
    starter: `function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  return source;
}

function omit<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K> {
  return source;
}

type User = { id: number; name: string; email: string; passwordHash: string };

export function solution(user: User) {
  return {
    card: pick(user, ['id', 'name']),
    publicUser: omit(user, ['passwordHash']),
  };
}`,
    tests: [
      {
        name: 'picks and omits',
        args: [{ id: 1, name: 'Ana', email: 'ana@example.com', passwordHash: 'h1' }],
        expected: { card: { id: 1, name: 'Ana' }, publicUser: { id: 1, name: 'Ana', email: 'ana@example.com' } },
      },
      {
        name: 'second user',
        args: [{ id: 2, name: 'Bo', email: 'bo@example.com', passwordHash: 'h2' }],
        expected: { card: { id: 2, name: 'Bo' }, publicUser: { id: 2, name: 'Bo', email: 'bo@example.com' } },
      },
    ],
    solution: `function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = source[key];
  }
  return result;
}

function omit<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys);
  return Object.fromEntries(Object.entries(source).filter(([key]) => !excluded.has(key))) as Omit<T, K>;
}

type User = { id: number; name: string; email: string; passwordHash: string };

export function solution(user: User) {
  return {
    card: pick(user, ['id', 'name']),
    publicUser: omit(user, ['passwordHash']),
  };
}`,
    tags: ['pick', 'omit', 'mapped-types', 'dto'],
    source: 'notion',
    explanation:
      '`Pick<T, K>` is the mapped type `{ [P in K]: T[P] }`; `Omit<T, K>` is `Pick<T, Exclude<keyof T, K>>`. The starter shows why types alone are not enough: returning `source` **type-checks** (a `User` is structurally assignable to both), yet the `passwordHash` still goes over the wire. Structural typing allows extra properties, so a DTO type never strips data; only runtime code does.\n\nThe implementations need one internal cast because `Object.fromEntries` loses key information; keeping that cast inside a small, tested helper is what gives callers exact types. This pairing (derive the DTO type with `Pick`/`Omit`, build it with a real copy) is the standard way to shape API responses.',
    hint: 'Build a new object instead of mutating; ask which keys each function copies and how to test membership in the key list.',
  },
  {
    id: 'typescript-utility-types-equivalence',
    domain: 'languages',
    subject: 'typescript',
    topic: 'utility-types',
    level: 'senior',
    kind: 'multi',
    prompt:
      '```ts\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n```\nYou need this PATCH payload type:\n```ts\ntype UserPatch = {\n  name?: string;\n  email?: string;\n};\n```\nWhich of these produce exactly that type? Select all that apply.',
    options: [
      { id: 'a', text: '`Partial<Omit<User, \'id\'>>`' },
      { id: 'b', text: '`Omit<Partial<User>, \'id\'>`' },
      { id: 'c', text: '`Exclude<Partial<User>, \'id\'>`' },
      { id: 'd', text: '`Pick<Partial<User>, \'name\' | \'email\'>`' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['partial', 'omit', 'pick', 'exclude', 'homomorphic-mapped-types'],
    source: 'notion',
    explanation:
      '- `Partial<Omit<User, \'id\'>>`: remove `id`, then make the rest optional.\n- `Omit<Partial<User>, \'id\'>`: make everything optional, then remove `id`. `Omit` is built on `Pick`, and `Pick` is a *homomorphic* mapped type (it iterates over `keyof T`), so it **preserves** the `?` and `readonly` modifiers it finds.\n- `Pick<Partial<User>, \'name\' | \'email\'>`: the same modifier preservation, with the keys listed explicitly.\n- `Exclude<Partial<User>, \'id\'>` is the classic confusion: `Exclude<U, E>` filters members out of a **union**. `Partial<User>` is a single object type, not a union containing `\'id\'`, so nothing is excluded and `id?` stays.\n\n**Say this out loud:** "`Omit` and `Pick` work on keys of an object type, `Exclude` and `Extract` work on members of a union, and homomorphic mapped types like `Pick` and `Partial` preserve optional and readonly modifiers, so the order of composition often does not matter."',
    hint: 'Expand each option one utility at a time, from the inside out, and write down the object type that results.',
  },
  {
    id: 'typescript-deep-readonly-freeze',
    domain: 'languages',
    subject: 'typescript',
    topic: 'utility-types',
    level: 'senior',
    kind: 'code',
    language: 'typescript',
    prompt:
      '`DeepReadonly<T>` is a recursive mapped type that makes every nested property `readonly` at compile time. Implement `deepFreeze` so the runtime keeps the same promise: the object and every nested object or array must be frozen. `solution` reports `Object.isFrozen` for the root, a nested object and a nested array.',
    starter: `type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  return value as DeepReadonly<T>;
}

type Config = { name: string; limits: { rpm: number; burst: { size: number } }; hosts: string[] };

export function solution(config: Config) {
  const frozen = deepFreeze(structuredClone(config));
  return [Object.isFrozen(frozen), Object.isFrozen(frozen.limits.burst), Object.isFrozen(frozen.hosts)];
}`,
    tests: [
      {
        name: 'freezes every level',
        args: [{ name: 'api', limits: { rpm: 60, burst: { size: 10 } }, hosts: ['a', 'b'] }],
        expected: [true, true, true],
      },
      {
        name: 'freezes empty nested values',
        args: [{ name: 'job', limits: { rpm: 1, burst: { size: 0 } }, hosts: [] }],
        expected: [true, true, true],
      },
    ],
    solution: `type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) {
      deepFreeze((value as Record<PropertyKey, unknown>)[key]);
    }
  }
  return value as DeepReadonly<T>;
}

type Config = { name: string; limits: { rpm: number; burst: { size: number } }; hosts: string[] };

export function solution(config: Config) {
  const frozen = deepFreeze(structuredClone(config));
  return [Object.isFrozen(frozen), Object.isFrozen(frozen.limits.burst), Object.isFrozen(frozen.hosts)];
}`,
    tags: ['mapped-types', 'conditional-types', 'readonly', 'object-freeze'],
    source: 'topic-list',
    explanation:
      'The type combines a **conditional type** (functions pass through untouched, objects recurse, primitives stay as they are) with a **mapped type** that adds `readonly` to every key. It distributes over unions and works for arrays too, because a homomorphic mapped type over an array type produces a readonly array.\n\nBut `readonly` is erased: a cast or a plain JavaScript caller can still mutate. `Object.freeze` is the runtime half, and it is **shallow**, so the implementation must recurse (`Reflect.ownKeys` also covers symbol keys; the `isFrozen` check stops cycles and repeated work, but it also skips the children of an object that was already frozen shallowly, so a production helper tracks visited objects in a `WeakSet` instead). The final `as` is unavoidable: the compiler cannot prove that a runtime loop satisfies a recursive type.\n\n**Say this out loud:** "Utility and mapped types describe shapes at compile time only; when the guarantee has to hold at runtime I pair the type with code that enforces it, and I keep the one unavoidable cast inside that helper."',
    hint: '`Object.freeze` is shallow; ask what has to happen to every nested value and how to recognize one that needs the same treatment.',
  },
  {
    id: 'typescript-boundary-validation-open',
    domain: 'languages',
    subject: 'typescript',
    topic: 'boundaries',
    level: 'senior',
    kind: 'open',
    prompt:
      'A service consumes JSON from a third-party webhook and from an LLM tool call. Today the code does this:\n```ts\nconst event = (await res.json()) as OrderEvent;\n```\nWhat is wrong with that, and how do you type these boundaries properly?',
    modelAnswer:
      'The `as` cast is an unchecked assertion: types are erased, so malformed data flows deep into the system and fails far from its cause, or worse, gets persisted. A hand-written type predicate (`value is OrderEvent`) is no safer: the compiler trusts whatever its body returns. Everything that crosses a trust boundary (HTTP bodies, webhooks, queue messages, env vars, `localStorage`, LLM or tool output) should enter as `unknown` and be **parsed** at the edge with a runtime schema such as zod, valibot or ajv. I derive the static type from the schema (`type OrderEvent = z.infer<typeof OrderEvent>`) so the validator and the type cannot drift. Parse, don\'t validate: the parser returns a typed value or a structured error, and past the edge the domain code never sees `unknown` again. The failure path is explicit: a 400 for synchronous APIs, a dead-letter queue for webhooks and messages, a bounded retry or repair prompt for LLM output, and a log with the correlation id in every case. I also decide per boundary whether unknown keys are stripped or rejected, and version the schema when the producer changes. Env config gets the same treatment at startup so the process fails fast instead of at the first request.',
    rubric: [
      '`as` and type predicates are unchecked; types are erased at runtime',
      'Receive boundary data as `unknown` and parse it with a runtime schema at the edge',
      'Derive the static type from the schema so there is one source of truth',
      'Defines the failure path: 4xx, dead-letter queue, retries or repair, logging',
      'Applies it beyond HTTP: LLM/tool output, messages, env config',
    ],
    tags: ['runtime-validation', 'zod', 'unknown', 'llm-output', 'boundaries'],
    source: 'notion',
    explanation:
      'This is the architect-level TypeScript question: the type system is a compile-time tool and **guarantees nothing about external data**. Strong answers name the mechanism (schema parse at the edge, inferred types), the operational failure path, and include non-HTTP boundaries.\n\n**Say this out loud:** "Types are erased, so at every boundary I take `unknown`, parse it with a schema and infer the type from that schema; bad input fails fast at the edge with a clear error instead of three layers deep."',
    hint: 'Start from the fact that types guarantee nothing about external data, then cover runtime schema parsing at the edge, inferred types, the failure path, and non-HTTP boundaries.',
  },
  {
    id: 'typescript-parse-untrusted-tickets',
    domain: 'languages',
    subject: 'typescript',
    topic: 'boundaries',
    level: 'senior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Replace the lying cast with real validation. `solution(json)` must return only the valid tickets from a JSON string: `id` is a non-empty string, `status` is `open`, `pending` or `closed`, and `priority` is either absent or a finite number. Invalid JSON or a non-array payload returns `[]`. Write a `value is Ticket` guard that starts from `unknown`.',
    starter: `type Ticket = { id: string; status: 'open' | 'pending' | 'closed'; priority?: number };

export function solution(json: string): Ticket[] {
  return JSON.parse(json) as Ticket[];
}`,
    tests: [
      {
        name: 'keeps valid tickets',
        args: ['[{"id":"t1","status":"open"},{"id":"t2","status":"closed","priority":2}]'],
        expected: [{ id: 't1', status: 'open' }, { id: 't2', status: 'closed', priority: 2 }],
      },
      {
        name: 'drops invalid tickets',
        args: ['[{"id":"t1","status":"done"},{"status":"open"},{"id":"t3","status":"pending","priority":"high"},{"id":"t4","status":"pending"}]'],
        expected: [{ id: 't4', status: 'pending' }],
      },
      { name: 'non-array payload', args: ['{"id":"t1","status":"open"}'], expected: [] },
      { name: 'invalid JSON', args: ['not json'], expected: [] },
    ],
    solution: `type Ticket = { id: string; status: 'open' | 'pending' | 'closed'; priority?: number };

const STATUSES: readonly unknown[] = ['open', 'pending', 'closed'];

function isTicket(value: unknown): value is Ticket {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    STATUSES.includes(candidate.status) &&
    (candidate.priority === undefined || (typeof candidate.priority === 'number' && Number.isFinite(candidate.priority)))
  );
}

export function solution(json: string): Ticket[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  return Array.isArray(data) ? data.filter(isTicket) : [];
}`,
    tags: ['type-guards', 'unknown', 'runtime-validation', 'json'],
    source: 'notion',
    explanation:
      '`JSON.parse` returns `any`; assigning it to `unknown` first forces every use through a check. A **user-defined type guard** (`value is Ticket`) connects a runtime check to compile-time narrowing, and passing it to `filter` gives a `Ticket[]` with no cast at the call site.\n\nThe guard is only as honest as its body, which is exactly why production code generates it from a schema (zod\'s `Ticket.safeParse`) instead of writing it by hand. Decide the policy explicitly, too: here invalid items are dropped; an API that must reject the whole payload would return an error instead, and either way you should log what was rejected.\n\n**Say this out loud:** "`as` tells the compiler to trust me; a type guard or schema makes the runtime prove it, and I only trust data after it has been proven."',
    hint: 'Start from `unknown`, handle the ways the whole payload can be unusable before looking at items, and let a `value is Ticket` guard narrow each item field by field.',
  },
];
