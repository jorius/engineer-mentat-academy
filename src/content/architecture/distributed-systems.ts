// engine
import type { Question } from '../../engine/question';

export const questions: Question[] = [
  {
    id: 'distributed-systems-microservices-when-not',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'microservices',
    level: 'senior',
    kind: 'open',
    prompt:
      'A team of eight engineers building a new product asks whether to start with microservices. What do you recommend, and what would make you split a service out later?',
    modelAnswer:
      'I would start with a modular monolith: one deployable with strict internal module boundaries aligned to bounded contexts, each module owning its tables and exposing an internal API. Microservices trade in-process calls for network calls, so you pay for latency, partial failure, distributed transactions, eventual consistency, versioned contracts and a lot more operational tooling (tracing, per-service CI/CD, on-call), which eight people building an unproven product cannot afford. The failure mode to avoid is a distributed monolith: services that share a database or must be deployed together, which has every cost and none of the benefits. I would split a module out when there is a concrete driver: a part that must scale or deploy independently, a different reliability or security profile, or a separate team that is blocked by shared releases. Because the module already owns its data and has an explicit interface, extracting it is a strangler-style migration rather than a rewrite.',
    rubric: [
      'Recommends a modular monolith with bounded-context boundaries for a small team and new product',
      'Names concrete costs: network failure, latency, data consistency, operational overhead',
      'Identifies the distributed monolith (shared DB, lockstep deploys) as the anti-pattern',
      'Gives real split drivers: independent scaling or deploys, team autonomy, different reliability needs',
      'Mentions data ownership per service and an incremental (strangler) extraction path',
    ],
    tags: ['microservices', 'modular-monolith', 'bounded-context', 'trade-offs'],
    source: 'notion',
    explanation:
      'Microservices are primarily an organizational scaling tool: they let independent teams deploy independently. Without that pressure, their costs dominate.\n\n**Say this out loud:** "Microservices solve team and deployment coupling at the price of distributed-systems problems. I start with a modular monolith with clear data ownership and extract a service when a scaling, reliability or team boundary actually demands it."',
  },
  {
    id: 'distributed-systems-shared-database',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'microservices',
    level: 'mid',
    kind: 'single',
    prompt:
      'The `orders` and `invoicing` services both read and write the same `orders` table in one shared Postgres database. What is the main architectural problem?',
    options: [
      {
        id: 'a',
        text: 'The table schema has become a shared contract: neither service can change it or deploy independently without coordinating, so they are coupled like a monolith',
      },
      { id: 'b', text: 'Postgres cannot handle connections from two different services' },
      { id: 'c', text: 'It forces both services to be written in the same language' },
      { id: 'd', text: 'Reads become eventually consistent between the two services' },
    ],
    answer: 'a',
    tags: ['microservices', 'database-per-service', 'coupling'],
    source: 'notion',
    explanation:
      'Each microservice should own its data and expose it only through its API or events (database per service). A shared table leaks internal structure: renaming a column, adding a constraint or changing an index is now a cross-team, lockstep release, and one service can bypass the other\'s invariants. If `invoicing` needs order data, `orders` should publish events (and `invoicing` keeps its own read model) or expose an API. The consistency trade-off moves the other way: a shared database is strongly consistent, which is exactly why it is tempting.',
  },
  {
    id: 'distributed-systems-kafka-ordering-keys',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'kafka',
    level: 'mid',
    kind: 'single',
    prompt:
      'Events `created`, `paid` and `shipped` for the same order must be processed in order. The topic has 12 partitions and the producer sends messages **without a key**. Consumers sometimes see `shipped` before `paid`. What is the right fix?',
    options: [
      { id: 'a', text: 'Use the order ID as the message key, so all events for one order land on the same partition, where Kafka preserves order' },
      { id: 'b', text: 'Reduce the topic to a single partition' },
      { id: 'c', text: 'Have the consumer sort messages by their timestamp before processing' },
      { id: 'd', text: 'Enable exactly-once transactions on the producer' },
    ],
    answer: 'a',
    tags: ['kafka', 'partitions', 'ordering', 'message-keys'],
    source: 'topic-list',
    explanation:
      'Kafka only guarantees order **within a partition**. Without a key, messages are spread across partitions and consumed in parallel, so per-order order is lost. Keying by the entity whose order matters (`orderId`) hashes all its events to one partition while different orders still spread across all 12, keeping parallelism. A single partition also works but caps throughput at one consumer. Timestamps from different producers are not a reliable order. Two extra details: keep the idempotent producer enabled so retries do not reorder or duplicate within a partition, and remember that adding partitions later changes the key-to-partition mapping.',
  },
  {
    id: 'distributed-systems-kafka-consumer-groups',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'kafka',
    level: 'junior',
    kind: 'single',
    prompt: 'A topic has 4 partitions. You start 6 consumer instances, all in the same consumer group. What happens?',
    options: [
      { id: 'a', text: '4 consumers each own one partition and 2 consumers sit idle as standbys' },
      { id: 'b', text: 'All 6 consumers receive every message' },
      { id: 'c', text: 'Kafka splits the partitions so each consumer gets two thirds of a partition' },
      { id: 'd', text: 'The group fails to start because consumers must equal partitions' },
    ],
    answer: 'a',
    tags: ['kafka', 'consumer-groups', 'scaling'],
    source: 'topic-list',
    explanation:
      'Within one consumer group, each partition is assigned to **exactly one** consumer, so the partition count caps the group\'s parallelism; extra consumers stay idle until a rebalance gives them a partition (for example when another instance dies). Different consumer groups each receive every message independently, which is how several services subscribe to the same topic. To scale a consumer further you add partitions, keeping in mind that it changes key placement.',
  },
  {
    id: 'distributed-systems-kafka-delivery-semantics',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'kafka',
    level: 'senior',
    kind: 'multi',
    prompt: 'Which statements about Kafka delivery guarantees are true? Select all that apply.',
    options: [
      {
        id: 'a',
        text: 'If a consumer commits the offset only after its side effect completes, a crash between the two re-delivers the message, so the handler must be idempotent',
      },
      { id: 'b', text: 'The idempotent producer (`enable.idempotence=true`) prevents duplicates caused by producer retries within a partition' },
      { id: 'c', text: 'Kafka transactions give exactly-once processing end to end even when the consumer writes to an external Postgres database' },
      { id: 'd', text: 'Committing offsets before (or independently of) processing can lose messages if the consumer crashes after the commit' },
      { id: 'e', text: 'Adding more consumers than partitions to a group increases throughput proportionally' },
    ],
    answer: ['a', 'b', 'd'],
    tags: ['kafka', 'at-least-once', 'exactly-once', 'idempotency'],
    source: 'topic-list',
    explanation:
      'Commit-after-processing is **at-least-once** (duplicates possible); commit-before-processing is **at-most-once** (loss possible). The idempotent producer de-duplicates retries per partition using producer IDs and sequence numbers. Kafka transactions give exactly-once only for read-process-write **within Kafka**; once a side effect leaves Kafka (a database row, an email, a payment), you get effectively-once by making the consumer idempotent, for example by storing processed message IDs or the consumed offset in the same database transaction. Extra consumers beyond the partition count are idle.\n\n**Say this out loud:** "I design for at-least-once and make consumers idempotent; exactly-once is a Kafka-internal guarantee, and anything with external side effects needs dedupe keys or offsets stored transactionally with the write."',
  },
  {
    id: 'distributed-systems-dlq-routing',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'dead-letter-queues',
    level: 'mid',
    kind: 'fix',
    language: 'javascript',
    prompt:
      "Each message lists the handler's outcome per attempt (`'ok'`, `'timeout'` or `'invalid'`; if the list runs out, the last outcome repeats). The consumer must:\n\n- mark the message processed on `'ok'`;\n- retry a **transient** failure (`'timeout'`) until it has made `maxAttempts` attempts in total, then dead-letter it with reason `'retries-exhausted'`;\n- dead-letter a **permanent** failure (`'invalid'`) immediately, without retrying, with reason `'invalid'`.\n\nEach dead-letter entry records `{ id, reason, attempts }`. The current implementation has two bugs. Fix them.",
    starter: `const PERMANENT = new Set(['invalid']);

function outcomeAt(message, attempt) {
  const { outcomes } = message;
  return outcomes[Math.min(attempt - 1, outcomes.length - 1)];
}

export function solution(messages, maxAttempts) {
  const processed = [];
  const deadLettered = [];
  for (const message of messages) {
    let attempt = 1;
    while (true) {
      const outcome = outcomeAt(message, attempt);
      if (outcome === 'ok') {
        processed.push(message.id);
        break;
      }
      if (attempt > maxAttempts) {
        deadLettered.push({ id: message.id, reason: 'retries-exhausted', attempts: attempt });
        break;
      }
      attempt += 1;
    }
  }
  return { processed, deadLettered };
}`,
    tests: [
      { name: 'succeeds first time', args: [[{ id: 'a', outcomes: ['ok'] }], 3], expected: { processed: ['a'], deadLettered: [] } },
      { name: 'recovers after transient failures', args: [[{ id: 'b', outcomes: ['timeout', 'timeout', 'ok'] }], 3], expected: { processed: ['b'], deadLettered: [] } },
      {
        name: 'exhausts retries at maxAttempts',
        args: [[{ id: 'c', outcomes: ['timeout'] }], 3],
        expected: { processed: [], deadLettered: [{ id: 'c', reason: 'retries-exhausted', attempts: 3 }] },
      },
      {
        name: 'permanent failure is not retried',
        args: [[{ id: 'd', outcomes: ['invalid', 'ok'] }], 5],
        expected: { processed: [], deadLettered: [{ id: 'd', reason: 'invalid', attempts: 1 }] },
      },
      {
        name: 'mixed batch keeps order',
        args: [
          [
            { id: 'e', outcomes: ['timeout', 'ok'] },
            { id: 'f', outcomes: ['timeout', 'invalid'] },
            { id: 'g', outcomes: ['timeout'] },
          ],
          2,
        ],
        expected: {
          processed: ['e'],
          deadLettered: [
            { id: 'f', reason: 'invalid', attempts: 2 },
            { id: 'g', reason: 'retries-exhausted', attempts: 2 },
          ],
        },
      },
    ],
    solution: `const PERMANENT = new Set(['invalid']);

function outcomeAt(message, attempt) {
  const { outcomes } = message;
  return outcomes[Math.min(attempt - 1, outcomes.length - 1)];
}

export function solution(messages, maxAttempts) {
  const processed = [];
  const deadLettered = [];
  for (const message of messages) {
    let attempt = 1;
    while (true) {
      const outcome = outcomeAt(message, attempt);
      if (outcome === 'ok') {
        processed.push(message.id);
        break;
      }
      if (PERMANENT.has(outcome)) {
        deadLettered.push({ id: message.id, reason: outcome, attempts: attempt });
        break;
      }
      if (attempt >= maxAttempts) {
        deadLettered.push({ id: message.id, reason: 'retries-exhausted', attempts: attempt });
        break;
      }
      attempt += 1;
    }
  }
  return { processed, deadLettered };
}`,
    tags: ['dlq', 'retries', 'poison-message', 'error-classification'],
    source: 'notion',
    explanation:
      'Bug 1: `attempt > maxAttempts` allows one attempt too many (4 attempts for `maxAttempts = 3`). Bug 2: permanent errors are retried like transient ones. Retrying a malformed payload or a failed validation can never succeed: it only burns time, delays every message behind it on an ordered partition, and hammers dependencies. Classify errors first: transient (timeouts, 503, throttling) get bounded retries with backoff; permanent (validation, deserialization, 4xx business rejections) go straight to the dead-letter queue.\n\nA useful DLQ entry carries the original payload plus metadata (error, attempt count, source topic and offset, correlation ID) so someone can inspect, fix and **redrive** it. Alert on DLQ depth; a DLQ nobody watches is data loss with extra steps.',
  },
  {
    id: 'distributed-systems-poison-message',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'dead-letter-queues',
    level: 'junior',
    kind: 'single',
    prompt:
      'A consumer reads an ordered Kafka partition. One message contains malformed JSON: the handler throws, the offset is not committed, the consumer restarts and hits the same message again, forever. Nothing behind it is processed. What is this and what is the standard remedy?',
    options: [
      {
        id: 'a',
        text: 'A poison message: after a bounded number of attempts, publish it with error metadata to a dead-letter topic, commit the offset and alert, so the partition keeps flowing',
      },
      { id: 'b', text: 'Consumer lag: add more consumers to the group so another one can pick the message up' },
      { id: 'c', text: 'A broker bug: delete and recreate the topic' },
      { id: 'd', text: 'Back-pressure: increase the retry count until the message eventually parses' },
    ],
    answer: 'a',
    tags: ['dlq', 'poison-message', 'kafka'],
    source: 'notion',
    explanation:
      'A message that can never be processed blocks everything behind it when the consumer insists on handling it before committing. The dead-letter queue (or topic) is where such messages are parked with enough context to investigate and redrive later. More consumers do not help because the partition belongs to one consumer, and retrying a deterministic failure never succeeds. SQS offers this natively with a redrive policy (`maxReceiveCount`); on Kafka you implement it in the consumer or framework.',
  },
  {
    id: 'distributed-systems-idempotency-dedupe',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'idempotency',
    level: 'junior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'A webhook endpoint receives events at least once. Implement `solution(events)` that returns the `id`s of the events to process, keeping only the **first** occurrence of each `idempotencyKey`, in arrival order. Events without an `idempotencyKey` cannot be deduplicated and are always kept.',
    starter: `type IncomingEvent = { id: number; idempotencyKey?: string };

export function solution(events: IncomingEvent[]): number[] {
  // TODO
  return [];
}`,
    tests: [
      {
        name: 'drops later duplicates',
        args: [
          [
            { id: 1, idempotencyKey: 'k1' },
            { id: 2, idempotencyKey: 'k1' },
            { id: 3, idempotencyKey: 'k2' },
          ],
        ],
        expected: [1, 3],
      },
      { name: 'keyless events are kept', args: [[{ id: 1 }, { id: 2 }]], expected: [1, 2] },
      {
        name: 'interleaved duplicates',
        args: [
          [
            { id: 1, idempotencyKey: 'a' },
            { id: 2, idempotencyKey: 'b' },
            { id: 3, idempotencyKey: 'a' },
            { id: 4 },
            { id: 5, idempotencyKey: 'b' },
            { id: 6, idempotencyKey: 'c' },
          ],
        ],
        expected: [1, 2, 4, 6],
      },
      { name: 'empty batch', args: [[]], expected: [] },
    ],
    solution: `type IncomingEvent = { id: number; idempotencyKey?: string };

export function solution(events: IncomingEvent[]): number[] {
  const seen = new Set<string>();
  const accepted: number[] = [];
  for (const event of events) {
    const key = event.idempotencyKey;
    if (key === undefined) {
      accepted.push(event.id);
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      accepted.push(event.id);
    }
  }
  return accepted;
}`,
    tags: ['idempotency', 'deduplication', 'set', 'at-least-once'],
    source: 'notion',
    explanation:
      'At-least-once delivery means duplicates are normal, so the consumer turns them into no-ops by remembering which keys it has already handled. A `Set` gives O(1) membership checks and a single pass preserves arrival order. In production the "seen" set is not in memory: it is a table with a unique constraint on the key (insert-or-ignore inside the same transaction as the side effect) or a Redis `SET NX` with a TTL at least as long as the producer\'s retry window.',
  },
  {
    id: 'distributed-systems-idempotency-keys-api',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'idempotency',
    level: 'senior',
    kind: 'open',
    prompt:
      'A mobile client calls `POST /payments`, the request times out, and the client retries. Some customers are charged twice. Design server-side support for an `Idempotency-Key` header.',
    modelAnswer:
      'The client generates a unique key (a UUID) per logical operation and sends it on every retry of that operation. The server stores the key, scoped to the caller (tenant or user), together with a hash of the request body and a status, in a table with a unique constraint. On the first request it inserts the key as `in-progress` inside the same transaction boundary as the payment work, performs the charge, and saves the final status code and response body against the key. A retry with the same key and same body returns the stored response without charging again; the same key with a different body is a client bug and gets a 422; a retry that arrives while the original is still in progress gets a 409 (or waits), which the unique constraint makes race-safe. Keys expire after a window longer than any client retry policy (for example 24 hours). Downstream, I pass the same key to the payment provider, since Stripe and similar APIs support idempotency keys too, so the guarantee holds end to end.',
    rubric: [
      'Client-generated key per logical operation, reused across retries',
      'Server stores key with request fingerprint and the final response, and replays it on retry',
      'Handles concurrent duplicates race-safely (unique constraint or lock, 409 while in progress)',
      'Rejects key reuse with a different payload and scopes keys per tenant or user',
      'Sets a retention window and propagates the key to downstream providers',
    ],
    tags: ['idempotency', 'payments', 'retries', 'rest'],
    source: 'notion',
    explanation:
      'POST is not idempotent by definition, and a timeout does not tell the client whether the charge happened. Idempotency keys make a retry safe by making the **server** remember outcomes.\n\n**Say this out loud:** "Retries are only safe on idempotent operations, so for POST I require an idempotency key: the server records the key with the request hash and the response, replays the stored response on a retry, and a unique constraint makes concurrent duplicates race-safe."',
  },
  {
    id: 'distributed-systems-backoff-full-jitter',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'retries',
    level: 'senior',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement a retry delay schedule using **capped exponential backoff with full jitter**. For retry `i` (starting at 0) the ceiling is `baseMs` doubled `i` times, but never more than `capMs`; the delay is a random value between 0 and that ceiling, rounded down to a whole millisecond.\n\n`draws` stands in for a seeded random function: `draws[i]` is the value in `[0, 1)` to use for retry `i`, which makes the schedule deterministic in tests. Return the `retries` delays in order.',
    starter: `export function solution(retries: number, baseMs: number, capMs: number, draws: number[]): number[] {
  // TODO
  return [];
}`,
    tests: [
      { name: 'doubles under the cap', args: [4, 100, 1000, [0.5, 0.5, 0.5, 0.5]], expected: [50, 100, 200, 400] },
      { name: 'cap applies before jitter', args: [6, 100, 1000, [0.75, 0.5, 0.25, 0.125, 0.5, 0.875]], expected: [75, 100, 100, 100, 500, 875] },
      { name: 'cap below the second step', args: [3, 1000, 1500, [0.5, 0.5, 0.5]], expected: [500, 750, 750] },
      { name: 'zero draw means retry immediately', args: [2, 200, 5000, [0, 0.25]], expected: [0, 100] },
      { name: 'no retries', args: [0, 100, 1000, []], expected: [] },
    ],
    solution: `export function solution(retries: number, baseMs: number, capMs: number, draws: number[]): number[] {
  const delays: number[] = [];
  for (let i = 0; i < retries; i += 1) {
    const ceiling = Math.min(capMs, baseMs * 2 ** i);
    delays.push(Math.floor(draws[i] * ceiling));
  }
  return delays;
}`,
    tags: ['retries', 'exponential-backoff', 'jitter', 'thundering-herd'],
    source: 'notion',
    explanation:
      'Exponential backoff gives a struggling dependency room to recover; the cap keeps the worst-case wait bounded. **Jitter** is the part people forget: without it, every client that failed at the same moment retries at the same moment (a thundering herd), re-creating the spike that caused the failure. Full jitter (`random(0, min(cap, base * 2^i))`) spreads retries across the whole window and, in AWS\'s analysis, finishes the total work with the fewest calls. The cap must apply **before** the jitter, otherwise delays can exceed it.\n\nTaking the randomness as an input (a seeded generator or pre-drawn values) is what makes retry logic unit-testable. Also bound the total: a max attempt count or a deadline, honor `Retry-After` on 429/503, and only retry idempotent operations.\n\n**Say this out loud:** "Retries use capped exponential backoff with full jitter to avoid synchronized retry storms, a bounded attempt budget, and only on idempotent operations or requests carrying an idempotency key."',
  },
  {
    id: 'distributed-systems-what-to-retry',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'retries',
    level: 'mid',
    kind: 'multi',
    prompt: 'Your HTTP client wrapper retries automatically with backoff. Which failures should it retry? Select all that apply.',
    options: [
      { id: 'a', text: '`503 Service Unavailable` on `GET /orders/42`' },
      { id: 'b', text: '`429 Too Many Requests` with a `Retry-After: 2` header, waiting at least 2 seconds' },
      { id: 'c', text: 'A connection reset on `POST /payments` that carries an `Idempotency-Key` header' },
      { id: 'd', text: '`400 Bad Request` because a required field is missing' },
      { id: 'e', text: 'A timeout on `POST /payments` sent **without** an idempotency key' },
    ],
    answer: ['a', 'b', 'c'],
    tags: ['retries', 'http-status-codes', 'idempotency'],
    source: 'notion',
    explanation:
      'Retry when the failure is **transient** *and* repeating the request is **safe**. A 503 on a GET is both. A 429 is transient by definition and the server told you when to come back. A network failure on a POST is safe to retry only because the idempotency key lets the server deduplicate. A 400 is deterministic: the same request fails the same way. A timed-out POST without a key may already have succeeded, so retrying can double-charge; surface the error or reconcile instead. Also put a circuit breaker around the dependency so retries stop when it is clearly down.',
  },
  {
    id: 'distributed-systems-correlation-propagation',
    domain: 'architecture',
    subject: 'distributed-systems',
    topic: 'correlation-ids-and-tracing',
    level: 'mid',
    kind: 'fix',
    language: 'javascript',
    prompt:
      "`solution(incoming, ids)` builds the headers for a downstream call. Rules:\n\n- Reuse the caller's correlation ID from the `x-correlation-id` header, matched **case-insensitively**; if it is missing or empty, use `ids.correlationId`. Always send it as lowercase `x-correlation-id`.\n- If the incoming W3C `traceparent` is valid (`00-<32 hex trace-id>-<16 hex parent-id>-<2 hex flags>`, lowercase), send a **child** `traceparent`: same version, trace-id and flags, but with `ids.spanId` as the parent-id. If it is missing or invalid, omit `traceparent`.\n\nFix the current implementation.",
    starter: `export function solution(incoming, ids) {
  const correlationId = incoming['x-correlation-id'] || ids.correlationId;
  const outgoing = { 'x-correlation-id': correlationId };
  if (incoming.traceparent) {
    outgoing.traceparent = incoming.traceparent;
  }
  return outgoing;
}`,
    tests: [
      {
        name: 'reuses mixed-case header and creates a child span',
        args: [
          { 'X-Correlation-Id': 'abc-123', traceparent: '00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01' },
          { correlationId: 'gen-1', spanId: 'b7ad6b7169203331' },
        ],
        expected: { 'x-correlation-id': 'abc-123', traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01' },
      },
      {
        name: 'generates when absent',
        args: [{}, { correlationId: 'gen-1', spanId: 'b7ad6b7169203331' }],
        expected: { 'x-correlation-id': 'gen-1' },
      },
      {
        name: 'empty header counts as absent',
        args: [{ 'x-correlation-id': '' }, { correlationId: 'gen-2', spanId: 'b7ad6b7169203331' }],
        expected: { 'x-correlation-id': 'gen-2' },
      },
      {
        name: 'invalid traceparent is dropped',
        args: [{ 'x-correlation-id': 'req-9', traceparent: 'garbage' }, { correlationId: 'gen-3', spanId: 'b7ad6b7169203331' }],
        expected: { 'x-correlation-id': 'req-9' },
      },
    ],
    solution: `const TRACEPARENT = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

function header(headers, name) {
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return match === undefined ? undefined : headers[match];
}

export function solution(incoming, ids) {
  const correlationId = header(incoming, 'x-correlation-id') || ids.correlationId;
  const outgoing = { 'x-correlation-id': correlationId };
  const parsed = TRACEPARENT.exec(header(incoming, 'traceparent') ?? '');
  if (parsed) {
    const [, version, traceId, , flags] = parsed;
    outgoing.traceparent = \`\${version}-\${traceId}-\${ids.spanId}-\${flags}\`;
  }
  return outgoing;
}`,
    tags: ['correlation-id', 'distributed-tracing', 'w3c-trace-context', 'opentelemetry'],
    source: 'notion',
    explanation:
      "HTTP header names are case-insensitive. Node's `req.headers` lowercases them for you, but headers from queues, Lambda events, test fixtures or other frameworks often do not, so a case-sensitive lookup silently starts a new correlation ID and splits one request's logs in two.\n\nA correlation ID ties log lines together; a trace adds structure. In W3C Trace Context the **trace-id** stays constant across the whole request while each hop sends its **own span ID** as the parent-id, which is how a tracing backend (OpenTelemetry, Jaeger, X-Ray) rebuilds the call tree. Forwarding the incoming `traceparent` unchanged would attach the downstream span to the wrong parent. In practice the OpenTelemetry SDK does this propagation for you; the principle to know is: accept, validate, generate if missing, log it on every line, and forward it on every outgoing call and message.",
  },
];
