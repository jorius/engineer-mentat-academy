// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'solid-srp-reason-to-change',
    domain: 'architecture',
    subject: 'solid',
    topic: 'srp',
    level: 'junior',
    kind: 'single',
    prompt: 'The Single Responsibility Principle says a module should have "one reason to change". What does that mean in practice?',
    options: [
      { id: 'a', text: 'It should be answerable to one source of change (one actor or concern), so unrelated requests never touch the same code' },
      { id: 'b', text: 'It should expose exactly one public method' },
      { id: 'c', text: 'It should stay below a fixed size, for example 200 lines' },
      { id: 'd', text: 'Each file should contain exactly one class or function' },
    ],
    answer: 'a',
    tags: ['srp', 'cohesion'],
    source: 'notion',
    explanation:
      'SRP is about **cohesion around a reason to change**, not about counting methods or lines. A `UserService` with `login()` and `updateProfile()` changes when security rules change *and* when profile fields change, so two teams edit the same file for unrelated reasons. Splitting it into `AuthenticationService` and `UserProfileService` isolates those changes. A class with ten methods can still satisfy SRP if they all serve the same concern. In React the usual smell is a component that fetches, transforms and renders several things; the fix is a data hook plus small presentational components.',
    hint: 'Recall how Robert C. Martin rephrased "one responsibility" in terms of change.',
  },
  {
    id: 'solid-srp-invoice-reasons',
    domain: 'architecture',
    subject: 'solid',
    topic: 'srp',
    level: 'mid',
    kind: 'multi',
    prompt:
      '```js\nclass InvoiceService {\n  calculateTotal(invoice) { /* VAT and discount rules */ }\n  renderPdf(invoice) { /* layout, fonts, logo */ }\n  save(invoice) { /* SQL against the invoices table */ }\n  emailToCustomer(invoice) { /* SMTP client */ }\n}\n```\nWhich of these are **independent reasons** for this class to change? Select all that apply.',
    options: [
      { id: 'a', text: 'Finance changes how VAT is rounded' },
      { id: 'b', text: 'Design updates the PDF template and logo' },
      { id: 'c', text: 'The invoices table moves to a new schema' },
      { id: 'd', text: 'Someone adds a unit test for `calculateTotal`' },
      { id: 'e', text: 'The company switches from SMTP to a transactional email API' },
    ],
    answer: ['a', 'b', 'c', 'e'],
    tags: ['srp', 'god-class'],
    source: 'notion',
    explanation:
      'Four different stakeholders (finance, design, data, infrastructure) can each force an edit here, so a change for one risks breaking the others and every change needs the whole class retested. Adding a test is not a change to the class. A reasonable split is a pure `calculateTotal` function (easy to unit test), an `InvoiceRenderer`, an `InvoiceRepository` and a `Mailer`, with a thin use case that orchestrates them.',
    hint: 'List the distinct actors and technologies this class answers to, then match each scenario against that list.',
  },
  {
    id: 'solid-ocp-exporter-registry',
    domain: 'architecture',
    subject: 'solid',
    topic: 'ocp',
    level: 'mid',
    kind: 'single',
    prompt:
      "```js\nfunction exportReport(report, format) {\n  switch (format) {\n    case 'csv': return toCsv(report);\n    case 'json': return JSON.stringify(report);\n    default: throw new Error(`Unsupported format ${format}`);\n  }\n}\n```\nThe same `switch (format)` also appears in the preview screen and the email job. Product wants XML next sprint and more formats later. Which change best follows the Open-Closed Principle?",
    options: [
      { id: 'a', text: "Add `case 'xml'` to each of the three switches" },
      { id: 'b', text: 'Introduce an exporter registry (`exporters.set(\'xml\', xmlExporter)`) that all three call sites look up, so a new format is a new module plus one registration' },
      { id: 'c', text: 'Subclass the report service and override `exportReport` with a switch that also handles XML' },
      { id: 'd', text: 'Add an `isXml` boolean parameter to `exportReport`' },
    ],
    answer: 'b',
    tags: ['ocp', 'strategy', 'registry'],
    source: 'notion',
    explanation:
      'OCP means you extend behavior by **adding** code, not by editing working code. A registry (a strategy map) lets each format live in its own module, and the three call sites never change again. Adding a `case \'xml\'` to each switch works but must be repeated in every duplicated switch, which is exactly the shotgun-surgery smell OCP targets. Subclassing the service still edits a switch, just in a subclass, and the `isXml` parameter adds a boolean flag that does not scale past two formats.\n\nThe pragmatic caveat: a single `switch` over a stable, closed set of cases (for example the three states of a traffic light) is fine. OCP pays off when the set grows and the branching is duplicated.',
    hint: 'Recall what open-closed asks of existing, working code when a new variant arrives.',
  },
  {
    id: 'solid-lsp-penguin-predict',
    domain: 'architecture',
    subject: 'solid',
    topic: 'lsp',
    level: 'mid',
    kind: 'predict',
    language: 'javascript',
    prompt: 'What does this print, one line per `console.log`?',
    code: `class Bird {
  fly() {
    return this.constructor.name + ' flies';
  }
}

class Sparrow extends Bird {}

class Penguin extends Bird {
  fly() {
    throw new Error('Penguins cannot fly');
  }
}

function launchAll(birds) {
  return birds.map((bird) => {
    try {
      return bird.fly();
    } catch (error) {
      return 'crash: ' + error.message;
    }
  });
}

const flock = [new Sparrow(), new Penguin()];
console.log(launchAll(flock).join(' | '));
console.log(flock.every((bird) => bird instanceof Bird));`,
    answer: 'Sparrow flies | crash: Penguins cannot fly\ntrue',
    tags: ['lsp', 'inheritance'],
    source: 'notion',
    explanation:
      '`instanceof` is happy (and a TypeScript checker would be too): a `Penguin` **is a** `Bird`. But `launchAll` was written against the contract "every Bird can fly", and the subclass breaks that contract at run time. That is a Liskov violation: a subtype must be usable anywhere its base type is, without the caller needing special cases. Wrapping calls in `try/catch` or adding `if (bird instanceof Penguin)` in callers are symptoms, not fixes. The fix is to model the capability (a `FlyingBird` or a `canFly` interface) so that non-flyers never promise `fly()`.',
    hint: 'Follow what `fly()` does for each subclass, what the `catch` turns an error into, and what `instanceof` checks versus what the caller relies on.',
  },
  {
    id: 'solid-lsp-model-capabilities',
    domain: 'architecture',
    subject: 'solid',
    topic: 'lsp',
    level: 'senior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      '`Penguin` inherits `fly()` from `Bird` and overrides it to throw, so `solution` crashes on any flock that contains a penguin. Restructure the hierarchy so that **only birds that can fly promise `fly()`** and callers select flyers by capability, not by checking for `Penguin`. `solution(kinds)` must return the flight and swim lines in flock order.',
    starter: `class Bird {
  get name() {
    return this.constructor.name;
  }

  fly() {
    return this.name + ' flies';
  }
}

class Sparrow extends Bird {}

class Eagle extends Bird {}

class Penguin extends Bird {
  fly() {
    throw new Error('Penguins cannot fly');
  }

  swim() {
    return this.name + ' swims';
  }
}

const make = {
  sparrow: () => new Sparrow(),
  eagle: () => new Eagle(),
  penguin: () => new Penguin(),
};

export function solution(kinds) {
  const birds = kinds.map((kind) => make[kind]());
  return {
    flights: birds.map((bird) => bird.fly()),
    swims: birds.filter((bird) => bird instanceof Penguin).map((bird) => bird.swim()),
  };
}`,
    tests: [
      { name: 'mixed flock', args: [['sparrow', 'penguin', 'eagle']], expected: { flights: ['Sparrow flies', 'Eagle flies'], swims: ['Penguin swims'] } },
      { name: 'penguins only', args: [['penguin', 'penguin']], expected: { flights: [], swims: ['Penguin swims', 'Penguin swims'] } },
      { name: 'flyers only', args: [['sparrow']], expected: { flights: ['Sparrow flies'], swims: [] } },
    ],
    solution: `class Bird {
  get name() {
    return this.constructor.name;
  }
}

class FlyingBird extends Bird {
  fly() {
    return this.name + ' flies';
  }
}

class Sparrow extends FlyingBird {}

class Eagle extends FlyingBird {}

class Penguin extends Bird {
  swim() {
    return this.name + ' swims';
  }
}

const make = {
  sparrow: () => new Sparrow(),
  eagle: () => new Eagle(),
  penguin: () => new Penguin(),
};

const canFly = (bird) => typeof bird.fly === 'function';
const canSwim = (bird) => typeof bird.swim === 'function';

export function solution(kinds) {
  const birds = kinds.map((kind) => make[kind]());
  return {
    flights: birds.filter(canFly).map((bird) => bird.fly()),
    swims: birds.filter(canSwim).map((bird) => bird.swim()),
  };
}`,
    tags: ['lsp', 'composition-over-inheritance', 'isp'],
    source: 'notion',
    explanation:
      'The base class made a promise (`fly()`) that not every subtype can keep, so the fix belongs in the **model**, not in the callers. Moving `fly()` down to a `FlyingBird` (or into a mixin / interface) means a `Penguin` never claims to fly, and callers filter on the capability. Filtering with `!(bird instanceof Penguin)` would pass the tests but reintroduces the smell: every new non-flyer (an ostrich, a kiwi) would require editing every caller, which also breaks open-closed.\n\nIn TypeScript the same idea is `interface Flyer { fly(): string }` and a type guard; in JS generally, prefer shallow hierarchies and composition so substitutes never surprise you.\n\n**Say this out loud:** "A subclass that throws or no-ops an inherited method is a Liskov violation. I fix the abstraction so the base type only promises what every subtype can do, instead of adding type checks in callers."',
    hint: 'Ask which classes can actually keep the `fly()` promise, and how a caller can pick flyers without naming `Penguin`.',
  },
  {
    id: 'solid-isp-mixins-predict',
    domain: 'architecture',
    subject: 'solid',
    topic: 'isp',
    level: 'junior',
    kind: 'predict',
    language: 'javascript',
    prompt: 'Capabilities are composed with mixins instead of one fat `Bird` interface. What does this print, one line per `console.log`?',
    code: `const canFly = {
  fly() {
    return this.name + ' flies';
  },
};

const canSwim = {
  swim() {
    return this.name + ' swims';
  },
};

class Duck {
  constructor() {
    this.name = 'Duck';
  }
}

class Penguin {
  constructor() {
    this.name = 'Penguin';
  }
}

Object.assign(Duck.prototype, canFly, canSwim);
Object.assign(Penguin.prototype, canSwim);

const duck = new Duck();
const penguin = new Penguin();
console.log(duck.fly());
console.log(penguin.swim());
console.log(typeof penguin.fly);
console.log('swim' in penguin, Object.keys(penguin).length);`,
    answer: 'Duck flies\nPenguin swims\nundefined\ntrue 1',
    tags: ['isp', 'mixins', 'prototypes'],
    source: 'notion',
    explanation:
      "Interface segregation says no client should be forced to depend on methods it does not use. Mixins give each class only the capabilities it needs: `Penguin` never gets a `fly` it would have to stub out, so `typeof penguin.fly` is `'undefined'` rather than a method that throws. `Object.assign` copies the methods onto the **prototype**, and `this` is set by the call site (`duck.fly()` makes `this` the duck), so the shared methods read each instance's own `name`; `'swim' in penguin` is `true` (the `in` operator walks the prototype chain), and `Object.keys` only lists the own property `name`.",
    hint: '`Object.assign` copies methods onto the prototype, `this` comes from the call site, and the `in` operator walks the prototype chain while `Object.keys` lists own properties only.',
  },
  {
    id: 'solid-dip-injectable-gateway',
    domain: 'architecture',
    subject: 'solid',
    topic: 'dip',
    level: 'senior',
    kind: 'fix',
    language: 'javascript',
    prompt:
      "`PurchaseHandler` is hard-wired to the `PayPal` SDK, which refuses network calls in tests, so nobody can test the approve/decline logic. Apply dependency inversion: make the handler depend on an injected gateway (anything with `requestPayment(details, amount)`) while **production code that calls `new PurchaseHandler()` keeps using PayPal**. Do not change `PayPal`. Make `solution` inject its fake gateway.",
    starter: `const PayPal = {
  requestPayment() {
    throw new Error('Network access is disabled in tests');
  },
};

class PurchaseHandler {
  processPayment(details, amount) {
    const approved = PayPal.requestPayment(details, amount);
    return approved ? 'paid' : 'declined';
  }
}

export function solution(amount, gatewayApproves) {
  const fakeGateway = {
    requestPayment: (details, value) => gatewayApproves && value > 0 && details.card === 'test',
  };
  const handler = new PurchaseHandler();
  return handler.processPayment({ card: 'test' }, amount);
}`,
    tests: [
      { name: 'approved payment', args: [50, true], expected: 'paid' },
      { name: 'declined by gateway', args: [50, false], expected: 'declined' },
      { name: 'zero amount declined', args: [0, true], expected: 'declined' },
    ],
    solution: `const PayPal = {
  requestPayment() {
    throw new Error('Network access is disabled in tests');
  },
};

class PurchaseHandler {
  constructor(gateway = PayPal) {
    this.gateway = gateway;
  }

  processPayment(details, amount) {
    const approved = this.gateway.requestPayment(details, amount);
    return approved ? 'paid' : 'declined';
  }
}

export function solution(amount, gatewayApproves) {
  const fakeGateway = {
    requestPayment: (details, value) => gatewayApproves && value > 0 && details.card === 'test',
  };
  const handler = new PurchaseHandler(fakeGateway);
  return handler.processPayment({ card: 'test' }, amount);
}`,
    tags: ['dip', 'dependency-injection', 'testability'],
    source: 'notion',
    explanation:
      'Before the fix, high-level policy (`paid` vs `declined`) depends directly on a low-level vendor detail. After it, both depend on an abstraction, the `requestPayment(details, amount)` contract, and the concrete gateway is **passed in**. That is dependency *inversion* (the principle) achieved through dependency *injection* (the technique). The default parameter keeps the production call site unchanged; in a larger app a composition root or a DI container (NestJS providers) does the wiring.\n\nThe payoff is exactly what the tests show: the business rule is testable with a two-line fake, no module mocking, and swapping PayPal for Stripe touches one wiring line.\n\n**Say this out loud:** "I inject dependencies at the boundary instead of importing concretions, so high-level logic depends on a contract; that is what makes it testable and lets me swap vendors without touching the policy."',
    hint: 'Let the handler receive its gateway from outside, and keep the existing production call site working unchanged.',
  },
  {
    id: 'solid-pragmatism-review',
    domain: 'architecture',
    subject: 'solid',
    topic: 'dip',
    level: 'senior',
    kind: 'open',
    prompt:
      'A teammate refactors a small, stable internal CLI "to follow SOLID": every class now has an interface, a factory and a DI container registration, and the diff triples the file count. How do you evaluate this, and where do SOLID principles overlap with each other and with design patterns?',
    modelAnswer:
      'SOLID is a means to changeability and testability, not a goal, so I would ask which change or test each new abstraction makes easier. For small, stable code that nobody else extends, interfaces with a single implementation and factories add indirection and navigation cost with no payoff, so I would keep injection only at the real boundaries (I/O, network, clock) where tests need seams. The principles overlap heavily: replacing a `switch` with a strategy map is OCP, it usually needs DIP (callers depend on the strategy contract), and it is only safe when every strategy honors the same contract, which is LSP. ISP is SRP applied to interfaces: small role interfaces keep clients from depending on methods they do not use. I would propose keeping the parts that isolate side effects and reverting the rest, and revisit when churn or a second implementation actually appears.',
    rubric: [
      'Frames SOLID as serving changeability and testability rather than as an end in itself',
      'Identifies single-implementation interfaces and factories on stable code as needless indirection',
      'Keeps injection at real boundaries (I/O, network, time) where tests need seams',
      'Explains at least two overlaps, e.g. strategy map = OCP + DIP, LSP as the safety condition, ISP as SRP for interfaces',
      'Proposes a concrete, incremental outcome for the PR instead of all-or-nothing',
    ],
    tags: ['solid', 'pragmatism', 'code-review', 'strategy'],
    source: 'notion',
    explanation:
      'The senior signal is balance: knowing the smell each principle fixes (god class, growing switch, throwing override, fat interface, vendor hard-wiring) and applying the principle only where coupling or churn actually hurts.\n\n**Say this out loud:** "SOLID is a means, not an end: I apply it where coupling or churn hurts and keep injection at real I/O boundaries. The principles overlap, for example a strategy map is OCP achieved through DIP, and it is only safe when every strategy honors LSP."',
    hint: 'Ask which change or test each abstraction makes easier, where real seams belong (I/O, network, clock), and show how OCP, DIP, LSP and ISP overlap.',
  },
];
