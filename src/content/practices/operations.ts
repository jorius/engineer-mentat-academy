// engine
import type { Question } from '../../engine/question';

const traceLogs = [
  { ts: 105, service: 'orders', correlationId: 'req-7', level: 'info', msg: 'reserve stock' },
  { ts: 100, service: 'gateway', correlationId: 'req-7', level: 'info', msg: 'POST /checkout' },
  { ts: 101, service: 'gateway', correlationId: 'req-9', level: 'info', msg: 'GET /health' },
  { ts: 112, service: 'payments', correlationId: 'req-7', level: 'error', msg: 'upstream timeout' },
  { ts: 108, service: 'orders', correlationId: 'req-7', level: 'info', msg: 'stock reserved' },
  { ts: 118, service: 'orders', correlationId: 'req-7', level: 'error', msg: 'payment failed, releasing stock' },
  { ts: 120, service: 'gateway', correlationId: 'req-7', level: 'info', msg: '502 returned' },
  { ts: 102, service: 'gateway', correlationId: 'req-9', level: 'info', msg: '200 returned' },
];

export const questions: Question[] = [
  {
    id: 'operations-production-debugging-stack-trace',
    domain: 'practices',
    subject: 'operations',
    topic: 'production-debugging',
    level: 'junior',
    kind: 'single',
    prompt:
      'A production alert links to this error:\n\n```text\nTypeError: Cannot read properties of undefined (reading \'email\')\n    at formatRecipient (/app/dist/notify.js:42:19)\n    at sendReceipt (/app/dist/notify.js:18:10)\n    at OrderService.complete (/app/dist/orders/service.js:77:5)\n    at async /app/dist/routes/orders.js:31:3\n```\n\nWhat is the most accurate reading?',
    options: [
      { id: 'a', text: 'The bug is in `routes/orders.js:31`, because that is where the request started' },
      { id: 'b', text: '`formatRecipient` threw because something it reads `.email` from is `undefined`; the top frame is where it crashed, but the bad value probably came from a caller, so read down the frames (and map `dist` lines back to source with source maps)' },
      { id: 'c', text: 'The `email` column is missing from the database' },
      { id: 'd', text: 'The error is inside Node.js internals, since the paths point at `dist`' },
    ],
    answer: 'b',
    tags: ['stack-traces', 'source-maps'],
    source: 'topic-list',
    explanation:
      'A stack trace reads top-down from the **throw site** to the **entry point**. The message says an object was `undefined` when `.email` was read, not that `email` was missing (that would give `undefined`, not a `TypeError`). The top frame tells you where it crashed; the root cause is often a few frames down, where `sendReceipt` or `OrderService.complete` passed a missing customer. Paths under `dist` are compiled output: enable source maps (`node --enable-source-maps`, or upload them to your error tracker) so line numbers point at your TypeScript. The `async` frame shows the trace survived an `await` thanks to V8 async stack traces.',
  },
  {
    id: 'operations-production-debugging-correlation-ids',
    domain: 'practices',
    subject: 'operations',
    topic: 'production-debugging',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Log lines from several services are shipped to one store and arrive **out of order**. Every line carries the `correlationId` the gateway assigned to the incoming request.\n\nImplement `solution(logs, correlationId)` returning:\n\n- `path`: the services that handled that request, in timestamp order, with **consecutive** duplicates collapsed (`orders, orders` becomes `orders`, but `orders, payments, orders` stays);\n- `firstError`: `"<service>: <msg>"` for the earliest `error`-level line of that request, or `null`.',
    starter: `type LogLine = { ts: number; service: string; correlationId: string; level: 'info' | 'error'; msg: string };

export function solution(logs: LogLine[], correlationId: string): { path: string[]; firstError: string | null } {
  return { path: [], firstError: null };
}`,
    tests: [
      {
        name: 'reconstructs the failing checkout',
        args: [traceLogs, 'req-7'],
        expected: { path: ['gateway', 'orders', 'payments', 'orders', 'gateway'], firstError: 'payments: upstream timeout' },
      },
      { name: 'healthy request has no error', args: [traceLogs, 'req-9'], expected: { path: ['gateway'], firstError: null } },
      { name: 'unknown id', args: [traceLogs, 'req-404'], expected: { path: [], firstError: null } },
    ],
    solution: `type LogLine = { ts: number; service: string; correlationId: string; level: 'info' | 'error'; msg: string };

export function solution(logs: LogLine[], correlationId: string): { path: string[]; firstError: string | null } {
  const lines = logs.filter((l) => l.correlationId === correlationId).sort((a, b) => a.ts - b.ts);
  const path: string[] = [];
  for (const line of lines) {
    if (path[path.length - 1] !== line.service) path.push(line.service);
  }
  const error = lines.find((l) => l.level === 'error');
  return { path, firstError: error ? error.service + ': ' + error.msg : null };
}`,
    tags: ['correlation-ids', 'structured-logging', 'distributed-tracing'],
    source: 'topic-list',
    explanation:
      'The correlation id is the only thing that ties lines from different services to one user request, so it must be generated (or accepted from `X-Request-Id` / `traceparent`) at the edge, propagated on every outgoing call and message, and attached to every log line (in Node, typically via `AsyncLocalStorage` so you do not thread it through every function). Note that the first error is in **payments**, while the error most people would see first is the `orders` one or the gateway `502`: sorting by time and reading the earliest error is how you find the root cause instead of the loudest symptom. Clock skew between hosts makes timestamps approximate; real tracing (OpenTelemetry spans with parent ids) fixes ordering by causality.',
  },
  {
    id: 'operations-production-debugging-rollback-vs-flag',
    domain: 'practices',
    subject: 'operations',
    topic: 'production-debugging',
    level: 'senior',
    kind: 'open',
    prompt:
      'Twenty minutes after a deploy, checkout error rate jumps from 0.2% to 8%. The release contained a new pricing engine (behind a feature flag), a dependency upgrade, and a database migration that added a column. You are the on-call senior. **Walk me through the first 30 minutes.**',
    modelAnswer:
      'Mitigate first, diagnose second: customers are failing to pay now. I declare an incident, take the incident-commander or ops role, and post in the incident channel so support and stakeholders know. The cheapest, fastest lever is the feature flag: I turn the new pricing engine off and watch the error-rate graph, because flags decouple deploy from release and act in seconds. If errors persist, the cause is probably the dependency upgrade, so I roll back to the previous build; that is safe here because the migration only **added** a nullable column (expand/contract), so old code still runs against the new schema. A destructive migration would make rollback unsafe, which is why we write migrations backward compatible. While mitigating, I pull a few failing requests by correlation id and read their traces and stack traces, and compare dashboards before and after the deploy marker. Once the error rate is back to baseline, I keep the flag off, preserve logs, and schedule a blameless postmortem with timeline, root cause and follow-ups such as a canary rollout or automatic rollback on error-rate SLO burn.',
    rubric: [
      'Prioritises mitigation (flag off, rollback) over root-cause analysis while users are impacted',
      'Uses the feature flag as the first, fastest lever and explains deploy vs release',
      'Checks rollback safety against the migration (backward-compatible, expand/contract)',
      'Uses correlation ids, traces and the deploy marker on dashboards to confirm the cause',
      'Communicates during the incident and follows up with a blameless postmortem and prevention (canary, auto-rollback)',
    ],
    tags: ['incident-response', 'feature-flags', 'rollbacks', 'migrations'],
    source: 'topic-list',
    explanation:
      'Interviewers look for ordering: stop the bleeding, then find the cause, then prevent recurrence. The migration detail tests whether you know rollbacks are not always free.\n\n**Say this out loud:** "First I mitigate: flag off, then roll back if needed, having checked the migration is backward compatible. Only once customers are safe do I dig into traces by correlation id, and afterwards we run a blameless postmortem."',
  },
  {
    id: 'operations-logging-structured-and-levels',
    domain: 'practices',
    subject: 'operations',
    topic: 'logging-and-monitoring',
    level: 'junior',
    kind: 'multi',
    prompt: 'Which of these are good logging practices for a production Node.js API? Select all that apply.',
    options: [
      { id: 'a', text: 'Emit JSON logs with stable field names such as `requestId`, `userId`, `route`, `durationMs`' },
      { id: 'b', text: 'Log the full request body and headers on every request so debugging is easier' },
      { id: 'c', text: 'Reserve `error` for failures someone must act on, `warn` for degraded-but-handled cases, `info` for key business events, and keep `debug` off in production by default' },
      { id: 'd', text: 'Log every `404` and validation failure at `error` level' },
      { id: 'e', text: 'Build messages by interpolation, like `"User 42 failed login from 10.0.0.1"`, instead of separate fields' },
    ],
    answer: ['a', 'c'],
    tags: ['structured-logging', 'log-levels', 'pii'],
    source: 'topic-list',
    explanation:
      'Structured logs (pino, winston with a JSON formatter) are queryable: `route="/checkout" AND durationMs > 1000` is a filter, while interpolated strings need fragile regexes. Full bodies and headers leak passwords, `Authorization` tokens and personal data into a system with weaker access controls and long retention; redact by default. Levels are a contract with whoever reads the logs and whatever alerts on them: a client sending a bad request is expected behaviour (`info` or `warn`), and logging it as `error` buries real failures.',
  },
  {
    id: 'operations-logging-red-vs-use',
    domain: 'practices',
    subject: 'operations',
    topic: 'logging-and-monitoring',
    level: 'mid',
    kind: 'single',
    prompt: 'You are building a dashboard for the **Postgres connection pool** used by your API (not for the API endpoints themselves). Which method fits, and what do you chart?',
    options: [
      { id: 'a', text: 'RED: requests per second, error rate and duration of pool queries' },
      { id: 'b', text: 'USE: utilization (connections in use / pool max), saturation (requests waiting for a connection and their wait time), errors (acquire timeouts, connection failures)' },
      { id: 'c', text: 'Only CPU and memory of the database host, since the pool is just a library' },
      { id: 'd', text: 'Log volume per minute, because more logs means more load' },
    ],
    answer: 'b',
    tags: ['red-method', 'use-method', 'metrics', 'observability'],
    source: 'topic-list',
    explanation:
      '**RED** (Rate, Errors, Duration, from Tom Wilkie) describes **request-driven services** from the caller\'s point of view: it is what you chart for the API endpoints. **USE** (Utilization, Saturation, Errors, from Brendan Gregg) describes **resources**: CPUs, disks, thread pools, connection pools, queues. Saturation is the metric teams forget and the one that explains latency: a pool at 100% utilization with 50 waiters shows up as slow requests in RED while CPU looks fine. The two compose: RED tells you *that* users are hurting, USE tells you *which resource* is the bottleneck.',
  },
  {
    id: 'operations-logging-alert-fatigue',
    domain: 'practices',
    subject: 'operations',
    topic: 'logging-and-monitoring',
    level: 'senior',
    kind: 'multi',
    prompt:
      'The on-call pager fires about 40 times a week, most alerts auto-resolve within minutes, and engineers have started ignoring it. Which changes reduce alert fatigue **without** losing real incidents? Select all that apply.',
    options: [
      { id: 'a', text: 'Page on user-facing symptoms (SLO burn rate on errors and latency) and demote cause-based alerts like "CPU > 80%" to dashboards or tickets' },
      { id: 'b', text: 'Require every paging alert to be actionable and linked to a runbook; delete or downgrade alerts nobody acted on in the last month' },
      { id: 'c', text: 'Add a duration (`for: 5m`) or multi-window burn-rate conditions so brief spikes do not page' },
      { id: 'd', text: 'Mute the noisiest alerts for the rest of the quarter' },
      { id: 'e', text: 'Route non-urgent alerts to a ticket queue reviewed during working hours instead of the pager' },
    ],
    answer: ['a', 'b', 'c', 'e'],
    tags: ['alerting', 'slo', 'on-call'],
    source: 'topic-list',
    explanation:
      'A page should mean "a human must act now to protect users". Symptom-based alerts on SLOs catch every cause that hurts users, including ones nobody predicted, while cause-based thresholds fire when nothing is wrong (CPU at 85% during a healthy batch job). Durations and multi-window burn rates filter flapping. Runbooks and a regular alert review keep the set honest. Muting without a replacement (d) just hides the signal and is how real incidents get missed.\n\n**Say this out loud:** "I page on symptoms, not causes: SLO burn-rate alerts on errors and latency, each one actionable with a runbook, and everything else goes to a ticket or a dashboard."',
  },
  {
    id: 'operations-performance-percentiles',
    domain: 'practices',
    subject: 'operations',
    topic: 'performance-optimization',
    level: 'mid',
    kind: 'code',
    language: 'typescript',
    prompt:
      'Implement `solution(samples)` that takes request latencies in milliseconds (unsorted) and returns `{ p50, p95, p99 }` using the **nearest-rank** method: sort ascending, then the p-th percentile is the value at 1-based rank `ceil(p / 100 * n)`. For an empty array return `null` for all three. Do not mutate the input.',
    starter: `type Percentiles = { p50: number | null; p95: number | null; p99: number | null };

export function solution(samples: number[]): Percentiles {
  return { p50: 0, p95: 0, p99: 0 };
}`,
    tests: [
      { name: '1..100', args: [Array.from({ length: 100 }, (_, i) => i + 1)], expected: { p50: 50, p95: 95, p99: 99 } },
      { name: 'single sample', args: [[42]], expected: { p50: 42, p95: 42, p99: 42 } },
      { name: 'numeric sort, not lexicographic', args: [[100, 20, 3, 9]], expected: { p50: 9, p95: 100, p99: 100 } },
      { name: 'one outlier in twenty', args: [[...Array.from({ length: 19 }, () => 10), 1000]], expected: { p50: 10, p95: 10, p99: 1000 } },
      { name: 'empty input', args: [[]], expected: { p50: null, p95: null, p99: null } },
    ],
    solution: `type Percentiles = { p50: number | null; p95: number | null; p99: number | null };

export function solution(samples: number[]): Percentiles {
  if (samples.length === 0) return { p50: null, p95: null, p99: null };
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (p: number): number => sorted[Math.max(1, Math.ceil((p * sorted.length) / 100)) - 1];
  return { p50: at(50), p95: at(95), p99: at(99) };
}`,
    tags: ['percentiles', 'latency', 'metrics'],
    source: 'topic-list',
    explanation:
      'Two traps: `Array.prototype.sort()` without a comparator sorts **as strings** (`[100, 20, 3, 9]` stays in that order), and sorting in place mutates the caller\'s array, so copy first. Computing `(p * n) / 100` instead of `(p / 100) * n` keeps the arithmetic on integers and avoids floating-point surprises right at a rank boundary.\n\nWhy percentiles: the mean of the outlier test is about 60 ms, which describes no real request. p50 is the typical user, p99 is the tail that one in a hundred requests hits (and a page making 20 API calls hits it far more often). Note that p95 of 20 samples still hides the outlier: tail percentiles need enough samples. In production you cannot average percentiles across hosts; you aggregate **histograms** (Prometheus buckets, HDR histograms) and compute percentiles from the merged distribution.',
  },
  {
    id: 'operations-performance-slow-page-approach',
    domain: 'practices',
    subject: 'operations',
    topic: 'performance-optimization',
    level: 'senior',
    kind: 'open',
    prompt:
      'Product says the product detail page "feels slow". Field data shows LCP of 4.5 s on mobile, INP of 450 ms, and the product API at p95 1.2 s. **How do you approach this, and which levers do you expect to pull?**',
    modelAnswer:
      'I start by measuring, not guessing: real-user data (CrUX or our RUM) tells me which metric fails for which users, and then I profile, using the Chrome Performance panel and Lighthouse for the frontend and APM traces or a CPU profile (flame graph) for the API, to find where the time actually goes. For LCP I identify the LCP element and break it into TTFB, resource load delay, load time and render delay: a slow API inflates TTFB if we render on the server, and a hero image discovered late needs `preload` or `fetchpriority="high"`, never `loading="lazy"`, plus modern formats and responsive sizes from a CDN. For INP I look for long tasks on the main thread: split or defer work, debounce input handlers, virtualize long lists, and move heavy computation off the main thread. For the API I check the trace for N+1 queries and missing indexes before adding caching; then I cache in layers: HTTP `Cache-Control`/`ETag` for the browser, the CDN edge for public responses, an application cache such as Redis with a TTL and an invalidation plan for expensive reads. I also check bundle size and code-split routes so less JavaScript competes with rendering. Every change is verified against the same field metrics, because a lab improvement that users do not see is not an improvement.',
    rubric: [
      'Measures first: field data plus profiling (performance panel, APM traces, flame graphs) before changing code',
      'Maps symptoms to Core Web Vitals levers: LCP (preload, image optimisation, TTFB), INP (long tasks, debounce, virtualization), and mentions CLS',
      'Fixes root causes on the API (N+1, indexes) before adding caches',
      'Describes caching layers (browser, CDN, application cache) and names invalidation or TTL as the hard part',
      'Verifies impact with the same real-user metrics after the change',
    ],
    tags: ['core-web-vitals', 'profiling', 'caching', 'lcp', 'inp'],
    source: 'notion',
    explanation:
      'The senior signal is the order of operations: measure, find the bottleneck, fix the cause, cache what is still expensive, and verify with field data. LCP measures loading, INP responsiveness, CLS visual stability; each has different levers, and mixing them up (lazy-loading the hero image, memoizing components to fix a slow image) is a classic mid-level mistake.\n\n**Say this out loud:** "I profile before I optimise. I break LCP into its phases, fix the real bottleneck, add caching in layers with a clear invalidation story, and prove the win with real-user metrics, not a single Lighthouse run."',
  },
];
