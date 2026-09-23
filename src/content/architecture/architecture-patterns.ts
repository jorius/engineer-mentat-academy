// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'architecture-patterns-layered-dependency-direction',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'layered-and-hexagonal',
    level: 'junior',
    kind: 'single',
    prompt: 'In a layered backend (controllers → services → repositories), which of these is a **layering violation**?',
    options: [
      { id: 'a', text: 'A controller parses the request and calls `orderService.place(dto)`' },
      { id: 'b', text: 'A service calls `orderRepository.save(order)` inside a transaction' },
      { id: 'c', text: 'A repository imports the Express `Request` type to read `req.user.tenantId` for its query' },
      { id: 'd', text: 'A service throws `OrderNotFoundError` and the controller maps it to a 404' },
    ],
    answer: 'c',
    tags: ['layered-architecture', 'dependency-direction'],
    source: 'topic-list',
    explanation:
      'Dependencies should point **downward** only: presentation → business → data access. A repository that knows about HTTP couples persistence to one delivery mechanism, so the same query cannot be reused from a queue consumer or a cron job, and it cannot be tested without faking a request. Pass `tenantId` in as a plain argument. Throwing a domain error and translating it to an HTTP status at the edge (option D) is the correct way to keep HTTP out of the service layer.',
  },
  {
    id: 'architecture-patterns-hexagonal-ports',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'layered-and-hexagonal',
    level: 'mid',
    kind: 'single',
    prompt: 'In a hexagonal (ports and adapters) architecture, where do the `OrderRepository` interface and the `PostgresOrderRepository` class belong?',
    options: [
      { id: 'a', text: 'Both in the infrastructure layer, because both are about the database' },
      {
        id: 'b',
        text: 'The interface is a port owned by the application core; the Postgres class is a driven (secondary) adapter outside the core that depends inward on that port',
      },
      { id: 'c', text: 'The interface in the infrastructure layer, and the domain imports it from there' },
      { id: 'd', text: 'Both inside the domain, so the domain controls the SQL it needs' },
    ],
    answer: 'b',
    tags: ['hexagonal', 'ports-and-adapters', 'dependency-inversion'],
    source: 'topic-list',
    explanation:
      'The core defines the ports it needs, in its own language (`findById`, `save`), and knows nothing about Postgres, HTTP or Kafka. Adapters live outside and depend inward: **driving** (primary) adapters such as a REST controller or a CLI call into the core, **driven** (secondary) adapters such as the Postgres repository or an email client implement ports the core defines. That is the dependency inversion principle applied at architecture scale, and it is why the core can be tested with in-memory adapters.',
  },
  {
    id: 'architecture-patterns-hexagonal-vs-layered',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'layered-and-hexagonal',
    level: 'senior',
    kind: 'open',
    prompt: 'Compare a classic layered architecture with hexagonal architecture. When would you choose each for a new Node/TypeScript service?',
    modelAnswer:
      'In a classic layered architecture the business layer depends downward on the data layer, so the domain often ends up shaped by the ORM and database. Hexagonal inverts that: the core owns ports (interfaces) and every technology, inbound or outbound, is an adapter plugged in from outside, so the dependency arrows all point at the domain. That buys testability (the core runs against in-memory adapters, no database needed for most tests), the ability to add a second entry point such as a queue consumer next to REST without duplicating logic, and a clean way to swap infrastructure. The cost is more interfaces, mapping between domain models and persistence models, and more ceremony for simple CRUD. I would pick a simple layered structure for a CRUD-heavy service with thin rules, and hexagonal when the domain logic is rich, there are several inbound channels, or infrastructure is likely to change. In NestJS I get most of the benefit by defining repository interfaces in the domain module and binding implementations with providers.',
    rubric: [
      'States the dependency direction difference: layers depend downward, hexagonal points everything at the core',
      'Names ports (owned by the core) and primary vs secondary adapters',
      'Cites testability with in-memory adapters and multiple entry points as concrete benefits',
      'Acknowledges the cost: mapping and ceremony, overkill for thin CRUD',
      'Gives a decision rule tied to domain complexity or number of channels',
    ],
    tags: ['hexagonal', 'layered-architecture', 'clean-architecture', 'trade-offs'],
    source: 'topic-list',
    explanation:
      'Interviewers look for the dependency-direction insight and a pragmatic decision rule, not a diagram recital. Clean architecture and onion architecture are variations of the same inward-dependency idea.\n\n**Say this out loud:** "Hexagonal is dependency inversion at the architecture level: the domain owns the ports and every technology is an adapter. I use it when domain logic is rich or there are several entry points; for thin CRUD, simple layers are enough."',
  },
  {
    id: 'architecture-patterns-bff-purpose',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'bff',
    level: 'junior',
    kind: 'single',
    prompt: 'What problem does the Backend-for-Frontend (BFF) pattern primarily solve?',
    options: [
      {
        id: 'a',
        text: 'A single general-purpose API forces each client (mobile, web) to over-fetch, under-fetch and orchestrate several calls; a BFF per client experience aggregates and shapes data for that client',
      },
      { id: 'b', text: 'It replaces the API gateway for TLS termination, authentication and rate limiting' },
      { id: 'c', text: 'It is the place to put business rules shared by all clients so they stay consistent' },
      { id: 'd', text: 'It serves the static JavaScript bundle and images of the frontend from a CDN' },
    ],
    answer: 'a',
    tags: ['bff', 'api-gateway', 'aggregation'],
    source: 'topic-list',
    explanation:
      'A BFF is a thin server-side layer owned by (or close to) a frontend team that calls downstream services, aggregates and trims the responses, and returns exactly what one experience needs, often in one round trip. That matters most on mobile where latency and payload size hurt. It complements a gateway rather than replacing cross-cutting edge concerns, and shared business rules belong in the domain services behind it: putting them in several BFFs duplicates logic that then drifts. A Next.js server or a GraphQL layer frequently plays the BFF role.',
  },
  {
    id: 'architecture-patterns-bff-design',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'bff',
    level: 'senior',
    kind: 'open',
    prompt:
      'Your web app and a new mobile app both call five microservices directly from the client. Mobile screens need a fraction of the data and suffer on slow networks. Would you introduce a BFF, and how would you design and own it?',
    modelAnswer:
      'Yes, I would introduce a BFF per client experience (one for web, one for mobile) rather than one shared "API for all UIs", because the point is to let each frontend shape its own contract. Each BFF aggregates the calls a screen needs in parallel, trims fields, and returns one response, with per-call timeouts and partial-failure handling so one slow service degrades a widget instead of the page. It stays thin: orchestration, mapping, caching and session-to-token translation (keeping tokens out of the browser with an httpOnly cookie session), while business rules stay in the domain services so they do not diverge between BFFs. The team that owns the frontend owns its BFF, which lets them ship UI changes without waiting on backend teams. The risks I would manage are duplicated logic across BFFs, a BFF growing into a monolith, and one more hop to operate, so I would propagate correlation IDs and trace through it, and consider GraphQL if many clients need flexible shapes over the same data.',
    rubric: [
      'Chooses one BFF per client experience and explains why a shared one defeats the purpose',
      'Describes aggregation with parallel calls, timeouts and partial-failure handling',
      'Keeps business rules in domain services and the BFF thin',
      'Assigns ownership to the frontend team',
      'Names the risks (duplication, extra hop, BFF bloat) and an operational mitigation such as tracing',
    ],
    tags: ['bff', 'aggregation', 'ownership', 'resilience'],
    source: 'topic-list',
    explanation:
      'The senior signal is ownership and boundaries: a BFF is as much an organizational pattern (frontend teams own their backend contract) as a technical one.\n\n**Say this out loud:** "One BFF per experience, owned by the frontend team, thin by design: it orchestrates and shapes data, and business rules stay in the services behind it."',
  },
  {
    id: 'architecture-patterns-event-driven-consequences',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'event-driven',
    level: 'mid',
    kind: 'multi',
    prompt:
      'You replace synchronous REST calls from `orders` to `billing`, `shipping` and `email` with an `OrderPlaced` event on a broker. Which of these are real consequences of that change? Select all that apply.',
    options: [
      { id: 'a', text: '`orders` no longer fails or slows down when `email` is down; the event waits until email recovers' },
      { id: 'b', text: 'Consumers must tolerate duplicate deliveries, so handlers need to be idempotent' },
      { id: 'c', text: 'The system becomes eventually consistent: right after checkout, shipping may not know about the order yet' },
      { id: 'd', text: 'Following one request end to end gets harder without correlation IDs and distributed tracing' },
      { id: 'e', text: 'Events are now globally ordered across all topics and partitions' },
    ],
    answer: ['a', 'b', 'c', 'd'],
    tags: ['event-driven', 'eventual-consistency', 'idempotency', 'observability'],
    source: 'topic-list',
    explanation:
      'Events buy **temporal decoupling** (the producer does not need consumers to be up) and let new consumers subscribe without changing the producer. The price is eventual consistency, at-least-once delivery (so duplicates and idempotent handlers), and harder debugging because the flow is no longer a call stack. Brokers such as Kafka only order messages **within a partition**, never globally.',
  },
  {
    id: 'architecture-patterns-transactional-outbox',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'event-driven',
    level: 'senior',
    kind: 'single',
    prompt:
      "```ts\nawait db.orders.insert(order);\nawait broker.publish('OrderPlaced', order);\n```\nOccasionally the insert commits and the publish fails (or the process dies between the two lines), so downstream services never hear about the order. Which approach removes this inconsistency?",
    options: [
      { id: 'a', text: 'Swap the two lines so the event is published first' },
      { id: 'b', text: 'Wrap both lines in a `try/catch` and retry the publish three times' },
      {
        id: 'c',
        text: 'Transactional outbox: insert the order and an outbox row in the same database transaction, and have a relay publish outbox rows and mark them sent',
      },
      { id: 'd', text: 'Use a distributed two-phase commit between the database and every consumer service' },
    ],
    answer: 'c',
    tags: ['outbox', 'dual-write', 'event-driven', 'at-least-once'],
    source: 'topic-list',
    explanation:
      'Writing to two systems without a shared transaction (the **dual-write problem**) can always fail between the writes. Publishing first just flips the failure (an event for an order that never committed); in-process retries do not survive a crash. The outbox makes the state change and the intent to publish atomic, because both are rows in one local transaction. A relay (polling or change data capture such as Debezium) then publishes with at-least-once semantics, so consumers must be idempotent. Two-phase commit across services is fragile, slow, and rarely supported by brokers.\n\n**Say this out loud:** "You cannot atomically write to a database and a broker, so I write the event to an outbox table in the same transaction and let a relay publish it at least once, with idempotent consumers downstream."',
  },
  {
    id: 'architecture-patterns-events-vs-commands',
    domain: 'architecture',
    subject: 'architecture-patterns',
    topic: 'event-driven',
    level: 'mid',
    kind: 'single',
    prompt: 'What is the key difference between the messages `PlaceOrder` and `OrderPlaced`?',
    options: [
      {
        id: 'a',
        text: '`PlaceOrder` is a command: a request addressed to one handler that may reject it. `OrderPlaced` is an event: an immutable fact in the past tense that any number of subscribers may react to',
      },
      { id: 'b', text: 'They are the same thing; the naming is only a team convention' },
      { id: 'c', text: '`OrderPlaced` is sent synchronously over HTTP and `PlaceOrder` asynchronously over a broker' },
      { id: 'd', text: '`PlaceOrder` can have many consumers, while `OrderPlaced` must have exactly one' },
    ],
    answer: 'a',
    tags: ['events', 'commands', 'messaging'],
    source: 'topic-list',
    explanation:
      'A command expresses **intent** and couples the sender to a specific receiver who owns the decision (it can say no). An event announces something that **already happened**; the publisher does not know or care who listens, which is what makes adding a new subscriber (loyalty points, analytics) free. Both can travel over queues or HTTP; the transport does not define the semantics. Naming events in the past tense keeps the distinction visible in code reviews.',
  },
];
