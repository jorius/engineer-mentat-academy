// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'design-patterns-builder-recognition',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'creational',
    level: 'junior',
    kind: 'single',
    prompt:
      "```js\nconst request = new RequestBuilder()\n  .url('/orders')\n  .method('POST')\n  .header('Idempotency-Key', key)\n  .timeout(2000)\n  .build();\n```\nWhich pattern is this, and what problem does it solve?",
    options: [
      { id: 'a', text: 'Builder: assembles a complex object step by step, replacing a constructor with many optional positional arguments' },
      { id: 'b', text: 'Factory Method: each chained call picks which subclass of `Request` to instantiate' },
      { id: 'c', text: 'Decorator: each chained call wraps the request in a new object that adds behavior' },
      { id: 'd', text: 'Chain of Responsibility: each call passes the request to the next handler until one accepts it' },
    ],
    answer: 'a',
    tags: ['builder', 'fluent-interface'],
    source: 'notion',
    explanation:
      'A Builder is recognizable by a single creation method (`build()`/`create()`) and several configuration methods that usually return `this` so they chain. It exists to kill the *telescoping constructor* (`new Request(url, method, headers, undefined, 2000, true)`) and to let `build()` validate the whole object once. Returning `this` makes it fluent, but fluency alone is not the pattern: a Decorator returns a *new wrapper* with the same interface, and a Chain of Responsibility passes a request between handlers at run time.',
  },
  {
    id: 'design-patterns-vehicle-factory-falsy-defaults',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'creational',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'A config-driven `VehicleFactory` uses `||` for defaults, like the classic tutorial version. What does this print, one line per `console.log`?',
    code: `class Vehicle {
  constructor({ type, doors, wheels, state }) {
    this.type = type || 'vehicle';
    this.doors = doors || 4;
    this.wheels = wheels ?? 4;
    this.state = state || 'new';
  }
}

class Motorcycle extends Vehicle {
  constructor(options) {
    super({ ...options, type: 'motorcycle' });
  }
}

const factory = {
  createVehicle(options) {
    return options.vehicleType === 'motorcycle' ? new Motorcycle(options) : new Vehicle(options);
  },
};

const bike = factory.createVehicle({ vehicleType: 'motorcycle', doors: 0, wheels: 2, state: '' });
console.log(bike.type);
console.log(bike.doors);
console.log(bike.wheels);
console.log(bike.state);

const trailer = factory.createVehicle({ vehicleType: 'trailer', doors: 0, wheels: 0 });
console.log(trailer.doors, trailer.wheels);`,
    answer: 'motorcycle\n4\n2\nnew\n4 0',
    tags: ['factory', 'nullish-coalescing', 'defaults'],
    source: 'notion',
    explanation:
      '`||` falls back on **any falsy value**, so a legitimate `0` doors or an explicit empty `state` is silently replaced by the default (4 and `"new"`). `??` only falls back on `null`/`undefined`, which is why `wheels: 0` survives on the trailer. The subclass wins on `type` because its spread puts `type: "motorcycle"` *after* `...options`. In a factory that builds objects from external config this is a real data-corruption bug: prefer `??` or destructuring defaults (`{ doors = 4 }`), which also only apply for `undefined`.',
  },
  {
    id: 'design-patterns-factory-registry-prototype-keys',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'creational',
    level: 'senior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      "The team replaced the factory's `switch` with a lookup map so new vehicle types are added by registering a creator (open-closed). Unknown types must fall back to a generic `vehicle` with 4 doors. A fuzz test sending `vehicleType` values such as `'constructor'` and `'__proto__'` now fails. Fix `createVehicle` so the lookup only ever uses **registered** creators. Keep `solution` as is.",
    starter: `class Vehicle {
  constructor(type, options) {
    this.type = type;
    this.doors = options.doors ?? 4;
  }
}

const creators = {
  car: (options) => new Vehicle('car', options),
  truck: (options) => new Vehicle('truck', { ...options, doors: options.doors ?? 2 }),
};

function createVehicle(options) {
  const create = creators[options.vehicleType] || ((o) => new Vehicle('vehicle', o));
  return create(options);
}

export function solution(options) {
  const vehicle = createVehicle(options);
  return { type: vehicle.type, doors: vehicle.doors };
}`,
    tests: [
      { name: 'car keeps its doors', args: [{ vehicleType: 'car', doors: 2 }], expected: { type: 'car', doors: 2 } },
      { name: 'truck defaults to 2 doors', args: [{ vehicleType: 'truck' }], expected: { type: 'truck', doors: 2 } },
      { name: 'unknown type falls back', args: [{ vehicleType: 'boat' }], expected: { type: 'vehicle', doors: 4 } },
      { name: 'constructor is not a creator', args: [{ vehicleType: 'constructor' }], expected: { type: 'vehicle', doors: 4 } },
      { name: '__proto__ is not a creator', args: [{ vehicleType: '__proto__' }], expected: { type: 'vehicle', doors: 4 } },
    ],
    solution: `class Vehicle {
  constructor(type, options) {
    this.type = type;
    this.doors = options.doors ?? 4;
  }
}

const creators = new Map([
  ['car', (options) => new Vehicle('car', options)],
  ['truck', (options) => new Vehicle('truck', { ...options, doors: options.doors ?? 2 })],
]);

function createVehicle(options) {
  const create = creators.get(options.vehicleType) ?? ((o) => new Vehicle('vehicle', o));
  return create(options);
}

export function solution(options) {
  const vehicle = createVehicle(options);
  return { type: vehicle.type, doors: vehicle.doors };
}`,
    tags: ['factory', 'registry', 'open-closed', 'prototype-pollution'],
    source: 'notion',
    explanation:
      "A plain object literal inherits from `Object.prototype`, so `creators['constructor']` is the `Object` function (which returns its argument unchanged), `creators['toString']` is a method, and `creators['__proto__']` is `Object.prototype` itself: not callable, so the factory throws. Any key that comes from user input or config must be looked up in a structure that only contains what you registered: a `Map`, an `Object.create(null)` dictionary, or an `Object.hasOwn(creators, type)` guard.\n\nThe registry itself is the right move: it turns the factory into something you extend by adding an entry rather than editing a `switch` (open-closed), and it lets plugins register their own types.\n\n**Say this out loud:** \"A factory-by-config map is how I keep creation open for extension, but the lookup must be an own-key lookup: a `Map` or `Object.hasOwn`, never a bare object index on untrusted input.\"",
  },
  {
    id: 'design-patterns-singleton-module-closure',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'creational',
    level: 'junior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      'Every caller of `getConfig()` should share **one** configuration object, created lazily on first use. Right now each call builds a new one. Fix `getConfig` using a module-level closure (no class needed). Keep `createConfig` and `solution` unchanged.',
    starter: `let created = 0;

function createConfig() {
  created += 1;
  return { env: 'production', build: created };
}

function getConfig() {
  return createConfig();
}

export function solution(calls) {
  const refs = Array.from({ length: calls }, () => getConfig());
  return { sameInstance: refs.every((ref) => ref === refs[0]), created };
}`,
    tests: [
      { name: 'three calls share one instance', args: [3], expected: { sameInstance: true, created: 1 } },
      { name: 'later calls still reuse it', args: [5], expected: { sameInstance: true, created: 1 } },
    ],
    solution: `let created = 0;

function createConfig() {
  created += 1;
  return { env: 'production', build: created };
}

let instance;

function getConfig() {
  if (instance === undefined) {
    instance = createConfig();
  }
  return instance;
}

export function solution(calls) {
  const refs = Array.from({ length: calls }, () => getConfig());
  return { sameInstance: refs.every((ref) => ref === refs[0]), created };
}`,
    tags: ['singleton', 'closures', 'modules'],
    source: 'notion',
    explanation:
      'In JavaScript the module system already gives you a singleton: a module body runs once and every importer gets the same bindings. A private `let instance` plus a lazy getter is the whole pattern; a class with a `static #instance` and a private constructor is the same idea with more ceremony.\n\nThe cost of a singleton is hidden global state: tests share it and it is hard to swap. Prefer exporting a factory and injecting the instance where you can, and keep true singletons for things that must be unique per process (a connection pool, a logger).',
  },
  {
    id: 'design-patterns-memoize-decorator-falsy-cache',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'structural',
    level: 'mid',
    kind: 'fix',
    language: 'javascript',
    prompt:
      '`memoize` is a decorator: it wraps a function with caching while keeping the same call signature. Profiling shows `slowSquare(0)` is still recomputed on every call. Fix `memoize` so **every** previously computed result is served from the cache, whatever its value.',
    starter: `let computations = 0;

function slowSquare(n) {
  computations += 1;
  return n * n;
}

function memoize(fn) {
  const cache = {};
  return function (arg) {
    if (cache[arg]) {
      return cache[arg];
    }
    const result = fn(arg);
    cache[arg] = result;
    return result;
  };
}

export function solution(inputs) {
  computations = 0;
  const fastSquare = memoize(slowSquare);
  const outputs = inputs.map((n) => fastSquare(n));
  return { outputs, computations };
}`,
    tests: [
      { name: 'repeated 3 computes once', args: [[3, 3, 3]], expected: { outputs: [9, 9, 9], computations: 1 } },
      { name: 'repeated 0 computes once', args: [[0, 0, 0]], expected: { outputs: [0, 0, 0], computations: 1 } },
      { name: 'mixed inputs', args: [[2, 0, 2, 0]], expected: { outputs: [4, 0, 4, 0], computations: 2 } },
    ],
    solution: `let computations = 0;

function slowSquare(n) {
  computations += 1;
  return n * n;
}

function memoize(fn) {
  const cache = new Map();
  return function (arg) {
    if (cache.has(arg)) {
      return cache.get(arg);
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

export function solution(inputs) {
  computations = 0;
  const fastSquare = memoize(slowSquare);
  const outputs = inputs.map((n) => fastSquare(n));
  return { outputs, computations };
}`,
    tags: ['memoization', 'decorator', 'map', 'core-25'],
    source: 'core-list',
    explanation:
      'The truthiness check treats a cached `0` (or `""`, `false`, `null`) as a miss, so falsy results are never served from cache. Check for **presence** (`Map#has`, or `key in cache`) instead of the value.\n\nA `Map` also avoids two other object-cache traps: keys are stringified (`1` and `"1"` collide) and inherited keys such as `"constructor"` look like hits. For multi-argument functions you need a key strategy (`JSON.stringify(args)` for primitives, nested `WeakMap`s for object arguments), and for long-lived processes a bound (LRU) so the cache is not a memory leak. Memoization is only safe for **pure** functions.',
  },
  {
    id: 'design-patterns-adapter-vs-facade',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'structural',
    level: 'mid',
    kind: 'single',
    prompt:
      "Your domain code already depends on this interface:\n```ts\ninterface PaymentGateway {\n  charge(amountCents: number, token: string): Promise<{ id: string }>;\n}\n```\nYou write `StripeGateway implements PaymentGateway`, which translates the call into `stripe.paymentIntents.create({ amount, currency, payment_method, confirm: true })` and maps the response back. Next quarter you plan an `AdyenGateway` too. Which pattern is `StripeGateway` primarily?",
    options: [
      { id: 'a', text: 'Adapter: it converts a vendor interface into the interface your code already expects' },
      { id: 'b', text: 'Facade: it hides a complex subsystem behind one simpler entry point' },
      { id: 'c', text: 'Proxy: it stands in for the Stripe client with the same interface to control access' },
      { id: 'd', text: 'Decorator: it wraps the Stripe client to add behavior while keeping its interface' },
    ],
    answer: 'a',
    tags: ['adapter', 'facade', 'proxy', 'decorator', 'ports-and-adapters'],
    source: 'notion',
    explanation:
      'The deciding fact is that the **target interface already exists** (`PaymentGateway`) and the class translates an incompatible one into it: that is an Adapter, and it is exactly what makes the vendor swappable. A Facade also simplifies, but it defines a *new* simplified front over a subsystem you usually own (`BillingService.charge()` over three internal APIs) and is not about matching an expected interface. Proxy and Decorator both keep the **same** interface as the wrapped object: a Proxy controls access (caching, lazy init, rate limiting), a Decorator adds behavior (retries, logging, `withRetry(fn)`, Express middleware, HOCs).',
  },
  {
    id: 'design-patterns-observer-emitter',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'behavioral',
    level: 'senior',
    kind: 'code',
    language: 'javascript',
    prompt:
      'Implement the `Emitter` (Observer / pub-sub) used by `solution`:\n\n- `on(event, listener)` registers a listener and returns an **unsubscribe function**.\n- `once(event, listener)` registers a listener that removes itself after its first call.\n- `emit(event, payload)` calls every listener registered for `event`, **in registration order**.\n\nListeners may subscribe or unsubscribe while an `emit` is in progress; that must not cause another listener to be skipped. Do not change `solution`.',
    starter: `class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, listener) {
    // TODO: register the listener and return an unsubscribe function
  }

  once(event, listener) {
    // TODO: register a listener that removes itself after the first call
  }

  emit(event, payload) {
    // TODO: call every listener registered for event, in order
  }
}

export function solution(events) {
  const bus = new Emitter();
  const log = [];
  bus.once('order', (id) => log.push(\`welcome:\${id}\`));
  const stopAudit = bus.on('order', (id) => log.push(\`audit:\${id}\`));
  bus.on('refund', (id) => {
    log.push(\`refund:\${id}\`);
    stopAudit();
  });
  for (const [event, payload] of events) {
    bus.emit(event, payload);
  }
  return log;
}`,
    tests: [
      { name: 'once fires once, audit keeps firing', args: [[['order', 1], ['order', 2]]], expected: ['welcome:1', 'audit:1', 'audit:2'] },
      { name: 'refund unsubscribes audit', args: [[['refund', 7], ['order', 3]]], expected: ['refund:7', 'welcome:3'] },
      { name: 'unsubscribe after traffic', args: [[['order', 1], ['refund', 2], ['order', 3]]], expected: ['welcome:1', 'audit:1', 'refund:2'] },
      { name: 'unknown event is a no-op', args: [[['ping', 0]]], expected: [] },
    ],
    solution: `class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, listener) {
    const list = this.listeners.get(event) ?? [];
    list.push(listener);
    this.listeners.set(event, list);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    const list = this.listeners.get(event);
    if (!list) {
      return;
    }
    const index = list.indexOf(listener);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  once(event, listener) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    return this.on(event, wrapper);
  }

  emit(event, payload) {
    const list = this.listeners.get(event);
    if (!list) {
      return false;
    }
    for (const listener of [...list]) {
      listener(payload);
    }
    return true;
  }
}

export function solution(events) {
  const bus = new Emitter();
  const log = [];
  bus.once('order', (id) => log.push(\`welcome:\${id}\`));
  const stopAudit = bus.on('order', (id) => log.push(\`audit:\${id}\`));
  bus.on('refund', (id) => {
    log.push(\`refund:\${id}\`);
    stopAudit();
  });
  for (const [event, payload] of events) {
    bus.emit(event, payload);
  }
  return log;
}`,
    tags: ['observer', 'event-emitter', 'pub-sub'],
    source: 'notion',
    explanation:
      'The first test is the trap: the `once` wrapper removes itself from the array **during** `emit`. If `emit` iterates the live array, `splice` shifts `audit` into the index the loop already visited and it is skipped on the first order. Iterating a snapshot (`[...list]`) is what Node\'s `EventEmitter` does too.\n\nReturning an unsubscribe function (as Redux `subscribe` and React effects do) is the cleanest API because the caller does not need to keep a reference to the exact listener. In long-lived processes, forgotten subscriptions are the classic Observer memory leak, which is why Node warns past 10 listeners per event.\n\n**Say this out loud:** "Observer decouples the publisher from its subscribers; the details that matter in production are snapshotting listeners during emit, always giving callers a way to unsubscribe, and isolating one listener\'s error from the rest."',
  },
  {
    id: 'design-patterns-strategy-map-shipping',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'behavioral',
    level: 'junior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement `solution(method, weightKg)` returning the shipping cost using a **strategy map** (an object or `Map` from method name to a pricing function), not a `switch`:\n\n- `standard`: 5 + 1.5 per kg\n- `express`: 15 + 3 per kg\n- `pickup`: always 0\n- any other method: `null`',
    starter: `export function solution(method: string, weightKg: number): number | null {
  // TODO: look the strategy up instead of branching on method
  return 0;
}`,
    tests: [
      { name: 'standard 2 kg', args: ['standard', 2], expected: 8 },
      { name: 'express 2.5 kg', args: ['express', 2.5], expected: 22.5 },
      { name: 'pickup is free', args: ['pickup', 10], expected: 0 },
      { name: 'unknown method', args: ['drone', 1], expected: null },
    ],
    solution: `type PricingStrategy = (weightKg: number) => number;

const strategies = new Map<string, PricingStrategy>([
  ['standard', (kg) => 5 + 1.5 * kg],
  ['express', (kg) => 15 + 3 * kg],
  ['pickup', () => 0],
]);

export function solution(method: string, weightKg: number): number | null {
  const strategy = strategies.get(method);
  return strategy ? strategy(weightKg) : null;
}`,
    tags: ['strategy', 'open-closed'],
    source: 'notion',
    explanation:
      'Strategy makes each algorithm a value you can pick at run time. In JavaScript a strategy is usually just a function, so the "pattern" is a lookup table of functions. Adding `overnight` means adding one entry, not editing a growing `switch` in every place that prices shipping: that is the open-closed principle in practice. Sort comparators and pluggable auth or payment providers are the same idea.',
  },
  {
    id: 'design-patterns-command-undo',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'behavioral',
    level: 'mid',
    kind: 'code',
    language: 'javascript',
    prompt:
      "Finish this Command-pattern text editor. Each operation is a command object with `execute(doc)` and `undo(doc)`; executed commands go on a history stack.\n\n- `['type', text]` appends `text`.\n- `['delete', n]` removes the last `n` characters (or all of them if there are fewer).\n- `['undo']` reverts the most recent command still in history; with an empty history it does nothing.\n\nReturn the final text.",
    starter: `function typeCommand(text) {
  return {
    execute(doc) {
      // TODO
    },
    undo(doc) {
      // TODO
    },
  };
}

function deleteCommand(count) {
  return {
    execute(doc) {
      // TODO: remember what you removed so undo can restore it
    },
    undo(doc) {
      // TODO
    },
  };
}

export function solution(ops) {
  const doc = { text: '' };
  const history = [];
  for (const [name, arg] of ops) {
    if (name === 'undo') {
      // TODO: undo the most recent command, if any
      continue;
    }
    const command = name === 'type' ? typeCommand(arg) : deleteCommand(arg);
    command.execute(doc);
    history.push(command);
  }
  return doc.text;
}`,
    tests: [
      { name: 'typing appends', args: [[['type', 'hello'], ['type', ' world']]], expected: 'hello world' },
      { name: 'undo a delete', args: [[['type', 'hello'], ['delete', 2], ['undo']]], expected: 'hello' },
      { name: 'over-delete then undo', args: [[['type', 'abc'], ['delete', 5], ['undo'], ['type', '!']]], expected: 'abc!' },
      { name: 'undo past history is a no-op', args: [[['type', 'ab'], ['undo'], ['undo'], ['type', 'c']]], expected: 'c' },
    ],
    solution: `function typeCommand(text) {
  return {
    execute(doc) {
      doc.text += text;
    },
    undo(doc) {
      doc.text = doc.text.slice(0, doc.text.length - text.length);
    },
  };
}

function deleteCommand(count) {
  let removed = '';
  return {
    execute(doc) {
      removed = doc.text.slice(Math.max(0, doc.text.length - count));
      doc.text = doc.text.slice(0, doc.text.length - removed.length);
    },
    undo(doc) {
      doc.text += removed;
    },
  };
}

export function solution(ops) {
  const doc = { text: '' };
  const history = [];
  for (const [name, arg] of ops) {
    if (name === 'undo') {
      const last = history.pop();
      if (last) {
        last.undo(doc);
      }
      continue;
    }
    const command = name === 'type' ? typeCommand(arg) : deleteCommand(arg);
    command.execute(doc);
    history.push(command);
  }
  return doc.text;
}`,
    tags: ['command', 'undo-redo'],
    source: 'notion',
    explanation:
      'Command turns an action into an object, so it can be stored, queued, logged, retried or reversed. The subtle part is that `undo` needs the state captured at `execute` time: `delete` must remember **what** it removed (here only 3 characters, not 5), otherwise undo cannot restore it. The same shape appears in job queues (a serialized command handed to a worker) and in Redux actions, which are commands described as data.',
  },
  {
    id: 'design-patterns-over-patterning',
    domain: 'architecture',
    subject: 'design-patterns',
    topic: 'creational',
    level: 'senior',
    kind: 'open',
    prompt:
      'A pull request for a feature that sends notifications by email only introduces `NotificationFactory`, an `AbstractChannelFactory`, a `ChannelStrategy` interface with one implementation, and a `NotificationManager` singleton. The author says "this makes it extensible". How do you review it, and when would you ask for these patterns?',
    modelAnswer:
      'I would judge each abstraction by the change it absorbs, not by whether it is a named pattern. With one channel, a strategy interface and two factory layers add indirection and files without protecting against any change we actually expect, so I would ask for a plain `sendEmailNotification` function behind a small module boundary. The singleton is the part I would push back on hardest: hidden global state makes tests order-dependent, and injecting the sender gives the same sharing without the coupling. If product confirms SMS and push are coming, a strategy map keyed by channel is the right next step and is a small refactor from a well-factored function. Abstract Factory earns its keep only when you create **families** of related objects that must stay consistent (for example per-vendor client, signer and parser), which is not the case here. The best design is usually the simplest thing that absorbs the change you expect, and patterns should be introduced when the second or third variation appears.',
    rubric: [
      'Justifies patterns by the concrete problem or change they absorb, not by name',
      'Calls out the singleton as hidden global state that hurts testing and prefers injection',
      'Explains when Strategy or a factory would become justified (a real second variation)',
      'Knows what Abstract Factory is actually for (families of related objects)',
      'Frames the feedback as a reversible, incremental path rather than a rewrite',
    ],
    tags: ['over-engineering', 'yagni', 'singleton', 'abstract-factory', 'code-review'],
    source: 'notion',
    explanation:
      'Senior signal: naming the pattern is easy; knowing when it is **not** worth its indirection is the skill. Over-patterning is a smell, and "extensible" is only a benefit for extensions you will actually make.\n\n**Say this out loud:** "I justify a pattern by the problem it solves. With one email channel this is indirection with no payoff; I would start with a plain function and introduce a strategy map when the second channel is real."',
  },
];
